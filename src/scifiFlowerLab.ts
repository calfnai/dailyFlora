import * as THREE from 'three';
import { createSciFiFlower, sciFiFlowerDefinitions, type SciFiFlowerDefinition } from './scifiFlowerForms';

type ViewName = 'front' | 'side' | 'top';
type Preview = {
  definition: SciFiFlowerDefinition;
  cell: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid: THREE.GridHelper;
  yaw: number;
};

const presets: Record<string, string[]> = {
  '形态灰模': ['#d8d7d0', '#a9aba8', '#f1eee5', '#7f8582', '#53645d'],
  '深空冷光': ['#65f4ff', '#8174ff', '#ff5ed2', '#dcff6b', '#365b58'],
  '酸性温室': ['#c6ff37', '#29e69b', '#ff7b38', '#fff06a', '#315a3d'],
  '量子珊瑚': ['#ff746c', '#ffb36b', '#e76bff', '#fff0c2', '#4e6574'],
  '黑金信号': ['#050504', '#17130c', '#d7b95f', '#7a6634', '#0d1311']
};

function required<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Sci-Fi Flower Lab could not find ${selector}.`);
  return element;
}

const stage = required<HTMLElement>('#scifi-stage');
const canvas = required<HTMLCanvasElement>('#scifi-canvas');
const labels = required<HTMLElement>('#scifi-labels');
const stats = required<HTMLOutputElement>('#scifi-stats');
const paletteName = required<HTMLOutputElement>('#palette-name');
const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-preset]'));
const colorInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-color-index]'));
const randomButton = required<HTMLButtonElement>('#random-palette');
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));
const gridButton = required<HTMLButtonElement>('#grid-button');
const rotateButton = required<HTMLButtonElement>('#rotate-button');

let palette = [...presets['形态灰模']];
let activeView: ViewName = 'front';
let gridVisible = true;
let autoRotate = true;
let columns = 3;
let rowHeight = 350;
let lastTime = performance.now();
let dragging: Preview | null = null;
let dragStartX = 0;
let dragStartYaw = 0;
const previews: Preview[] = [];

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderLabels() {
  labels.innerHTML = sciFiFlowerDefinitions.map((definition, index) => `
    <article class="flower-cell ${definition.kind === 'control' ? 'is-control' : 'is-morphology'}" data-flower="${escapeHtml(definition.id)}">
      <div class="flower-copy">
        <div class="flower-meta"><span>${String(index + 1).padStart(2,'0')}</span><span>${definition.kind === 'control' ? '配色对照' : '结构科幻'}</span></div>
        <h3>${escapeHtml(definition.cn)}</h3>
        <p class="flower-en">${escapeHtml(definition.en)}</p>
        <p>${escapeHtml(definition.hypothesis)}</p>
        <p class="flower-structure">${escapeHtml(definition.structure)}</p>
      </div>
    </article>
  `).join('');
}

function setView(preview: Preview, view: ViewName) {
  const distance = 4.6;
  if (view === 'side') preview.camera.position.set(distance,0.12,0);
  else if (view === 'top') preview.camera.position.set(0,distance,0.01);
  else preview.camera.position.set(0,0.12,distance);
  preview.camera.lookAt(0,0,0);
}

function countGeometry(model: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  model.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces * (child instanceof THREE.InstancedMesh ? child.count : 1));
    }
  });
  return {draws,triangles};
}

function disposeModel(model: THREE.Group) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.InstancedMesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((item) => item.dispose());
  });
}

function buildModel(preview: Preview, index: number) {
  if (preview.model) {
    preview.scene.remove(preview.model);
    disposeModel(preview.model);
  }
  const model = createSciFiFlower(preview.definition, palette, `scifi-lab:${preview.definition.id}:${palette.join('-')}`);
  model.scale.setScalar(preview.definition.id === 'fractal-rift' ? 0.72 : 0.76);
  model.position.x = 0;
  model.rotation.x = preview.definition.id === 'fractal-rift' ? -0.22 : -0.46;
  model.rotation.y = preview.yaw || index * 0.08;
  preview.model = model;
  preview.scene.add(model);
}

function initScenes() {
  const cells = Array.from(labels.querySelectorAll<HTMLElement>('.flower-cell'));
  sciFiFlowerDefinitions.forEach((definition,index) => {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#f2fbff','#151a24',2));
    const key = new THREE.DirectionalLight('#ffffff',2.5); key.position.set(2.4,3.2,4.8); scene.add(key);
    const rim = new THREE.DirectionalLight('#7cf9ff',1.1); rim.position.set(-3,0.6,2); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(37,1,0.1,30);
    const grid = new THREE.GridHelper(3.2,8,'#526153','#26312c'); grid.position.set(0,-1.1,0); grid.material.transparent=true; grid.material.opacity=.32; scene.add(grid);
    const preview: Preview = {definition,cell:cells[index],scene,camera,model:new THREE.Group(),grid,yaw:index*.08};
    buildModel(preview,index);
    setView(preview,activeView);
    previews.push(preview);
  });
  updateStats();
}

function updateStats() {
  const total = previews.reduce((sum,preview) => { const c=countGeometry(preview.model); return {draws:sum.draws+c.draws,triangles:sum.triangles+c.triangles}; },{draws:0,triangles:0});
  stats.textContent = `1 canvas · ${previews.length} tests · draw ${total.draws} · tri ${total.triangles.toLocaleString()}`;
}

function applyPalette(next: string[], name: string) {
  palette = next.slice(0,5);
  colorInputs.forEach((input,index) => { input.value = palette[index]; });
  previews.forEach((preview,index) => buildModel(preview,index));
  updateStats();
  paletteName.textContent = name;
  presetButtons.forEach((button) => button.setAttribute('aria-pressed',String(button.dataset.preset === name)));
}

function randomColor() {
  return `#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}`;
}

