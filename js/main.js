import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Registry } from './registry.js';
import { buildCar, makeMaterials } from './car.js';

const $ = (id) => document.getElementById(id);

// ─── Сцена ───
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1218);
scene.fog = new THREE.Fog(0x0d1218, 14, 30);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.02, 100);
const HOME = { pos: new THREE.Vector3(4.6, 2.3, 4.9), target: new THREE.Vector3(0, 0.6, 0) };
// на узких экранах отодвигаем камеру, чтобы машина помещалась
const fitK = () => THREE.MathUtils.clamp(1.15 / camera.aspect, 1, 1.9);
const homePos = (v) => v.clone().sub(HOME.target).multiplyScalar(fitK()).add(HOME.target);
camera.position.copy(homePos(HOME.pos));

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.3;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotateSpeed = 0.8;

scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1f26, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 20 });
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.025;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x161c24, roughness: 0.95, metalness: 0 }),
);
ground.position.y = -0.002;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(28, 56, 0x2a3442, 0x1c232d);
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

// ─── Модель ───
const carRoot = new THREE.Group();
scene.add(carRoot);
const reg = new Registry(carRoot);
const M = makeMaterials();
buildCar(reg, M);
reg.update(0);
$('partCount').textContent = reg.parts.length;

// ─── Состояние материалов ───
const XRAY_GROUPS = new Set(['body', 'glass', 'light', 'ext']);
const xrayMat = new THREE.MeshStandardMaterial({
  color: 0x7fa6ff, transparent: true, opacity: 0.07, depthWrite: false, roughness: 0.5,
});
const matCache = new Map();
function variant(base, kind) {
  let c = matCache.get(base);
  if (!c) { c = {}; matCache.set(base, c); }
  if (!c[kind]) {
    const m = base.clone();
    if (kind === 'sel') { m.emissive = new THREE.Color(0x2f7bff); m.emissiveIntensity = 0.85; }
    else { m.emissive = new THREE.Color(0x6aa8ff); m.emissiveIntensity = 0.35; }
    if (m.transparent) m.opacity = Math.max(m.opacity, 0.6);
    c[kind] = m;
  }
  return c[kind];
}

const state = { selected: null, hovered: null, xray: false };

const XRAY_TYPES = new Set(['door_trim', 'headliner', 'cargo_cover']);
function isXray(p) { return state.xray && (XRAY_GROUPS.has(p.group) || XRAY_TYPES.has(p.type)); }
function refresh(p) {
  if (!p) return;
  for (const m of p.meshes) {
    const base = m.userData.baseMat;
    if (p === state.selected) m.material = variant(base, 'sel');
    else if (p === state.hovered) m.material = variant(base, 'hov');
    else if (isXray(p)) m.material = xrayMat;
    else m.material = base;
    m.castShadow = !isXray(p);
  }
}

// ─── Разборка ───
let explodeT = 0;
let explodeAnim = null;
const slider = $('explode');
function setExplode(t) {
  explodeT = THREE.MathUtils.clamp(t, 0, 1);
  slider.value = Math.round(explodeT * 1000);
  reg.update(explodeT);
}
slider.addEventListener('input', () => { explodeAnim = null; setExplode(slider.value / 1000); });
function animateTo(target) {
  explodeAnim = { from: explodeT, to: target, start: performance.now(), dur: 900 + 3200 * Math.abs(target - explodeT) };
}
const WIDE = { pos: new THREE.Vector3(7.6, 4.6, 8.6), target: new THREE.Vector3(0, 0.9, 0) };
$('btnExplode').onclick = () => {
  animateTo(1);
  const wp = WIDE.pos.clone().sub(WIDE.target).multiplyScalar(fitK()).add(WIDE.target);
  if (camera.position.distanceTo(controls.target) < wp.distanceTo(WIDE.target) * 0.9) flyTo(WIDE.target.clone(), wp, 1400);
};
$('btnAssemble').onclick = () => animateTo(0);

