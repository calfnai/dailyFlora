import * as THREE from 'three';
import type { DailyBouquetSpec, QualityProfile } from './types';
import { createRng, hashString } from './random';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const up = new THREE.Vector3(0, 1, 0);
const minCameraPitch = 0.03;
const maxCameraPitch = 1.34;

type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';

type CameraRouteOffsets = {
  yaw: number;
  pitch: number;
  distance: number;
  targetY: number;
};

const emptyRouteOffsets: CameraRouteOffsets = {
  yaw: 0,
  pitch: 0,
  distance: 0,
  targetY: 0
};

function pickColor(colors: readonly string[], value: number) {
  return colors[Math.floor(value * colors.length) % colors.length];
}

function ellipsoidPoint(radius: number, height: number, theta: number, phi: number, asymmetry: number) {
  const sideLean = Math.sin(theta * 2.0) * asymmetry;
  const x = Math.cos(theta) * Math.sin(phi) * radius * (1 + sideLean);
  const z = Math.sin(theta) * Math.sin(phi) * radius * (1 - sideLean * 0.45);
  const y = Math.cos(phi) * height + 0.12;
  return new THREE.Vector3(x, y, z);
}

function makeRadialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.68, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildBranches(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:branches`);
  const positions: number[] = [];
  const colors: number[] = [];
  const branchCount = Math.floor(quality.branchCount * spec.branchDensity);
  const color = new THREE.Color(spec.theme.stem);
  const pale = new THREE.Color(spec.theme.leafPalette[2]);

  for (let i = 0; i < branchCount; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.35, 1.42);
    const radius = rng.range(1.05, 2.02) * spec.theme.wildness;
    const end = ellipsoidPoint(radius, rng.range(1.0, 1.62), theta, phi, spec.asymmetry);
    end.y += spec.haloLift + rng.range(-0.18, 0.44);
    const start = new THREE.Vector3(rng.range(-0.1, 0.1), -0.58 + rng.range(-0.08, 0.06), rng.range(-0.1, 0.1));
    const bend = new THREE.Vector3(
      Math.cos(theta + rng.range(-0.45, 0.45)) * rng.range(0.28, 0.78),
      rng.range(-0.24, 0.42),
      Math.sin(theta + rng.range(-0.45, 0.45)) * rng.range(0.28, 0.78)
    );

    const points = [start];
    for (let j = 1; j <= 4; j += 1) {
      const t = j / 4;
      const p = start.clone().lerp(end, t);
      const sway = Math.sin(t * Math.PI) * rng.range(0.08, 0.38);
      p.addScaledVector(bend, sway);
      p.x += Math.sin(t * 9 + i) * rng.range(-0.035, 0.035);
      p.z += Math.cos(t * 8 + i) * rng.range(-0.035, 0.035);
      points.push(p);
    }

    for (let j = 0; j < points.length - 1; j += 1) {
      positions.push(points[j].x, points[j].y, points[j].z, points[j + 1].x, points[j + 1].y, points[j + 1].z);
      const segmentColor = color.clone().lerp(pale, rng.range(0.0, 0.42));
      for (let k = 0; k < 2; k += 1) {
        colors.push(segmentColor.r, segmentColor.g, segmentColor.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}

function buildOuterLines(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:outer-lines`);
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(quality.outerLineCount * spec.theme.wildness * (spec.theme.outerLineBias ?? 1));
  const color = new THREE.Color(spec.theme.glow);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.32, 1.18);
    const start = ellipsoidPoint(rng.range(1.0, 1.55), rng.range(0.9, 1.35), theta, phi, spec.asymmetry);
    const end = start.clone().add(new THREE.Vector3(
      Math.cos(theta + rng.range(-0.9, 0.9)) * rng.range(0.28, 0.75),
      rng.range(0.08, 0.62),
      Math.sin(theta + rng.range(-0.9, 0.9)) * rng.range(0.28, 0.75)
    ));
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    for (let k = 0; k < 2; k += 1) {
      colors.push(color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}

function buildParticles(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:particles`);
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(quality.particleCount * spec.sparkleDensity);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.28, 1.82);
    const shell = rng.value() ** 0.32;
    const radius = rng.range(0.38, 1.92) * shell;
    const p = ellipsoidPoint(radius, rng.range(0.72, 1.48), theta, phi, spec.asymmetry);
    p.y += spec.haloLift + rng.range(-0.28, 0.36);
    const airy = rng.value();
    if (airy > 0.72) {
      p.multiplyScalar(rng.range(1.02, 1.28));
      p.y += rng.range(-0.12, 0.32);
    }
    positions.push(p.x, p.y, p.z);

    const base = new THREE.Color(pickColor(spec.theme.palette, rng.value()));
    const glow = new THREE.Color(spec.theme.glow);
    base.lerp(glow, rng.range(0.05, 0.38));
    colors.push(base.r, base.g, base.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.026,
    map: makeRadialTexture() ?? undefined,
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  return new THREE.Points(geometry, material);
}

function buildFlowers(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:flowers`);
  const geometry = new THREE.IcosahedronGeometry(0.055, quality.renderName === 'low' ? 0 : 1);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.0,
    emissive: new THREE.Color(spec.theme.glow),
    emissiveIntensity: 0.08
  });
  const count = Math.floor(quality.flowerCount * spec.flowerDensity);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.36, 1.66);
    const p = ellipsoidPoint(rng.range(0.5, 1.78), rng.range(0.82, 1.46), theta, phi, spec.asymmetry);
    p.y += spec.haloLift + rng.range(-0.26, 0.36);
    const scale = rng.range(0.46, 0.9) * (rng.value() > 0.96 ? 1.08 : 1);
    tempObject.position.copy(p);
    tempObject.rotation.set(rng.range(-0.7, 0.7), theta, rng.range(-0.7, 0.7));
    tempObject.scale.setScalar(scale);
    tempObject.updateMatrix();
    mesh.setMatrixAt(i, tempObject.matrix);
    mesh.setColorAt(i, tempColor.set(pickColor(spec.theme.palette, rng.value())).lerp(new THREE.Color('#ffffff'), rng.range(0.0, 0.1)));
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function buildLeaves(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:leaves`);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.13);
  shape.bezierCurveTo(0.11, 0.08, 0.13, -0.08, 0, -0.15);
  shape.bezierCurveTo(-0.13, -0.08, -0.11, 0.08, 0, 0.13);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color('#123d28'),
    emissiveIntensity: 0.05
  });
  const count = Math.floor(quality.leafCount * spec.leafDensity);
  const mesh = new THREE.InstancedMesh(geometry, material, count);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.38, 1.82);
    const p = ellipsoidPoint(rng.range(0.44, 1.78), rng.range(0.7, 1.38), theta, phi, spec.asymmetry);
    p.y += spec.haloLift + rng.range(-0.38, 0.24);
    const size = rng.range(0.55, 1.28);
    tempObject.position.copy(p);
    tempObject.quaternion.setFromUnitVectors(up, p.clone().normalize());
    tempObject.rotateY(theta + rng.range(-0.8, 0.8));
    tempObject.rotateX(rng.range(-0.8, 0.8));
    tempObject.scale.set(size * rng.range(0.6, 0.92), size * rng.range(0.78, 1.45), size);
    tempObject.updateMatrix();
    mesh.setMatrixAt(i, tempObject.matrix);
    mesh.setColorAt(i, tempColor.set(pickColor(spec.theme.leafPalette, rng.value())));
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function buildStemBundle(spec: DailyBouquetSpec) {
  const rng = createRng(`${spec.seed}:stems`);
  const positions: number[] = [];
  const colors: number[] = [];
  const stem = new THREE.Color(spec.theme.stem);
  const count = 24;

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const bottom = new THREE.Vector3(Math.cos(theta) * rng.range(0.04, 0.11), -1.24, Math.sin(theta) * rng.range(0.04, 0.11));
    const top = new THREE.Vector3(Math.cos(theta) * rng.range(0.14, 0.3), -0.44 + rng.range(-0.1, 0.08), Math.sin(theta) * rng.range(0.14, 0.3));
    positions.push(bottom.x, bottom.y, bottom.z, top.x, top.y, top.z);
    const c = stem.clone().lerp(new THREE.Color('#d5d09b'), rng.range(0, 0.24));
    for (let k = 0; k < 2; k += 1) colors.push(c.r, c.g, c.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24
  });
  const lines = new THREE.LineSegments(geometry, material);

  const bandGeometry = new THREE.CylinderGeometry(0.13, 0.11, 0.08, 20, 1, true);
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: '#b8b08d',
    roughness: 0.86,
    metalness: 0,
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide
  });
  const band = new THREE.Mesh(bandGeometry, bandMaterial);
  band.position.y = -1.0;
  const group = new THREE.Group();
  group.add(lines, band);
  return group;
}

export class BouquetScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  readonly bouquet = new THREE.Group();

  private readonly clock = new THREE.Clock();
  private readonly canvas: HTMLCanvasElement;
  private spec: DailyBouquetSpec;
  private quality: QualityProfile;
  private frameInterval: number;
  private accumulator = 0;
  private isPaused = false;
  private isDragging = false;
  private dragX = 0;
  private dragY = 0;
  private routeSpeed: number;
  private routeDirection: 1 | -1 = 1;
  private routeMode: CameraRouteMode = 'orbit';
  private routeTime = 0;
  private routePausedByDrag = false;
  private cameraYaw = 0;
  private targetCameraYaw = 0;
  private cameraPitch = 0.38;
  private targetCameraPitch = 0.38;
  private baseCameraPitch = 0.38;
  private pitchAmplitude = 0;
  private yawAmplitude = 0;
  private distanceAmplitude = 0;
  private targetYAmplitude = 0;
  private cameraDistance = 5.36;
  private baseCameraDistance = 5.36;
  private targetCameraDistance = 5.36;
  private cameraTargetY = 0.7;
  private baseCameraTargetY = 0.7;
  private targetCameraTargetY = 0.7;
  private floorMaterial?: THREE.MeshBasicMaterial;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement, spec: DailyBouquetSpec, quality: QualityProfile) {
    this.canvas = canvas;
    this.spec = spec;
    this.quality = quality;
    this.routeSpeed = spec.rotationSpeed;
    this.frameInterval = 1 / quality.targetFps;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: quality.renderName === 'low' ? 'low-power' : 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(spec.theme.background);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    this.scene.fog = new THREE.Fog(spec.theme.background, 4.8, 9.2);
    this.cameraYaw = (hashString(spec.seed) % 628) / 100;
    this.targetCameraYaw = this.cameraYaw;
    this.scene.add(this.camera);
    this.scene.add(this.bouquet);
    this.addLights();
    this.addStage();
    this.rebuild(spec, quality);
    this.bindPointer();
    this.resize();
  }

  rebuild(spec: DailyBouquetSpec, quality: QualityProfile) {
    this.spec = spec;
    this.quality = quality;
    this.frameInterval = 1 / quality.targetFps;
    this.renderer.setClearColor(spec.theme.background);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    this.scene.fog = new THREE.Fog(spec.theme.background, 4.8, 9.2);
    if (this.floorMaterial) {
      this.floorMaterial.color.set(spec.theme.floor);
    }

    while (this.bouquet.children.length) {
      const child = this.bouquet.children.pop();
      if (child) this.disposeObject(child);
    }

    this.bouquet.rotation.set(0, (hashString(spec.seed) % 628) / 100, 0);
    this.bouquet.add(
      buildStemBundle(spec),
      buildBranches(spec, quality),
      buildOuterLines(spec, quality),
      buildLeaves(spec, quality),
      buildFlowers(spec, quality),
      buildParticles(spec, quality)
    );
  }

  start() {
    this.clock.start();
    const animate = () => {
      this.animationId = window.requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.accumulator += delta;
      if (this.accumulator < this.frameInterval) return;
      this.accumulator = 0;
      this.tick(delta);
    };
    animate();
  }

  stop() {
    window.cancelAnimationFrame(this.animationId);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setRotationSettings(settings: {
    speed?: number;
    direction?: 1 | -1;
    pitch?: number;
    mode?: CameraRouteMode;
    pitchAmplitude?: number;
    yawAmplitude?: number;
    distanceAmplitude?: number;
    targetYAmplitude?: number;
  }) {
    if (settings.speed !== undefined) {
      this.routeSpeed = THREE.MathUtils.clamp(settings.speed, 0.006, 0.16);
    }
    if (settings.direction !== undefined) {
      this.routeDirection = settings.direction;
    }
    if (settings.pitch !== undefined) {
      this.baseCameraPitch = THREE.MathUtils.clamp(settings.pitch, minCameraPitch, maxCameraPitch);
      this.targetCameraPitch = this.baseCameraPitch;
    }
    if (settings.mode !== undefined) {
      this.routeMode = settings.mode;
      this.routeTime = 0;
      this.routePausedByDrag = false;
    }
    if (settings.pitchAmplitude !== undefined) {
      this.pitchAmplitude = THREE.MathUtils.clamp(settings.pitchAmplitude, 0, 0.42);
    }
    if (settings.yawAmplitude !== undefined) {
      this.yawAmplitude = THREE.MathUtils.clamp(settings.yawAmplitude, 0, 0.58);
    }
    if (settings.distanceAmplitude !== undefined) {
      this.distanceAmplitude = THREE.MathUtils.clamp(settings.distanceAmplitude, 0, 0.62);
    }
    if (settings.targetYAmplitude !== undefined) {
      this.targetYAmplitude = THREE.MathUtils.clamp(settings.targetYAmplitude, 0, 0.2);
    }
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;
    const phone = width < 720;
    const wide = ratio > 1.65;
    this.camera.aspect = width / height;
    this.camera.fov = phone ? 42 : wide ? 32 : 34;
    this.baseCameraDistance = phone ? 5.82 : wide ? 5.08 : 5.36;
    this.targetCameraDistance = this.baseCameraDistance;
    this.cameraDistance = this.baseCameraDistance;
    this.baseCameraTargetY = phone ? 0.66 : wide ? 0.74 : 0.7;
    this.targetCameraTargetY = this.baseCameraTargetY;
    this.cameraTargetY = this.baseCameraTargetY;
    this.updateCamera(emptyRouteOffsets);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private tick(delta: number) {
    let routeOffsets = emptyRouteOffsets;
    if (!this.isPaused && !this.isDragging && !this.routePausedByDrag) {
      this.routeTime += delta;
      routeOffsets = this.routeOffsets();
      this.targetCameraYaw += this.routeSpeed * this.routeDirection * this.routePulse() * delta;
      this.targetCameraPitch = THREE.MathUtils.clamp(this.baseCameraPitch + routeOffsets.pitch, minCameraPitch, maxCameraPitch);
      this.targetCameraDistance = this.baseCameraDistance + routeOffsets.distance;
      this.targetCameraTargetY = this.baseCameraTargetY + routeOffsets.targetY;
    }
    this.cameraYaw += (this.targetCameraYaw - this.cameraYaw) * 0.1;
    this.cameraPitch += (this.targetCameraPitch - this.cameraPitch) * 0.1;
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
    this.cameraTargetY += (this.targetCameraTargetY - this.cameraTargetY) * 0.08;
    this.bouquet.position.y = 0.06 + Math.sin(performance.now() * 0.00025) * 0.026;
    this.updateCamera(routeOffsets);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(routeOffsets: CameraRouteOffsets) {
    const yaw = this.cameraYaw + routeOffsets.yaw;
    const pitch = THREE.MathUtils.clamp(this.cameraPitch, minCameraPitch, maxCameraPitch);
    const distance = Math.max(3.8, this.cameraDistance);
    const target = new THREE.Vector3(0, this.cameraTargetY, 0);
    const horizontal = Math.cos(pitch) * distance;

    this.camera.position.set(
      Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * distance,
      Math.cos(yaw) * horizontal
    );
    this.camera.lookAt(target);
  }

  private routePulse() {
    if (this.routeMode === 'near-far') {
      return 0.78 + Math.sin(this.routeTime * 0.82) * 0.2;
    }
    if (this.routeMode === 'figure-eight') {
      return 0.54 + Math.sin(this.routeTime * 1.05) * 0.16 + Math.sin(this.routeTime * 0.37) * 0.12;
    }
    if (this.routeMode === 'high-arc') {
      return 0.74 + Math.sin(this.routeTime * 0.48) * 0.12;
    }
    if (this.routeMode === 'low-arc') {
      return 0.64 + Math.cos(this.routeTime * 0.54) * 0.12;
    }
    return 1;
  }

  private routeOffsets(): CameraRouteOffsets {
    if (this.routeMode === 'orbit') return emptyRouteOffsets;

    if (this.routeMode === 'figure-eight') {
      return {
        yaw: Math.sin(this.routeTime * 0.55) * this.yawAmplitude,
        pitch:
          Math.sin(this.routeTime * 0.42) * this.pitchAmplitude +
          Math.sin(this.routeTime * 0.9 + Math.PI / 3) * this.pitchAmplitude * 0.42,
        distance: Math.cos(this.routeTime * 0.38) * this.distanceAmplitude,
        targetY: Math.sin(this.routeTime * 0.31) * this.targetYAmplitude
      };
    }

    if (this.routeMode === 'near-far') {
      return {
        yaw: Math.sin(this.routeTime * 0.34) * this.yawAmplitude,
        pitch: Math.sin(this.routeTime * 0.5) * this.pitchAmplitude,
        distance: Math.sin(this.routeTime * 0.72) * this.distanceAmplitude,
        targetY: Math.cos(this.routeTime * 0.44) * this.targetYAmplitude
      };
    }

    if (this.routeMode === 'high-arc') {
      return {
        yaw: Math.sin(this.routeTime * 0.28) * this.yawAmplitude,
        pitch: Math.sin(this.routeTime * 0.36) * this.pitchAmplitude,
        distance: Math.cos(this.routeTime * 0.26) * this.distanceAmplitude,
        targetY: Math.sin(this.routeTime * 0.22) * this.targetYAmplitude
      };
    }

    return {
      yaw: Math.sin(this.routeTime * 0.38) * this.yawAmplitude,
      pitch: Math.sin(this.routeTime * 0.44) * this.pitchAmplitude,
      distance: Math.cos(this.routeTime * 0.48) * this.distanceAmplitude,
      targetY: Math.sin(this.routeTime * 0.3) * this.targetYAmplitude
    };
  }

  private addLights() {
    const ambient = new THREE.AmbientLight('#fff7e4', 0.96);
    const hemi = new THREE.HemisphereLight('#f4fff2', '#17402d', 0.72);
    const key = new THREE.DirectionalLight('#fff0c8', 1.7);
    key.position.set(2.4, 4.2, 3.4);
    const fill = new THREE.DirectionalLight('#eadcff', 0.82);
    fill.position.set(-3.2, 2.6, 2.2);
    const rim = new THREE.DirectionalLight('#9cf7d2', 0.72);
    rim.position.set(-4, 2.2, -3.5);
    this.scene.add(ambient, hemi, key, fill, rim);
  }

  private addStage() {
    const floorGeometry = new THREE.CircleGeometry(1.16, 80);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: this.spec.theme.floor,
      transparent: true,
      opacity: 0.035,
      depthWrite: false
    });
    this.floorMaterial = floorMaterial;
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.38;
    this.scene.add(floor);
  }

  private bindPointer() {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.isDragging = true;
      this.routePausedByDrag = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.targetCameraYaw = this.cameraYaw;
      this.targetCameraPitch = this.cameraPitch;
      this.targetCameraDistance = this.cameraDistance;
      this.targetCameraTargetY = this.cameraTargetY;
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.isDragging) return;
      const dx = event.clientX - this.dragX;
      const dy = event.clientY - this.dragY;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.targetCameraYaw -= dx * 0.008;
      this.targetCameraPitch = THREE.MathUtils.clamp(
        this.targetCameraPitch - dy * 0.0058,
        minCameraPitch,
        maxCameraPitch
      );
      this.baseCameraPitch = this.targetCameraPitch;
    });

    const release = (event: PointerEvent) => {
      this.isDragging = false;
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else if (material) {
        material.dispose();
      }
    });
  }
}