function updateLayout() {
  columns = stage.clientWidth >= 760 ? 2 : 1;
  rowHeight = columns === 1 ? 580 : 380;
  stage.style.height = `${Math.ceil(previews.length/columns)*rowHeight}px`;
  labels.style.gridTemplateColumns = `repeat(${columns},minmax(0,1fr))`;
  labels.style.gridAutoRows = `${rowHeight}px`;
  renderer.setSize(Math.max(1,stage.clientWidth),Math.max(1,stage.clientHeight),false);
}

function previewViewport(preview: Preview, stageHeight: number) {
  const cellWidth = preview.cell.clientWidth;
  const cellHeight = preview.cell.clientHeight;
  const cellBottom = stageHeight - preview.cell.offsetTop - cellHeight;
  if (columns === 1) {
    const infoHeight = 230;
    return {
      left: preview.cell.offsetLeft,
      bottom: cellBottom + infoHeight,
      width: cellWidth,
      height: cellHeight - infoHeight
    };
  }

  const infoWidth = Math.min(240, Math.round(cellWidth * 0.44));
  return {
    left: preview.cell.offsetLeft,
    bottom: cellBottom,
    width: cellWidth - infoWidth - 24,
    height: cellHeight
  };
}

presetButtons.forEach((button) => button.addEventListener('click',() => {
  const name = button.dataset.preset || '形态灰模';
  applyPalette(presets[name] || presets['形态灰模'],name);
}));
colorInputs.forEach((input) => input.addEventListener('input',() => applyPalette(colorInputs.map((item) => item.value),'用户自选')));
randomButton.addEventListener('click',() => applyPalette(Array.from({length:5},randomColor),'随机配色'));
viewButtons.forEach((button) => button.addEventListener('click',() => {
  activeView=(button.dataset.view || 'front') as ViewName;
  viewButtons.forEach((item) => item.setAttribute('aria-pressed',String(item===button)));
  previews.forEach((preview) => setView(preview,activeView));
}));
gridButton.addEventListener('click',() => {gridVisible=!gridVisible;gridButton.setAttribute('aria-pressed',String(gridVisible));previews.forEach((preview)=>{preview.grid.visible=gridVisible;});});
rotateButton.addEventListener('click',() => {autoRotate=!autoRotate;rotateButton.setAttribute('aria-pressed',String(autoRotate));});

function previewAt(x:number,y:number) { return previews.find((preview)=>{const r=preview.cell.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})||null; }
canvas.addEventListener('pointerdown',(event)=>{dragging=previewAt(event.clientX,event.clientY);if(!dragging)return;dragStartX=event.clientX;dragStartYaw=dragging.yaw;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',(event)=>{if(dragging)dragging.yaw=dragStartYaw+(event.clientX-dragStartX)*.012;});
const stopDrag=(event:PointerEvent)=>{dragging=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};
canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);

function animate(time:number) {
  const delta=Math.min(.05,Math.max(0,(time-lastTime)/1000));lastTime=time;const stageHeight=stage.clientHeight;
  renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
  previews.forEach((preview)=>{
    const visible=preview.cell.getBoundingClientRect();if(visible.bottom<0||visible.top>window.innerHeight)return;
    const {left,bottom,width,height}=previewViewport(preview,stageHeight);
    renderer.setViewport(left,bottom,width,height);renderer.setScissor(left,bottom,width,height);preview.camera.aspect=width/Math.max(1,height);preview.camera.updateProjectionMatrix();
    if(autoRotate&&dragging!==preview)preview.yaw+=delta*.14;preview.model.rotation.y=preview.yaw;renderer.render(preview.scene,preview.camera);
  });
  renderer.setScissorTest(false);requestAnimationFrame(animate);
}

renderLabels();
initScenes();
applyPalette(presets['形态灰模'],'形态灰模');
updateLayout();
window.addEventListener('resize',updateLayout);
requestAnimationFrame(animate);