// ─── Дерево деталей ───
const tree = $('tree');
const itemEls = new Map();
const groupEls = new Map();
for (const g of reg.groups.values()) {
  if (!g.parts.length) continue;
  const el = document.createElement('div');
  el.className = 'grp';
  el.innerHTML = `<div class="grp-head"><span class="arrow">▶</span><span class="title"></span><span class="count">${g.parts.length}</span><button class="eye" title="Скрыть/показать систему">👁</button></div><div class="grp-items"></div>`;
  el.querySelector('.title').textContent = g.label;
  const items = el.querySelector('.grp-items');
  el.querySelector('.grp-head').addEventListener('click', (e) => {
    if (e.target.classList.contains('eye')) return;
    el.classList.toggle('open');
  });
  const eye = el.querySelector('.eye');
  eye.addEventListener('click', () => {
    const hide = !eye.classList.contains('off');
    eye.classList.toggle('off', hide);
    g.parts.forEach((p) => setHidden(p, hide));
  });
  for (const p of g.parts) {
    const it = document.createElement('div');
    it.className = 'item';
    it.textContent = p.name;
    it.title = p.name;
    it.addEventListener('click', () => select(p, true));
    it.addEventListener('mouseenter', () => setHover(p));
    it.addEventListener('mouseleave', () => setHover(null));
    items.appendChild(it);
    itemEls.set(p, it);
  }
  tree.appendChild(el);
  groupEls.set(g.id, el);
}

$('search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  for (const g of reg.groups.values()) {
    const gel = groupEls.get(g.id);
    if (!gel) continue;
    let n = 0;
    for (const p of g.parts) {
      const ok = !q || p.name.toLowerCase().includes(q);
      itemEls.get(p).style.display = ok ? '' : 'none';
      if (ok) n++;
    }
    gel.style.display = n ? '' : 'none';
    gel.classList.toggle('open', !!q && n > 0);
  }
});

const sidebar = $('sidebar');
if (window.innerWidth < 760) sidebar.classList.add('collapsed');
$('toggleSidebar').onclick = () => sidebar.classList.toggle('collapsed');

// ─── Выбор и инфо ───
const groupLabel = (p) => reg.groups.get(p.group).label;
function setHover(p) {
  if (state.hovered === p) return;
  const prev = state.hovered;
  state.hovered = p;
  refresh(prev);
  refresh(p);
}

function select(p, fromTree = false) {
  const prev = state.selected;
  state.selected = p;
  refresh(prev);
  refresh(p);
  if (prev) itemEls.get(prev)?.classList.remove('sel');
  const info = $('info');
  if (!p) { info.classList.add('hidden'); return; }
  const it = itemEls.get(p);
  it.classList.add('sel');
  const gel = groupEls.get(p.group);
  gel.classList.add('open');
  if (!fromTree) it.scrollIntoView({ block: 'nearest' });
  $('infoGroup').textContent = groupLabel(p);
  $('infoName').textContent = p.name;
  $('infoDesc').textContent = p.desc || '';
  $('infoCount').textContent = `${p.sameCount} шт.`;
  const s = p.size;
  $('infoSize').textContent = [s.x, s.y, s.z].map((v) => Math.max(1, Math.round(v * 1000))).join(' × ');
  $('btnHide').textContent = p.hidden ? 'Вернуть деталь' : 'Снять деталь';
  info.classList.remove('hidden');
  if (fromTree) focus(p);
}
$('infoClose').onclick = () => select(null);

function setHidden(p, hidden) {
  p.hidden = hidden;
  p.pivot.visible = !hidden;
  itemEls.get(p)?.classList.toggle('off', hidden);
}

$('btnHide').onclick = () => {
  const p = state.selected;
  if (!p) return;
  setHidden(p, !p.hidden);
  $('btnHide').textContent = p.hidden ? 'Вернуть деталь' : 'Снять деталь';
};
$('btnIsolate').onclick = () => {
  const p = state.selected;
  if (!p) return;
  reg.parts.forEach((q) => setHidden(q, q !== p));
  focus(p);
};
$('btnShowAll').onclick = () => {
  reg.parts.forEach((q) => setHidden(q, false));
  document.querySelectorAll('.eye.off').forEach((e) => e.classList.remove('off'));
  if (state.selected) $('btnHide').textContent = 'Снять деталь';
};
$('btnFocus').onclick = () => state.selected && focus(state.selected);

