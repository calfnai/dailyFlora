import './styles.css';
import { todayKey } from './random';
import { createDailySpec } from './spec';

type Vec3 = [number, number, number];

const canvasElement = document.querySelector<HTMLCanvasElement>('#td-canvas');
const dateElement = document.querySelector<HTMLElement>('#td-date');
const themeElement = document.querySelector<HTMLElement>('#td-theme');

if (!canvasElement || !dateElement || !themeElement) {
  throw new Error('DailyFlora_TD could not find the required page elements.');
}

const params = new URLSearchParams(window.location.search);
const date = params.get('date') || todayKey();
const seed = params.get('seed') || date;
const themeId = params.get('theme') || undefined;
const spec = createDailySpec(date, seed, themeId);
const canvas = canvasElement;
const dateLabel = dateElement;
const themeLabel = themeElement;
const webgl = canvas.getContext('webgl', {
  alpha: false,
  antialias: false,
  powerPreference: 'high-performance'
});

if (!webgl) {
  throw new Error('DailyFlora_TD requires WebGL.');
}

const gl = webgl;

dateLabel.textContent = spec.dateLabel;
themeLabel.textContent = spec.theme.name;
document.title = `DailyFlora_TD - ${spec.theme.name}`;

const vertexSource = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uGlow;
uniform vec3 uBackground;
varying vec2 vUv;

#define PI 3.141592653589793

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += noise(p) * amp;
    p = rot * p * 2.02 + 7.1;
    amp *= 0.52;
  }
  return value;
}

float line(float value, float target, float width) {
  return exp(-pow(abs(value - target) / width, 1.65));
}

float petalField(vec2 p, float layer, float petals, float phase) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float fold = 0.5 + 0.5 * cos(a * petals + phase);
  float spine = pow(fold, 2.4 + layer * 0.2);
  float radius = 0.1 + layer * 0.055 + spine * (0.28 + layer * 0.018);
  float edge = line(r, radius, 0.018 + layer * 0.004);
  float fill = smoothstep(radius + 0.08, radius - 0.04, r) * spine;
  return edge * 0.85 + fill * 0.12;
}

float starGrain(vec2 p, float density) {
  vec2 grid = floor(p * density);
  vec2 cell = fract(p * density) - 0.5;
  float h = hash(grid + uSeed);
  float dotShape = smoothstep(0.045, 0.0, length(cell + vec2(h - 0.5, fract(h * 17.3) - 0.5) * 0.24));
  return dotShape * step(0.72, h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 p = uv;
  float t = uTime * 0.08;
  float seedPhase = uSeed * 6.28318;
  float r = length(p);
  float a = atan(p.y, p.x);
  float breath = sin(uTime * 0.34 + seedPhase) * 0.018;

  vec2 flow = vec2(
    fbm(p * 2.0 + vec2(t, seedPhase)),
    fbm(p * 2.0 + vec2(seedPhase, -t))
  ) - 0.5;
  p += flow * (0.045 + breath);

  float bloom = 0.0;
  vec3 color = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float petals = 5.0 + mod(floor(uSeed * 23.0 + fi * 3.0), 8.0);
    float phase = seedPhase + fi * 0.76 + sin(uTime * 0.09 + fi) * 0.22;
    float field = petalField(p * (1.0 + fi * 0.035), fi, petals, phase);
    vec3 layerColor = mix(uPalette0, uPalette1, fract(fi * 0.31 + uSeed));
    layerColor = mix(layerColor, uPalette2, smoothstep(0.45, 1.1, length(p)) * 0.45);
    color += layerColor * field * (0.48 + fi * 0.032);
    bloom += field;
  }

  float core = exp(-r * r * 24.0);
  float halo = exp(-r * 2.3) * 0.44;
  float corona = line(r, 0.42 + sin(a * 8.0 + seedPhase) * 0.025, 0.018) * 0.35;
  float veins = pow(abs(sin(a * (18.0 + floor(uSeed * 8.0)) + fbm(p * 3.0) * 3.0)), 34.0);
  veins *= smoothstep(0.12, 0.7, r) * smoothstep(1.15, 0.22, r);
  float dust = starGrain(p + flow * 0.2, 42.0) + starGrain(p * 1.4 + 4.0, 66.0) * 0.55;
  float fieldNoise = fbm(p * 4.4 + t) * 0.22;

  vec3 bg = mix(uBackground * 0.42, uBackground * 1.3, smoothstep(0.9, 0.0, r));
  bg += uGlow * halo * 0.22;

  color += uGlow * (core * 0.62 + corona * 0.72 + veins * 0.16 + dust * 0.38);
  color += mix(uPalette1, uGlow, 0.6) * bloom * bloom * 0.09;
  color += fieldNoise * uPalette2 * 0.08;

  float vignette = smoothstep(1.42, 0.14, r);
  color = bg + color * vignette * 0.78;
  color = color / (1.0 + color * 0.42);
  color = pow(color, vec3(0.82));
  gl_FragColor = vec4(color, 1.0);
}
`;

const program = createProgram(vertexSource, fragmentSource);
const positionLocation = gl.getAttribLocation(program, 'position');
const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
const timeLocation = gl.getUniformLocation(program, 'uTime');
const seedLocation = gl.getUniformLocation(program, 'uSeed');
const palette0Location = gl.getUniformLocation(program, 'uPalette0');
const palette1Location = gl.getUniformLocation(program, 'uPalette1');
const palette2Location = gl.getUniformLocation(program, 'uPalette2');
const glowLocation = gl.getUniformLocation(program, 'uGlow');
const backgroundLocation = gl.getUniformLocation(program, 'uBackground');
const positionBuffer = gl.createBuffer();

if (!positionBuffer) {
  throw new Error('DailyFlora_TD could not create a WebGL buffer.');
}

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW
);
gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const palette = spec.theme.palette.map(hexToRgb);
const background = hexToRgb(spec.theme.background);
const glow = hexToRgb(spec.theme.glow);
const seedValue = fract(hashString(`dailyflora-td:${seed}`) / 100000);
let animationId = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function render(now: number) {
  resize();
  gl.useProgram(program);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(timeLocation, now / 1000);
  gl.uniform1f(seedLocation, seedValue);
  setVec3(palette0Location, palette[0] || [1, 0.8, 0.4]);
  setVec3(palette1Location, palette[2] || [0.7, 0.9, 1]);
  setVec3(palette2Location, palette[4] || [1, 0.4, 0.7]);
  setVec3(glowLocation, glow);
  setVec3(backgroundLocation, background);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  animationId = window.requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
window.addEventListener('beforeunload', () => window.cancelAnimationFrame(animationId));
animationId = window.requestAnimationFrame(render);

function createShader(type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('DailyFlora_TD could not create a shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`DailyFlora_TD shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(vertex: string, fragment: string) {
  const nextProgram = gl.createProgram();
  if (!nextProgram) throw new Error('DailyFlora_TD could not create a WebGL program.');
  const vertexShader = createShader(gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(nextProgram, vertexShader);
  gl.attachShader(nextProgram, fragmentShader);
  gl.linkProgram(nextProgram);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(nextProgram);
    gl.deleteProgram(nextProgram);
    throw new Error(`DailyFlora_TD program link failed: ${log}`);
  }
  return nextProgram;
}

function setVec3(location: WebGLUniformLocation | null, value: Vec3) {
  gl.uniform3f(location, value[0], value[1], value[2]);
}

function hexToRgb(hex: string): Vec3 {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  ];
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function fract(value: number) {
  return value - Math.floor(value);
}
