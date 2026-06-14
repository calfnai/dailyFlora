import * as THREE from 'three';
import type { DailyBouquetSpec, QualityProfile } from './types';
import { createRng, hashString } from './random';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const up = new THREE.Vector3(0, 1, 0);

function pickColor(colors: readonly string[], value: number) {
  return colors[Math.floor(value * colors.length) % colors.length];
}

function ellipsoidPoint(radius: number, height: number, theta: number, phi: number, asymmetry: number) {
  const sideLean = Math.sin(theta * 2.0) * asymmetry;
  const x = Math.cos(theta) * Math.sin(phi) * radius * (1 + sideLean);
  const z = Math.sin(theta) * Math.sin(phi) * radius * (1 - sideLean * 0.45);
  const y = Math.cos(phi) * height + 0.25;
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
    const radius = rng.range(1.15, 2.12) * spec.theme.wildness;
    const end = ellipsoidPoint(radius, rng.range(1.15, 1.85), theta, phi, spec.asymmetry);
    end.y += spec.haloLift + rng.range(-0.12, 0.5);
    const start = new THREE.Vector3(rng.range(-0.12, 0.12), -1.58 + rng.range(-0.1, 0.08), rng.range(-0.12, 0.12));
    const bend = new THREE.Vector3(
      Math.cos(theta + rng.range(-0.45, 0.45)) * rng.range(0.28, 0.78),
      rng.range(-0.58, 0.38),
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
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}

function buildOuterLines(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:outer-lines`);
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(quality.outerLineCount * spec.theme.wildness);
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
    const phi = rng.range(0.22, 1.75);
    const shell = rng.value() ** 0.32;
    const radius = rng.range(0.42, 2.0) * shell;
    const p = ellipsoidPoint(radius, rng.range(0.8, 1.62), theta, phi, spec.asymmetry);
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
    size: 0.028,
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
  const geometry = new THREE.IcosahedronGeometry(0.055, quality.name === 'low' ? 0 : 1);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.0,
    emissive: new THREE.Color(spec.theme.glow),
    emissiveIntensity: 0.04
  });
  const count = Math.floor(quality.flowerCount * spec.flowerDensity);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.28, 1.5);
    const p = ellipsoidPoint(rng.range(0.58, 1.88), rng.range(0.92, 1.62), theta, phi, spec.asymmetry);
    p.y += spec.haloLift + rng.range(-0.22, 0.42);
    const scale = rng.range(0.42, 0.98) * (rng.value() > 0.94 ? 1.18 : 1);
    tempObject.position.copy(p);
    tempObject.rotation.set(rng.range(-0.7, 0.7), theta, rng.range(-0.7, 0.7));
    tempObject.scale.setScalar(scale);
    tempObject.updateMatrix();
    mesh.setMatrixAt(i, tempObject.matrix);
    mesh.setColorAt(i, tempColor.set(pickColor(spec.theme.palette, rng.value())).lerp(new THREE.Color('#ffffff'), rng.range(0.0, 0.16)));
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
    opacity: 0.82
  });
  const count = Math.floor(quality.leafCount * spec.leafDensity);
  const mesh = new THREE.InstancedMesh(geometry, material, count);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.42, 1.78);
    const p = ellipsoidPoint(rng.range(0.46, 1.75), rng.range(0.75, 1.48), theta, phi, spec.asymmetry);
    p.y += spec.haloLift + rng.range(-0.46, 0.18);
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
  const count = 32;

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const bottom = new THREE.Vector3(Math.cos(theta) * rng.range(0.04, 0.14), -2.05, Math.sin(theta) * rng.range(0.04, 0.14));
    const top = new THREE.Vector3(Math.cos(theta) * rng.range(0.16, 0.34), -0.66 + rng.range(-0.12, 0.08), Math.sin(theta) * rng.range(0.16, 0.34));
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
    opacity: 0.68
  });
  const lines = new THREE.LineSegments(geometry, material);

  const bandGeometry = new THREE.CylinderGeometry(0.2, 0.16, 0.22, 20, 1, true);
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: '#d8d2b2',
    roughness: 0.86,
    metalness: 0,
    transparent: true,
    opacity: 0.54,
    side: THREE.DoubleSide
  });
  const band = new THREE.Mesh(bandGeometry, bandMaterial);
  band.position.y = -1.78;
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
  private targetRotationY = 0;
  private targetRotationX = 0;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement, spec: DailyBouquetSpec, quality: QualityProfile) {
    this.canvas = canvas;
    this.spec = spec;
    this.quality = quality;
    this.frameInterval = 1 / quality.targetFps;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.name !== 'low',
      alpha: false,
      powerPreference: quality.name === 'low' ? 'low-power' : 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(spec.theme.background);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    this.scene.fog = new THREE.Fog(spec.theme.background, 5.2, 9.5);
    this.camera.position.set(0, 0.2, 6.2);
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
    this.scene.fog = new THREE.Fog(spec.theme.background, 5.2, 9.5);

    while (this.bouquet.children.length) {
      const child = this.bouquet.children.pop();
      if (child) this.disposeObject(child);
    }

    this.bouquet.rotation.set(0, (hashString(spec.seed) % 628) / 100, 0);
    this.targetRotationY = this.bouquet.rotation.y;
    this.targetRotationX = 0;
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

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.fov = width < 720 ? 46 : 38;
    this.camera.position.z = width < 720 ? 7.3 : 6.2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private tick(delta: number) {
    if (!this.isPaused && !this.isDragging) {
      this.targetRotationY += this.spec.rotationSpeed * delta;
    }
    this.bouquet.rotation.y += (this.targetRotationY - this.bouquet.rotation.y) * 0.08;
    this.bouquet.rotation.x += (this.targetRotationX - this.bouquet.rotation.x) * 0.07;
    this.bouquet.position.y = Math.sin(performance.now() * 0.00025) * 0.035;
    this.renderer.render(this.scene, this.camera);
  }

  private addLights() {
    const ambient = new THREE.AmbientLight('#dfe8ff', 0.62);
    const key = new THREE.DirectionalLight('#fff4dc', 2.4);
    key.position.set(2.8, 4.5, 4.5);
    const rim = new THREE.DirectionalLight('#8ab7ff', 1.4);
    rim.position.set(-4, 2, -3.5);
    this.scene.add(ambient, key, rim);
  }

  private addStage() {
    const floorGeometry = new THREE.CircleGeometry(2.1, 80);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: this.spec.theme.floor,
      transparent: true,
      opacity: 0.26,
      depthWrite: false
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    this.scene.add(floor);
  }

  private bindPointer() {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.isDragging = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.isDragging) return;
      const dx = event.clientX - this.dragX;
      const dy = event.clientY - this.dragY;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.targetRotationY += dx * 0.008;
      this.targetRotationX = THREE.MathUtils.clamp(this.targetRotationX + dy * 0.004, -0.45, 0.34);
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