// плавный перелёт камеры
let camAnim = null;
function flyTo(target, pos, dur = 700) {
  camAnim = { t0: performance.now(), dur, fromT: controls.target.clone(), toT: target, fromP: camera.position.clone(), toP: pos };
}
function focus(p) {
  const c = p.pivot.getWorldPosition(new THREE.Vector3());
  const r = Math.max(p.size.x, p.size.y, p.size.z);
  const dist = THREE.MathUtils.clamp(r * 2.6 + 0.35, 0.45, 7);
  const dir = camera.position.clone().sub(controls.target).normalize();
  flyTo(c, c.clone().addScaledVector(dir, dist));
}
$('btnReset').onclick = () => flyTo(HOME.target.clone(), homePos(HOME.pos));

$('xray').addEventListener('change', (e) => {
  state.xray = e.target.checked;
  reg.parts.forEach(refresh);
});
// Режим «без цвета»: матовая белая «глина», стекло и рассеиватели остаются прозрачными
const clayCache = new Map();
function clayOf(m) {
  if (m.transparent) return m;
  let c = clayCache.get(m);
  if (!c) {
    const lum = m === M.paint ? 1 : m.color.r * 0.2126 + m.color.g * 0.7152 + m.color.b * 0.0722;
    const tone = m === M.paint ? 0.86 : 0.3 + 0.6 * Math.sqrt(lum);
    c = new THREE.MeshStandardMaterial({ color: new THREE.Color(tone, tone * 0.985, tone * 0.96), roughness: 0.62, metalness: 0 });
    clayCache.set(m, c);
  }
  return c;
}
for (const p of reg.parts) for (const m of p.meshes) m.userData.origMat = m.userData.baseMat;
$('clay').addEventListener('change', (e) => {
  for (const p of reg.parts) for (const m of p.meshes) m.userData.baseMat = e.target.checked ? clayOf(m.userData.origMat) : m.userData.origMat;
  reg.parts.forEach(refresh);
});
$('autorotate').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });

// ─── Указатель ───
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tooltip = $('tooltip');
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const meshes = [];
  for (const p of reg.parts) if (!p.hidden && !isXray(p)) meshes.push(...p.meshes);
  const hit = raycaster.intersectObjects(meshes, false)[0];
  return hit ? hit.object.userData.part : null;
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (e.buttons) { tooltip.classList.add('hidden'); return; }
  const p = pick(e);
  setHover(p);
  canvas.style.cursor = p ? 'pointer' : '';
  if (p) {
    tooltip.textContent = p.name;
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.classList.remove('hidden');
  } else tooltip.classList.add('hidden');
});
canvas.addEventListener('pointerleave', () => { setHover(null); tooltip.classList.add('hidden'); });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
  select(pick(e));
});
canvas.addEventListener('dblclick', () => state.selected && focus(state.selected));
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') select(null);
  if ((e.key === 'h' || e.key === 'р') && state.selected) $('btnHide').click();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Цикл ───
const easeIO = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
renderer.setAnimationLoop((now) => {
  if (explodeAnim) {
    const k = Math.min(1, (now - explodeAnim.start) / explodeAnim.dur);
    setExplode(explodeAnim.from + (explodeAnim.to - explodeAnim.from) * k);
    if (k >= 1) explodeAnim = null;
  }
  if (camAnim) {
    const k = easeIO(Math.min(1, (now - camAnim.t0) / camAnim.dur));
    controls.target.lerpVectors(camAnim.fromT, camAnim.toT, k);
    camera.position.lerpVectors(camAnim.fromP, camAnim.toP, k);
    if (k >= 1) camAnim = null;
  }
  controls.update();
  renderer.render(scene, camera);
});

$('loading').classList.add('done');
window.__caldina = { reg, setExplode, camera, controls, select };
