// Процедурная модель Toyota Caldina (T240, 2003) — каждая деталь отдельным объектом.
import * as THREE from 'three';
import {
  D, v3, deform, smooth, shape, extrudeZ, strip, box, cyl, tube,
  sphere, merge, boltGeo, nutGeo, springGeo, beltGeo,
} from './geo.js';
import { DESC } from './desc.js';
import { buildBody } from './carbody.js';

const { W, FA, RA, WR, TR, AR, AY } = D;
const SIDES = [1, -1];
const SN = {
  m: { 1: 'правый', '-1': 'левый' },
  f: { 1: 'правая', '-1': 'левая' },
  n: { 1: 'правое', '-1': 'левое' },
};
const sn = (s, g = 'm') => SN[g][s];
const AXLES = [
  { x: FA, front: true, m: 'передний', f: 'передняя', n: 'переднее' },
  { x: RA, front: false, m: 'задний', f: 'задняя', n: 'заднее' },
];
const X0 = 1.52; // ось коленвала по X (двигатель стоит поперечно)
const CYL = [-0.065, 0.045, 0.155, 0.265]; // центры цилиндров по Z

export function makeMaterials() {
  const std = (color, metalness, roughness, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: 0x1c4594, metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x1d2a35, metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.42,
      side: THREE.DoubleSide, depthWrite: false,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0xe8f0ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.3, depthWrite: false,
    }),
    redLens: new THREE.MeshPhysicalMaterial({
      color: 0xb3121b, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.85, emissive: 0x2a0000,
    }),
    amber: std(0xff8a1c, 0.1, 0.3, { emissive: 0x331800 }),
    chrome: std(0xe4e6ea, 1, 0.12),
    black: std(0x151618, 0.1, 0.65),
    trim: std(0x202226, 0.2, 0.5),
    rubber: std(0x0d0d0d, 0, 0.92),
    steel: std(0x8b8f95, 0.85, 0.38),
    darkSteel: std(0x4a4d52, 0.8, 0.5),
    alu: std(0xb9bdc3, 0.9, 0.32),
    castAlu: std(0x9fa3a8, 0.75, 0.55),
    iron: std(0x5a5c60, 0.7, 0.62),
    copper: std(0xb87333, 1, 0.3),
    brass: std(0xc9a14a, 1, 0.3),
    plasticGrey: std(0x6d7076, 0.05, 0.6),
    white: std(0xe9e9e4, 0.05, 0.5),
    tankWhite: std(0xdfe6e8, 0, 0.35, { transparent: true, opacity: 0.85 }),
    orange: std(0xd9822b, 0.1, 0.6),
    yellow: std(0xf2c230, 0.1, 0.5),
    fabric: std(0x3a3c42, 0, 0.95),
    fabricLight: std(0x8e8b84, 0, 0.95),
    dash: std(0x2a2b2f, 0.05, 0.75),
    carpet: std(0x25262a, 0, 1),
    red: std(0xb8191f, 0.3, 0.45),
    pad: std(0x3b3530, 0.2, 0.85),
    hose: std(0x1a1a1a, 0, 0.8),
  };
}

export function buildCar(reg, M) {
  const add = (objs, o) => reg.add(objs, { ...o, desc: o.desc || DESC[o.type] });
  const mesh = (g, m) => new THREE.Mesh(g, m);
  const bolt = (pos, dir, o, r = 0.006, len = 0.03, mat = M.steel) =>
    add(mesh(boltGeo(pos, dir, r, len), mat), {
      type: 'bolt_body', name: 'Болт крепления', ...o,
      e2: o.e2 || dir.clone().normalize().multiplyScalar(0.12),
    });

  reg.group('body', { label: 'Кузов', spread: 0.1 });
  reg.group('glass', { label: 'Остекление' });
  reg.group('light', { label: 'Светотехника' });
  reg.group('ext', { label: 'Навесное и экстерьер' });
  reg.group('engine', { label: 'Двигатель 1AZ-FSE', vec: [0.95, 1.05, 0.35] });
  reg.group('trans', { label: 'Трансмиссия', vec: [0.9, 0.8, -0.85], spread: 0.6 });
  reg.group('cool', { label: 'Система охлаждения', vec: [1.95, 0.6, 0], spread: 0.9 });
  reg.group('elec', { label: 'Электрооборудование', vec: [1.1, 1.65, -0.75], spread: 0.9 });
  reg.group('fuel', { label: 'Топливная система', vec: [0, -0.5, -0.55], spread: 0.3 });
  reg.group('exhaust', { label: 'Выпускная система', vec: [0, -0.6, 0.65], spread: 0.25 });
  reg.group('susp', { label: 'Подвеска', vec: [0, 0, 0.35], mirrorZ: true, spread: 0.22 });
  reg.group('steer', { label: 'Рулевое управление', vec: [0.25, -0.35, 0], spread: 0.5 });
  reg.group('brake', { label: 'Тормозная система', vec: [0, 0, 0.78], mirrorZ: true });
  reg.group('wheel', { label: 'Колёса', vec: [0, 0, 1.25], mirrorZ: true });
  reg.group('interior', { label: 'Салон', vec: [0, 1.05, 0], spread: 0.35 });

  buildBody({ add, mesh, bolt, M, sn });
  buildEngine();
  buildTransmission();
  buildCooling();
  buildElectrics();
  buildFuel();
  buildExhaust();
  buildChassis();
  buildSteering();
  buildInterior();
  reg.finalize();

  // ─────────────────────────── ДВИГАТЕЛЬ ───────────────────────────
  function buildEngine() {
    const g = 'engine';
    const zc = 0.1;
    const block = add(mesh(merge([
      box(X0, 0.45, zc, 0.25, 0.3, 0.5),
      ...CYL.map((z) => cyl(v3(X0 + 0.125, 0.33, z), v3(X0 + 0.125, 0.58, z), 0.012, 0.012, 8)),
    ]), M.castAlu), { group: g, type: 'block', name: 'Блок цилиндров', e2: [0, 0, 0] });
    add(mesh(box(X0, 0.603, zc, 0.25, 0.006, 0.5), M.steel), { group: g, type: 'head_gasket', name: 'Прокладка ГБЦ', e2: [0, 0.14, 0] });
    add(mesh(box(X0, 0.655, zc, 0.27, 0.1, 0.51), M.castAlu), { group: g, type: 'head', name: 'Головка блока цилиндров', e2: [0, 0.28, 0] });
    const vc = add(mesh(extrudeZ(shape([[X0 - 0.125, 0.705], [X0 + 0.125, 0.705], [X0 + 0.115, 0.745], [X0 + 0.085, 0.765], [X0 - 0.085, 0.765], [X0 - 0.115, 0.745]]), -0.14, 0.34, 0.006), M.trim),
      { group: g, type: 'valve_cover', name: 'Клапанная крышка', e2: [0, 0.55, 0] });
    for (const z of [-0.12, 0.1, 0.32]) for (const dx of [-0.105, 0.105]) {
      bolt(v3(X0 + dx, 0.75, z), v3(0, 1, 0), { group: g, host: vc, type: 'cover_bolt', name: 'Болт клапанной крышки' }, 0.004, 0.02);
    }
    add(mesh(cyl(v3(X0 - 0.06, 0.765, 0.3), v3(X0 - 0.06, 0.785, 0.3), 0.022), M.black),
      { group: g, type: 'oil_cap', name: 'Крышка маслозаливной горловины', host: vc, e2: [0, 0.15, 0] });
    for (const [dx, n] of [[-0.045, 'выпускной'], [0.045, 'впускной']]) {
      const lobes = CYL.flatMap((z) => [-0.022, 0.022].map((o) => box(X0 + dx, 0.7 + 0.008, z + o, 0.028, 0.034, 0.014)));
      add(mesh(merge([
        cyl(v3(X0 + dx, 0.7, -0.14), v3(X0 + dx, 0.7, 0.36), 0.013, 0.013, 12).rotateX(0),
        ...lobes,
        cyl(v3(X0 + dx, 0.7, 0.33), v3(X0 + dx, 0.7, 0.35), dx > 0 ? 0.05 : 0.045, dx > 0 ? 0.05 : 0.045, 24),
      ]), M.steel), { group: g, type: 'camshaft', name: `Распредвал ${n}`, e2: [dx * 1.5, 0.42, 0] });
    }
    for (let i = 0; i < 4; i++) {
      const z = CYL[i];
      const top = i === 0 || i === 3 ? 0.585 : 0.505;
      const pinY = top - 0.03, crankY = i === 0 || i === 3 ? 0.4 : 0.32;
      add(mesh(merge([
        cyl(v3(X0, top - 0.055, z), v3(X0, top, z), 0.042, 0.042, 24),
        ...[0.008, 0.016, 0.024].map((o) => cyl(v3(X0, top - o - 0.002, z), v3(X0, top - o, z), 0.0425, 0.0425, 24)),
      ]), M.alu), { group: g, type: 'piston', name: `Поршень цилиндра №${i + 1}`, e2: [0, 0.16, 0] });
      add(mesh(merge([
        box(X0, (pinY + crankY) / 2, z, 0.022, pinY - crankY, 0.016),
        cyl(v3(X0, pinY, z - 0.011), v3(X0, pinY, z + 0.011), 0.014).rotateX(0),
        cyl(v3(X0, crankY, z - 0.012), v3(X0, crankY, z + 0.012), 0.03),
      ]), M.steel), { group: g, type: 'rod', name: `Шатун цилиндра №${i + 1}`, e2: [0, 0.08, 0] });
    }
    const crankParts = [cyl(v3(X0, 0.36, -0.15), v3(X0, 0.36, 0.42), 0.022, 0.022, 16)];
    CYL.forEach((z, i) => {
      const up = i === 0 || i === 3 ? 1 : -1;
      crankParts.push(cyl(v3(X0, 0.36 + up * 0.04, z - 0.012), v3(X0, 0.36 + up * 0.04, z + 0.012), 0.02));
      for (const o of [-0.022, 0.022]) {
        crankParts.push(box(X0, 0.36 + up * 0.012, z + o, 0.05, 0.1, 0.014));
        crankParts.push(box(X0, 0.36 - up * 0.04, z + o, 0.08, 0.04, 0.014));
      }
    });
    add(mesh(merge(crankParts), M.steel), { group: g, type: 'crank', name: 'Коленчатый вал', e2: [0, -0.22, 0] });
    const pan = add(mesh(extrudeZ(shape([[X0 - 0.115, 0.3], [X0 + 0.115, 0.3], [X0 + 0.105, 0.25], [X0 + 0.05, 0.215], [X0 - 0.07, 0.215], [X0 - 0.105, 0.25]]), -0.14, 0.34, 0.006), M.castAlu),
      { group: g, type: 'pan', name: 'Масляный поддон', e2: [0, -0.42, 0] });
    for (const z of [-0.1, 0.1, 0.3]) for (const dx of [-0.11, 0.11]) {
      bolt(v3(X0 + dx, 0.296, z), v3(0, -1, 0), { group: g, host: pan, type: 'pan_bolt', name: 'Болт поддона' }, 0.004, 0.018);
    }
    for (let i = 0; i < 5; i++) for (const dx of [-0.065, 0.065]) {
      const z = -0.12 + i * 0.105;
      bolt(v3(X0 + dx, 0.71, z), v3(0, 1, 0), { group: g, type: 'head_bolt', name: 'Болт головки блока', e2: [0, 0.75, 0] }, 0.006, 0.1);
    }
    CYL.forEach((z, i) => {
      add(mesh(merge([cyl(v3(X0, 0.765, z), v3(X0, 0.8, z), 0.018), box(X0 + 0.025, 0.792, z, 0.04, 0.016, 0.03)]), M.black),
        { group: g, type: 'coil', name: `Катушка зажигания №${i + 1}`, e2: [0, 0.95, 0] });
      add(mesh(merge([cyl(v3(X0, 0.615, z), v3(X0, 0.64, z), 0.006), cyl(v3(X0, 0.64, z), v3(X0, 0.655, z), 0.01, 0.01, 6), cyl(v3(X0, 0.655, z), v3(X0, 0.71, z), 0.007)]), M.white),
        { group: g, type: 'plug', name: `Свеча зажигания №${i + 1}`, e2: [0, 0.72, 0] });
    });
    // Впуск
    const im = add(mesh(merge([
      cyl(v3(X0 + 0.25, 0.7, -0.12), v3(X0 + 0.25, 0.7, 0.32), 0.045),
      ...CYL.map((z) => tube([v3(X0 + 0.25, 0.7, z), v3(X0 + 0.22, 0.735, z), v3(X0 + 0.16, 0.71, z), v3(X0 + 0.13, 0.67, z)], 0.02, 16, 10)),
    ]), M.trim), { group: g, type: 'intake', name: 'Впускной коллектор', e2: [0.35, 0.12, 0] });
    add(mesh(cyl(v3(X0 + 0.25, 0.7, -0.12), v3(X0 + 0.25, 0.7, -0.19), 0.04), M.alu),
      { group: g, type: 'throttle', name: 'Дроссельный узел', host: im, e2: [0.05, 0, -0.18] });
    const rail = add(mesh(cyl(v3(X0 + 0.15, 0.62, -0.13), v3(X0 + 0.15, 0.62, 0.33), 0.011), M.steel),
      { group: g, type: 'fuel_rail', name: 'Топливная рампа', e2: [0.22, 0.04, 0] });
    CYL.forEach((z, i) => add(mesh(cyl(v3(X0 + 0.13, 0.61, z), v3(X0 + 0.155, 0.63, z), 0.008), M.trim),
      { group: g, type: 'injector', name: `Форсунка №${i + 1}`, host: rail, e2: [0.08, -0.03, 0] }));
    // Выпуск
    const em = add(mesh(merge([
      ...CYL.map((z) => tube([v3(X0 - 0.13, 0.65, z), v3(X0 - 0.18, 0.62, z), v3(X0 - 0.2, 0.54, (z + 0.1) / 2 + 0.05), v3(X0 - 0.19, 0.47, 0.1)], 0.018, 16, 10)),
      cyl(v3(X0 - 0.19, 0.42, 0.1), v3(X0 - 0.19, 0.5, 0.1), 0.03),
    ]), M.iron), { group: g, type: 'exhaust_manifold', name: 'Выпускной коллектор', e2: [-0.38, 0, 0] });
    add(mesh(box(X0 - 0.24, 0.58, 0.1, 0.006, 0.17, 0.46), M.alu),
      { group: g, type: 'heat_shield', name: 'Тепловой экран коллектора', host: em, e2: [-0.14, 0.05, 0] });
    add(mesh(box(X0 - 0.137, 0.65, 0.1, 0.004, 0.05, 0.46), M.steel),
      { group: g, type: 'gasket', name: 'Прокладка выпускного коллектора', e2: [-0.2, 0, 0] });
    // Навесное
    add(mesh(box(X0, 0.49, 0.37, 0.24, 0.38, 0.04), M.castAlu), { group: g, type: 'timing_cover', name: 'Крышка цепи ГРМ', e2: [0, 0, 0.18] });
    add(mesh(merge([cyl(v3(X0, 0.36, 0.395), v3(X0, 0.36, 0.425), 0.07, 0.07, 32), cyl(v3(X0, 0.36, 0.425), v3(X0, 0.36, 0.432), 0.03)]), M.steel),
      { group: g, type: 'crank_pulley', name: 'Шкив коленвала', e2: [0, 0, 0.3] });
    bolt(v3(X0, 0.36, 0.44), v3(0, 0, 1), { group: g, type: 'bolt_body', name: 'Болт шкива коленвала', e2: [0, 0, 0.45] }, 0.008, 0.04);
    add(mesh(merge([cyl(v3(X0 + 0.065, 0.55, 0.39), v3(X0 + 0.065, 0.55, 0.4), 0.04), cyl(v3(X0 + 0.065, 0.55, 0.4), v3(X0 + 0.065, 0.55, 0.425), 0.05, 0.05, 28)]), M.steel),
      { group: g, type: 'water_pump', name: 'Помпа (водяной насос)', e2: [0, 0.05, 0.25] });
    const altP = [X0 + 0.225, 0.5];
    add(mesh(merge([
      cyl(v3(...altP, 0.3), v3(...altP, 0.4), 0.06, 0.06, 24),
      cyl(v3(...altP, 0.4), v3(...altP, 0.425), 0.03, 0.03, 20),
    ]), M.alu), { group: g, type: 'alternator', name: 'Генератор', e2: [0.32, 0.02, 0.15] });
    const acP = [X0 + 0.225, 0.33];
    add(mesh(merge([
      cyl(v3(...acP, 0.24), v3(...acP, 0.4), 0.055, 0.055, 24),
      cyl(v3(...acP, 0.4), v3(...acP, 0.425), 0.055, 0.055, 28),
    ]), M.alu), { group: g, type: 'ac_comp', name: 'Компрессор кондиционера', e2: [0.38, -0.12, 0.12] });
    add(mesh(beltGeo([[X0, 0.36, 0.07], [...acP, 0.055], [...altP, 0.03], [X0 + 0.065, 0.55, 0.05]], 0.412, 0.02), M.rubber),
      { group: g, type: 'belt', name: 'Ремень привода навесного оборудования', e2: [0, 0, 0.5] });
    add(mesh(merge([cyl(v3(X0 - 0.28, 0.43, -0.3), v3(X0 - 0.28, 0.43, -0.13), 0.045), cyl(v3(X0 - 0.28, 0.47, -0.25), v3(X0 - 0.28, 0.5, -0.25), 0.025)]), M.darkSteel),
      { group: g, type: 'starter', name: 'Стартер', e2: [-0.25, 0, -0.25] });
    add(mesh(merge([cyl(v3(X0, 0.36, -0.172), v3(X0, 0.36, -0.158), 0.15, 0.15, 40), new THREE.TorusGeometry(0.15, 0.007, 6, 60).translate(X0, 0.36, -0.165)]), M.steel),
      { group: g, type: 'flywheel', name: 'Ведущий диск (маховик)', e2: [0, 0, -0.32] });
    add(mesh(cyl(v3(X0 + 0.125, 0.38, 0.24), v3(X0 + 0.2, 0.38, 0.24), 0.035), M.white),
      { group: g, type: 'oil_filter', name: 'Масляный фильтр', e2: [0.32, -0.05, 0] });
    add(mesh(merge([cyl(v3(X0 + 0.1, 0.45, -0.12), v3(X0 + 0.12, 0.79, -0.13), 0.005), new THREE.TorusGeometry(0.015, 0.004, 6, 16).translate(X0 + 0.12, 0.805, -0.13)]), M.yellow),
      { group: g, type: 'dipstick', name: 'Щуп уровня масла', e2: [0, 0.65, 0] });
    add(mesh(cyl(v3(X0 - 0.02, 0.62, -0.16), v3(X0 - 0.02, 0.62, -0.2), 0.03), M.castAlu),
      { group: g, type: 'thermostat', name: 'Корпус термостата', e2: [0, 0.05, -0.22] });
    // Опоры
    for (const [p, sz, n, e] of [
      [v3(X0, 0.5, 0.47), [0.1, 0.08, 0.14], 'правая', [0, 0.1, 0.28]],
      [v3(1.42, 0.6, -0.5), [0.1, 0.08, 0.12], 'левая', [0, 0.1, -0.28]],
      [v3(X0 - 0.2, 0.22, 0.1), [0.14, 0.05, 0.06], 'задняя', [-0.25, -0.1, 0]],
    ]) {
      const m = add([mesh(box(p.x, p.y, p.z, ...sz), M.darkSteel), mesh(box(p.x, p.y, p.z, sz[0] * 0.6, sz[1] * 1.04, sz[2] * 0.6), M.rubber)],
        { group: g, type: 'engine_mount', name: `Опора двигателя ${n}`, e2: e });
      bolt(v3(p.x + sz[0] * 0.3, p.y + sz[1] / 2, p.z), v3(0, 1, 0), { group: g, host: m, name: 'Болт опоры двигателя' }, 0.007, 0.04);
      bolt(v3(p.x - sz[0] * 0.3, p.y + sz[1] / 2, p.z), v3(0, 1, 0), { group: g, host: m, name: 'Болт опоры двигателя' }, 0.007, 0.04);
    }
    // Воздушный фильтр
    const ab = add(mesh(box(1.42, 0.735, -0.38, 0.3, 0.05, 0.26), M.black), { group: g, type: 'air_box', name: 'Корпус воздушного фильтра', e2: [-0.05, 0.3, -0.3] });
    add(mesh(box(1.42, 0.775, -0.38, 0.3, 0.03, 0.26), M.black), { group: g, type: 'air_box', name: 'Крышка корпуса воздушного фильтра', host: ab, e2: [0, 0.22, 0] });
    add(mesh(box(1.42, 0.762, -0.38, 0.26, 0.022, 0.22), M.white), { group: g, type: 'air_filter', name: 'Фильтрующий элемент воздушного фильтра', host: ab, e2: [0, 0.12, 0] });
    add(mesh(tube([v3(1.57, 0.75, -0.3), v3(1.68, 0.75, -0.22), v3(X0 + 0.25, 0.7, -0.2)], 0.035, 24, 14), M.rubber),
      { group: g, type: 'intake_hose', name: 'Воздуховод (гофра) к дросселю', e2: [0.15, 0.3, -0.2] });
    void block;
  }

  // ─────────────────────────── ТРАНСМИССИЯ ───────────────────────────
  function buildTransmission() {
    const g = 'trans';
    add(mesh(cyl(v3(X0, 0.36, -0.15), v3(X0, 0.36, -0.26), 0.16, 0.14, 36), M.castAlu), { group: g, type: 'bell', name: 'Картер гидротрансформатора' });
    add(mesh(cyl(v3(X0, 0.36, -0.175), v3(X0, 0.36, -0.245), 0.13, 0.13, 36), M.steel), { group: g, type: 'torque_conv', name: 'Гидротрансформатор', e2: [0, 0, 0.3] });
    add(mesh(merge([box(1.46, 0.41, -0.355, 0.32, 0.3, 0.19), cyl(v3(FA, WR, -0.24), v3(FA, WR, -0.44), 0.09, 0.09, 28)]), M.castAlu),
      { group: g, type: 'trans_case', name: 'Картер АКПП' });
    add(mesh(cyl(v3(FA, WR, -0.31), v3(FA, WR, -0.35), 0.075, 0.075, 30), M.steel), { group: g, type: 'differential', name: 'Дифференциал с ведомой шестернёй', e2: [0, -0.25, 0.05] });
    const tp = add(mesh(box(1.5, 0.245, -0.355, 0.24, 0.03, 0.17), M.castAlu), { group: g, type: 'trans_pan', name: 'Поддон АКПП' });
    for (const dx of [-0.1, 0.1]) bolt(v3(1.5 + dx, 0.232, -0.355), v3(0, -1, 0), { group: g, host: tp, type: 'pan_bolt', name: 'Болт поддона АКПП' }, 0.004, 0.018);
    add(mesh(box(1.42, 0.6, -0.5, 0.06, 0.06, 0.08), M.darkSteel), { group: g, type: 'trans_mount', name: 'Кронштейн опоры АКПП' });
    // Приводы
    const drive = (s, zIn, zMid0, zMid1, zOut) => {
      const P = (z) => v3(FA, WR, s * z);
      const e1 = [0, -0.4, s * 0.25];
      const nm = s > 0 ? 'правого' : 'левого';
      add(mesh(cyl(P(zIn), P(zIn + 0.05), 0.04, 0.045, 20), M.steel), { group: g, type: 'cv_inner', name: `ШРУС внутренний ${sn(s)}`, e1, e2: [0, 0, -s * 0.12] });
      add(mesh(cyl(P(zIn + 0.05), P(zIn + 0.1), 0.038, 0.016, 16), M.rubber), { group: g, type: 'cv_boot', name: `Пыльник внутреннего ШРУС ${nm} привода`, e1, e2: [0, 0.08, -s * 0.05] });
      add(mesh(cyl(P(zMid0), P(zMid1), 0.014, 0.014, 12), M.steel), { group: g, type: 'driveshaft', name: `Вал привода ${nm} колеса`, e1, e2: [0, 0, 0] });
      add(mesh(cyl(P(zOut - 0.1), P(zOut - 0.06), 0.016, 0.038, 16), M.rubber), { group: g, type: 'cv_boot', name: `Пыльник наружного ШРУС ${nm} привода`, e1, e2: [0, 0.08, s * 0.05] });
      add(mesh(sphere(P(zOut - 0.03), 0.045, 1, 1, 0.8), M.steel), { group: g, type: 'cv_outer', name: `ШРУС наружный ${sn(s)}`, e1, e2: [0, 0, s * 0.12] });
    };
    drive(-1, 0.44, 0.52, 0.56, 0.62);
    add(mesh(cyl(v3(FA, WR, -0.24), v3(FA, WR, 0.3), 0.016, 0.016, 12), M.steel), { group: g, type: 'driveshaft', name: 'Промежуточный вал правого привода', e1: [0, -0.4, 0.1] });
    drive(1, 0.3, 0.38, 0.54, 0.62);
  }

  // ─────────────────────────── ОХЛАЖДЕНИЕ ───────────────────────────
  function buildCooling() {
    const g = 'cool';
    const rad = add([
      mesh(box(1.95, 0.48, 0, 0.035, 0.34, 0.68), M.alu),
      mesh(merge([box(1.95, 0.48, 0.37, 0.05, 0.38, 0.06), box(1.95, 0.48, -0.37, 0.05, 0.38, 0.06)]), M.black),
    ], { group: g, type: 'radiator', name: 'Радиатор охлаждения' });
    add(mesh(cyl(v3(1.95, 0.67, 0.3), v3(1.95, 0.69, 0.3), 0.022), M.steel), { group: g, type: 'rad_cap', name: 'Крышка радиатора', host: rad, e2: [0, 0.14, 0] });
    add(mesh(box(1.99, 0.47, 0, 0.018, 0.32, 0.7), M.darkSteel), { group: g, type: 'condenser', name: 'Конденсатор кондиционера' });
    const sh = shape([[-0.36, 0.31], [0.36, 0.31], [0.36, 0.65], [-0.36, 0.65]]);
    for (const z of [-0.17, 0.17]) { const h = new THREE.Path(); h.absarc(z, 0.48, 0.15, 0, Math.PI * 2, true); sh.holes.push(h); }
    add(mesh(extrudeZ(sh, 0, 0.02, 0.003).rotateY(Math.PI / 2).translate(1.9, 0, 0), M.black), { group: g, type: 'shroud', name: 'Диффузор вентиляторов' });
    for (const z of [-0.17, 0.17]) {
      const blades = [];
      for (let i = 0; i < 7; i++) {
        const b = new THREE.BoxGeometry(0.006, 0.12, 0.05).translate(0, 0.075, 0).rotateY(0.35);
        b.rotateX((i / 7) * Math.PI * 2);
        blades.push(b.translate(1.875, 0.48, z));
      }
      add(mesh(merge([cyl(v3(1.84, 0.48, z), v3(1.88, 0.48, z), 0.045, 0.045, 20), ...blades]), M.black),
        { group: g, type: 'fan', name: `Электровентилятор ${z > 0 ? 'правый' : 'левый'}` });
    }
    add(mesh(box(1.8, 0.62, 0.66, 0.1, 0.12, 0.08), M.tankWhite), { group: g, type: 'exp_tank', name: 'Расширительный бачок' });
    add(mesh(tube([v3(X0 - 0.02, 0.62, -0.2), v3(1.64, 0.66, -0.26), v3(1.82, 0.64, -0.3), v3(1.93, 0.62, -0.34)], 0.018, 24, 10), M.hose),
      { group: g, type: 'hose_up', name: 'Патрубок радиатора верхний' });
    add(mesh(tube([v3(1.93, 0.35, 0.34), v3(1.82, 0.33, 0.34), v3(1.7, 0.4, 0.34), v3(X0 + 0.1, 0.45, 0.36)], 0.018, 24, 10), M.hose),
      { group: g, type: 'hose_low', name: 'Патрубок радиатора нижний' });
  }

  // ─────────────────────────── ЭЛЕКТРИКА ───────────────────────────
  function buildElectrics() {
    const g = 'elec';
    add(mesh(box(1.78, 0.46, -0.6, 0.22, 0.02, 0.16), M.black), { group: g, type: 'battery_clamp', name: 'Полка аккумулятора', desc: 'Пластиковая полка (поддон) аккумулятора.' });
    const bat = add([mesh(box(1.78, 0.56, -0.6, 0.2, 0.18, 0.13), M.trim), mesh(box(1.78, 0.655, -0.6, 0.2, 0.012, 0.13), M.plasticGrey)],
      { group: g, type: 'battery', name: 'Аккумулятор' });
    for (const [dx, n, m] of [[-0.07, 'плюсовая', M.red], [0.07, 'минусовая', M.black]]) {
      add([mesh(cyl(v3(1.78 + dx, 0.66, -0.64), v3(1.78 + dx, 0.68, -0.64), 0.012), M.brass), mesh(box(1.78 + dx, 0.676, -0.6, 0.02, 0.012, 0.05), m)],
        { group: g, type: 'terminal', name: `Клемма ${n}`, host: bat, e2: [0, 0.18, -0.05] });
    }
    const cl = add(mesh(box(1.78, 0.668, -0.565, 0.24, 0.01, 0.025), M.darkSteel), { group: g, type: 'battery_clamp', name: 'Прижимная планка АКБ', host: bat, e2: [0, 0.28, 0.05] });
    for (const dx of [-0.11, 0.11]) add(mesh(merge([cyl(v3(1.78 + dx, 0.47, -0.565), v3(1.78 + dx, 0.685, -0.565), 0.004), nutGeo(v3(1.78 + dx, 0.678, -0.565), v3(0, 1, 0), 0.006)]), M.steel),
      { group: g, type: 'bolt_body', name: 'Шпилька крепления АКБ (J-болт)', host: cl, e2: [0, 0.18, 0] });
    const fb = add(mesh(box(1.62, 0.6, -0.62, 0.12, 0.12, 0.09), M.black), { group: g, type: 'fuse_box', name: 'Блок предохранителей и реле' });
    add(mesh(box(1.62, 0.665, -0.62, 0.12, 0.012, 0.09), M.black), { group: g, type: 'fuse_box', name: 'Крышка блока предохранителей', host: fb, e2: [0, 0.14, 0] });
    add(mesh(box(0.86, 0.6, -0.45, 0.12, 0.03, 0.16), M.alu), { group: g, type: 'ecu', name: 'ЭБУ двигателя', e1: [0.6, 1.9, -0.9] });
    add(mesh(merge([cyl(v3(2.1, 0.4, 0.45), v3(2.12, 0.4, 0.45), 0.045), box(2.09, 0.46, 0.45, 0.01, 0.07, 0.02)]), M.red), { group: g, type: 'horn', name: 'Звуковой сигнал' });
  }

  // ─────────────────────────── ТОПЛИВО ───────────────────────────
  function buildFuel() {
    const g = 'fuel';
    const tank = add(mesh(extrudeZ(shape([[-0.5, 0.215], [-1.08, 0.215], [-1.12, 0.15], [-1.07, 0.11], [-0.55, 0.11], [-0.5, 0.15]]), -0.65, 0.2, 0.01), M.trim),
      { group: g, type: 'tank', name: 'Топливный бак' });
    add(mesh(merge([cyl(v3(-0.8, 0.2, -0.3), v3(-0.8, 0.235, -0.3), 0.06, 0.06, 24), cyl(v3(-0.8, 0.235, -0.3), v3(-0.8, 0.245, -0.3), 0.04)]), M.plasticGrey),
      { group: g, type: 'fuel_pump', name: 'Модуль топливного насоса', host: tank, e2: [0, 0.32, 0] });
    const neck = add(mesh(tube([v3(-1.08, 0.18, -0.55), v3(-1.37, 0.2, -0.55), v3(-1.8, 0.35, -0.6), v3(-1.78, 0.7, -0.78), v3(-1.75, 0.86, -0.84)], 0.022, 48, 10), M.darkSteel),
      { group: g, type: 'filler_neck', name: 'Заливная горловина' });
    add(mesh(cyl(v3(-1.75, 0.86, -0.835), v3(-1.75, 0.86, -0.855), 0.03), M.black), { group: g, type: 'fuel_cap', name: 'Пробка бензобака', host: neck, e2: [0, 0, -0.15] });
    add(mesh(tube([v3(-0.5, 0.17, -0.2), v3(0.2, 0.17, -0.2), v3(0.9, 0.18, -0.2), v3(1.15, 0.3, -0.1), v3(X0 + 0.15, 0.6, -0.13)], 0.005, 80, 6), M.steel),
      { group: g, type: 'fuel_line', name: 'Топливопровод' });
  }

  // ─────────────────────────── ВЫХЛОП ───────────────────────────
  function buildExhaust() {
    const g = 'exhaust';
    add(mesh(new THREE.TorusGeometry(0.032, 0.006, 8, 24).rotateX(Math.PI / 2).translate(X0 - 0.19, 0.415, 0.1), M.steel),
      { group: g, type: 'gasket', name: 'Прокладка приёмной трубы', e2: [0, 0.1, 0] });
    add(mesh(tube([v3(X0 - 0.19, 0.42, 0.1), v3(1.26, 0.33, 0.1), v3(1.12, 0.21, 0.09), v3(0.98, 0.18, 0.08)], 0.025, 32, 12), M.darkSteel),
      { group: g, type: 'downpipe', name: 'Приёмная труба' });
    add(mesh(cyl(v3(0.97, 0.18, 0.08), v3(0.62, 0.18, 0.08), 0.065, 0.065, 24).scale(1, 1, 1), M.steel), { group: g, type: 'catalyst', name: 'Каталитический нейтрализатор' });
    add(mesh(tube([v3(0.62, 0.18, 0.08), v3(0.4, 0.17, 0.15), v3(0.15, 0.16, 0.3), v3(0.12, 0.16, 0.32)], 0.023, 24, 12), M.darkSteel), { group: g, type: 'downpipe', name: 'Средняя труба', desc: 'Средняя часть выпускного тракта.' });
    add(mesh(cyl(v3(0.12, 0.16, 0.32), v3(-0.35, 0.16, 0.32), 0.055, 0.055, 24), M.steel), { group: g, type: 'resonator', name: 'Резонатор' });
    add(mesh(tube([v3(-0.35, 0.16, 0.32), v3(-0.6, 0.16, 0.36), v3(-1.0, 0.17, 0.38), v3(-1.2, 0.25, 0.38), v3(-1.37, 0.33, 0.38), v3(-1.55, 0.31, 0.38), v3(-1.74, 0.31, 0.38)], 0.023, 60, 12), M.darkSteel),
      { group: g, type: 'downpipe', name: 'Задняя труба', desc: 'Труба, огибающая заднюю подвеску над подрамником.' });
    add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.36, 28).rotateZ(Math.PI / 2).scale(1, 1, 2.3).translate(-1.92, 0.33, 0.36), M.steel), { group: g, type: 'muffler', name: 'Глушитель основной' });
    add(mesh(tube([v3(-2.1, 0.3, 0.5), v3(-2.2, 0.24, 0.52), v3(-2.28, 0.21, 0.52)], 0.028, 16, 14), M.chrome), { group: g, type: 'tailpipe', name: 'Насадка глушителя', e2: [-0.25, 0, 0] });
    for (const [x, y0, y1, z] of [[-0.62, 0.183, 0.22, 0.36], [-1.8, 0.415, 0.505, 0.36], [-2.05, 0.415, 0.505, 0.5]]) {
      add(mesh(cyl(v3(x, y0, z), v3(x, y1, z), 0.012), M.rubber), { group: g, type: 'hanger', name: 'Подушка подвеса глушителя', e2: [0, 0.12, 0] });
    }
    for (const [p, ax] of [[v3(0.62, 0.18, 0.08), 'x'], [v3(-0.35, 0.16, 0.32), 'x']]) {
      add(mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 20).rotateY(Math.PI / 2).translate(p.x, p.y, p.z), M.steel), { group: g, type: 'clamp', name: 'Хомут выхлопной трубы', e2: [0, -0.12, 0] });
      void ax;
    }
  }

  // ───────────────────── ХОДОВАЯ: подвеска, тормоза, колёса ─────────────────────
  function buildChassis() {
    // Подрамники и стабилизаторы
    add(mesh(merge([
      box(1.15, 0.17, 0, 0.06, 0.05, 0.9), box(1.55, 0.17, 0, 0.06, 0.05, 0.8),
      box(1.35, 0.17, 0.4, 0.46, 0.05, 0.06), box(1.35, 0.17, -0.4, 0.46, 0.05, 0.06),
    ]), M.darkSteel), { group: 'susp', type: 'subframe', name: 'Подрамник передний', e1: [0, -0.35, 0] });
    const swayPts = (x, y, w) => [v3(x + 0.1, y + 0.08, w), v3(x - 0.02, y + 0.02, w - 0.1), v3(x - 0.05, y, 0.25), v3(x - 0.05, y, -0.25), v3(x - 0.02, y + 0.02, -w + 0.1), v3(x + 0.1, y + 0.08, -w)];
    add(mesh(tube(swayPts(FA - 0.2, 0.22, 0.58), 0.011, 60, 8), M.trim), { group: 'susp', type: 'sway_bar', name: 'Стабилизатор передний', e1: [0, -0.45, 0] });
    add(mesh(box(RA, 0.23, 0, 0.1, 0.05, 1.0), M.darkSteel), { group: 'susp', type: 'rear_crossmember', name: 'Подрамник задний', e1: [0, -0.35, 0] });
    add(mesh(tube(swayPts(RA + 0.18, 0.2, 0.56).map((p) => v3(2 * (RA + 0.18) - p.x, p.y, p.z)), 0.009, 60, 8), M.trim), { group: 'susp', type: 'sway_bar', name: 'Стабилизатор задний', e1: [0, -0.45, 0] });

    for (const ax of AXLES) for (const s of SIDES) {
      const X = ax.x, Z = (l) => s * (TR + l); // локальная координата вдоль оси колеса
      const corner = `${ax.n} ${sn(s, 'n')}`;
      const cornerM = `(${corner} колесо)`;
      const C = v3(X, WR, s * TR);
      const rot = s > 0 ? 0 : Math.PI;
      const local = (g, mat) => { const m = mesh(g, mat); m.position.copy(C); m.rotation.y = rot; return m; };
      const out = (k) => [0, 0, s * k];

      // ── Колесо
      const tireProfile = [[0.205, -0.09], [0.24, -0.102], [0.29, -0.1], [0.308, -0.088], [0.316, -0.06], [0.317, 0], [0.316, 0.06], [0.308, 0.088], [0.29, 0.1], [0.24, 0.102], [0.205, 0.09]]
        .map(([r, y]) => new THREE.Vector2(r, y));
      const tireG = new THREE.LatheGeometry(tireProfile, 64).rotateX(Math.PI / 2);
      const grooves = [-0.05, -0.017, 0.017, 0.05].map((z) => new THREE.TorusGeometry(0.312, 0.004, 4, 64).translate(0, 0, z));
      add(local(merge([tireG, ...grooves]), M.rubber), { group: 'wheel', type: 'tire', name: `Шина (${corner} колесо)`, e2: [0, 0, 0] });
      const spokes = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        for (const o of [-0.13, 0.13]) {
          spokes.push(new THREE.BoxGeometry(0.135, 0.022, 0.018).rotateY(-0.38).translate(0.128, 0, 0.045).rotateZ(a + o));
        }
      }
      const rim = add(local(merge([
        new THREE.CylinderGeometry(0.196, 0.196, 0.19, 48, 1, true).rotateX(Math.PI / 2),
        new THREE.TorusGeometry(0.2, 0.011, 8, 48).translate(0, 0, 0.092),
        new THREE.TorusGeometry(0.2, 0.009, 8, 48).translate(0, 0, -0.093),
        new THREE.CylinderGeometry(0.075, 0.075, 0.02, 32).rotateX(Math.PI / 2).translate(0, 0, 0.01),
        ...spokes,
      ]), M.alu), { group: 'wheel', type: 'rim', name: `Диск колёсный ${cornerM}`, e2: out(0.38) });
      add(local(new THREE.CylinderGeometry(0.035, 0.038, 0.014, 28).rotateX(Math.PI / 2).translate(0, 0, 0.027), M.chrome),
        { group: 'wheel', type: 'cap', name: `Колпачок ступицы ${cornerM}`, host: rim, e2: out(0.3) });
      add(local(new THREE.CylinderGeometry(0.004, 0.004, 0.035, 8).rotateX(Math.PI / 2 - 0.5).translate(0, 0.178, 0.07), M.darkSteel),
        { group: 'wheel', type: 'valve_stem', name: `Вентиль шины ${cornerM}`, host: rim, e2: [0, 0.12, s * 0.08] });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2 + Math.PI / 5;
        const g = merge([
          new THREE.CylinderGeometry(0.0105, 0.0105, 0.016, 6).rotateX(Math.PI / 2).translate(0, 0, 0.028),
          new THREE.CylinderGeometry(0.007, 0.0105, 0.01, 12).rotateX(Math.PI / 2).translate(0, 0, 0.015),
        ]).translate(Math.cos(a) * 0.057, Math.sin(a) * 0.057, 0);
        add(local(g, M.chrome), { group: 'wheel', type: 'lug_nut', name: `Гайка колеса №${i + 1} ${cornerM}`, e2: [0, Math.sin(a) * 0.06, s * 0.6] });
      }

      // ── Тормоз
      add(local(merge([
        new THREE.CylinderGeometry(0.14, 0.14, ax.front ? 0.025 : 0.012, 48).rotateX(Math.PI / 2).translate(0, 0, -0.033),
        new THREE.CylinderGeometry(0.08, 0.08, 0.03, 32, 1, true).rotateX(Math.PI / 2).translate(0, 0, -0.015),
        new THREE.CylinderGeometry(0.08, 0.08, 0.004, 32).rotateX(Math.PI / 2).translate(0, 0, -0.002),
      ]), M.iron), { group: 'brake', type: 'disc', name: `Тормозной диск ${cornerM}` });
      const angL = Math.atan2(0.072, -0.102 * s);
      const rC = ax.front ? 0.125 : 0.12;
      const cx = Math.cos(angL) * rC, cy = Math.sin(angL) * rC;
      const cal = add(local(new THREE.BoxGeometry(ax.front ? 0.1 : 0.085, 0.06, 0.07).rotateZ(angL - Math.PI / 2).translate(cx, cy, -0.035), M.trim),
        { group: 'brake', type: 'caliper', name: `Суппорт ${cornerM}`, e2: [-0.19, 0.14, 0] });
      for (const [dz, n] of [[0.0175, 'наружная'], [-0.0175, 'внутренняя']]) {
        add(local(new THREE.BoxGeometry(0.075, 0.045, 0.01).rotateZ(angL - Math.PI / 2).translate(Math.cos(angL) * 0.112, Math.sin(angL) * 0.112, -0.033 + dz), M.pad),
          { group: 'brake', type: 'pad', name: `Колодка ${n} ${ax.m === 'передний' ? 'передняя' : 'задняя'} ${sn(s, 'f')}`, host: cal, e2: [0, 0, (dz > 0 ? 1 : -1) * s * 0.1] });
      }
      const tang = new THREE.Vector2(-Math.sin(angL), Math.cos(angL));
      for (const k of [-1, 1]) {
        const bx = cx + tang.x * 0.04 * k, by = cy + tang.y * 0.04 * k;
        const g = boltGeo(v3(bx, by, -0.075), v3(0, 0, -1), 0.005, 0.03);
        add(local(g, M.steel), { group: 'brake', type: 'caliper_bolt', name: `Болт направляющей суппорта ${cornerM}`, host: cal, e2: [0, 0, -s * 0.12] });
      }
      add(local(new THREE.CylinderGeometry(0.15, 0.15, 0.003, 40).rotateX(Math.PI / 2).translate(0, 0, -0.078), M.darkSteel),
        { group: 'brake', type: 'shield', name: `Защитный кожух диска ${cornerM}`, e2: out(-0.18) });

      // ── Ступица и кулак
      const hub = add(local(merge([
        new THREE.CylinderGeometry(0.068, 0.068, 0.01, 32).rotateX(Math.PI / 2).translate(0, 0, -0.017),
        new THREE.CylinderGeometry(0.045, 0.05, 0.05, 28).rotateX(Math.PI / 2).translate(0, 0, -0.047),
      ]), M.steel), { group: 'susp', type: 'hub', name: `Ступица ${ax.f} ${sn(s, 'f')}`, e2: out(0.3) });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2 + Math.PI / 5;
        add(local(new THREE.CylinderGeometry(0.0055, 0.0055, 0.055, 8).rotateX(Math.PI / 2).translate(Math.cos(a) * 0.057, Math.sin(a) * 0.057, 0.012), M.steel),
          { group: 'susp', type: 'stud', name: `Шпилька колеса №${i + 1} ${cornerM}`, host: hub, e2: out(0.15) });
      }
      const kn = add(mesh(merge([
        box(X, 0.33, Z(-0.105), 0.08, 0.36, 0.05),
        box(X - 0.1 * (ax.front ? 1 : 0.5), 0.3, Z(-0.13), ax.front ? 0.2 : 0.1, 0.04, 0.03),
      ]), M.iron), { group: 'susp', type: ax.front ? 'knuckle' : 'rear_knuckle', name: `${ax.front ? 'Поворотный кулак' : 'Кулак задний'} ${sn(s)}` });
      void kn;

      // ── Амортизатор с пружиной
      const top = ax.front ? 0.79 : 0.62;
      const sx = ax.front ? X - 0.01 : X - 0.09;
      const bot = v3(sx, ax.front ? 0.48 : 0.2, s * (ax.front ? 0.63 : 0.55));
      const tp = v3(sx - 0.02, top, s * (ax.front ? 0.555 : 0.53));
      const dir = tp.clone().sub(bot).normalize();
      const at = (y) => bot.clone().addScaledVector(dir, (y - bot.y) / dir.y);
      add(mesh(merge([
        cyl(bot, at(top - 0.12), 0.028, 0.028, 20),
        cyl(at(top - 0.12), tp, 0.01, 0.01, 10),
        cyl(at(top - (ax.front ? 0.16 : 0.32)), at(top - (ax.front ? 0.15 : 0.31)), 0.085, 0.085, 28),
        box(bot.x, bot.y - 0.02, bot.z, 0.06, 0.06, 0.05),
      ]), M.darkSteel), { group: 'susp', type: ax.front ? 'strut' : 'rear_shock', name: ax.front ? `Стойка амортизатора ${sn(s, 'f')}` : `Амортизатор задний ${sn(s)}`, e2: [0, ax.front ? 0.3 : 0.25, s * 0.15] });
      add(mesh(springGeo(at(top - (ax.front ? 0.15 : 0.31)), at(top - 0.01), ax.front ? 0.072 : 0.058, 0.008, ax.front ? 5 : 5.5), M.red),
        { group: 'susp', type: 'spring', name: `Пружина ${ax.f} ${sn(s, 'f')}`, e2: [0, ax.front ? 0.42 : 0.35, s * 0.28] });
      const mount = add(mesh(cyl(at(top - 0.01), at(top + 0.02), 0.06, 0.05, 24), M.rubber),
        { group: 'susp', type: 'strut_mount', name: `Опора ${ax.front ? 'стойки' : 'амортизатора'} ${ax.f} ${sn(s, 'f')}`, e2: [0, ax.front ? 0.55 : 0.45, s * 0.15] });
      add(mesh(nutGeo(at(top + 0.03), dir, 0.009), M.steel),
        { group: 'susp', type: 'strut_nut', name: `Гайка штока амортизатора ${cornerM}`, host: mount, e2: [0, 0.12, 0] });

      // ── Рычаги
      if (ax.front) {
        const bj = v3(X, 0.17, s * 0.63);
        add(mesh(merge([
          tube([v3(X + 0.18, 0.19, s * 0.3), bj, v3(X - 0.2, 0.19, s * 0.32)], 0.018, 24, 10),
          cyl(v3(X + 0.15, 0.19, s * 0.3), v3(X + 0.21, 0.19, s * 0.3), 0.025),
          cyl(v3(X - 0.2, 0.17, s * 0.32), v3(X - 0.2, 0.21, s * 0.32), 0.035),
        ]), M.darkSteel), { group: 'susp', type: 'lca', name: `Рычаг передний нижний ${sn(s)}`, e2: [0, -0.15, s * 0.1] });
        add(mesh(sphere(bj, 0.022), M.steel), { group: 'susp', type: 'ball_joint', name: `Шаровая опора ${sn(s, 'f')}`, e2: [0, -0.1, s * 0.15] });
        add(mesh(cyl(v3(X - 0.1, 0.3, s * 0.58), v3(X - 0.04, 0.5, s * 0.6), 0.007), M.steel),
          { group: 'susp', type: 'sway_link', name: `Стойка стабилизатора ${sn(s, 'f')}`, e2: [0, 0.05, s * 0.2] });
      } else {
        add(mesh(merge([tube([v3(X + 0.05, 0.18, s * 0.25), v3(X, 0.17, s * 0.62)], 0.022, 8, 10), cyl(v3(X + 0.02, 0.18, s * 0.25), v3(X + 0.08, 0.18, s * 0.25), 0.03)]), M.darkSteel),
          { group: 'susp', type: 'rear_lower_arm', name: `Рычаг задний нижний ${sn(s)}`, e2: [0, -0.15, s * 0.05] });
        add(mesh(merge([tube([v3(X - 0.02, 0.5, s * 0.4), v3(X, 0.5, s * 0.62)], 0.016, 8, 10), cyl(v3(X - 0.05, 0.5, s * 0.4), v3(X + 0.01, 0.5, s * 0.4), 0.025)]), M.darkSteel),
          { group: 'susp', type: 'rear_upper_arm', name: `Рычаг задний верхний ${sn(s)}`, e2: [0, 0.2, s * 0.05] });
      }
    }

    // Гидравлика тормозов (не зеркально)
    add(mesh(cyl(v3(0.965, 0.66, 0.38), v3(1.14, 0.66, 0.38), 0.11, 0.11, 32), M.trim), { group: 'brake', type: 'booster', name: 'Вакуумный усилитель тормозов', e1: [0.4, 1.25, 0.55] });
    add(mesh(cyl(v3(1.14, 0.66, 0.38), v3(1.29, 0.66, 0.38), 0.035, 0.035, 20), M.castAlu), { group: 'brake', type: 'master_cyl', name: 'Главный тормозной цилиндр', e1: [0.55, 1.25, 0.55] });
    add(mesh(box(1.2, 0.72, 0.38, 0.09, 0.06, 0.07), M.tankWhite), { group: 'brake', type: 'brake_res', name: 'Бачок тормозной жидкости', e1: [0.55, 1.45, 0.55] });
  }

  // ─────────────────────────── РУЛЕВОЕ ───────────────────────────
  function buildSteering() {
    const g = 'steer';
    const RX = 1.1, RY = 0.4;
    add(mesh(merge([
      cyl(v3(RX, RY, -0.36), v3(RX, RY, 0.36), 0.024, 0.024, 16),
      cyl(v3(RX, RY - 0.03, 0.3), v3(RX, RY + 0.06, 0.3), 0.03, 0.03, 16),
    ]), M.castAlu), { group: g, type: 'rack', name: 'Рулевая рейка' });
    for (const s of SIDES) {
      const nm = sn(s, 'f');
      add(mesh(cyl(v3(RX, RY, s * 0.36), v3(RX, RY, s * 0.46), 0.03, 0.014, 16), M.rubber), { group: g, type: 'cv_boot', name: `Пыльник рулевой рейки ${sn(s)}`, desc: 'Гофрированный пыльник защищает рейку от грязи.' });
      add(mesh(cyl(v3(RX, RY, s * 0.44), v3(FA - 0.19, 0.31, s * 0.6), 0.009, 0.009, 10), M.steel), { group: g, type: 'tie_rod', name: `Рулевая тяга ${nm}` });
      add(mesh(merge([sphere(v3(FA - 0.18, 0.305, s * 0.61), 0.018), cyl(v3(FA - 0.18, 0.28, s * 0.61), v3(FA - 0.18, 0.33, s * 0.61), 0.007)]), M.darkSteel),
        { group: g, type: 'tie_rod_end', name: `Рулевой наконечник ${sn(s)}` });
    }
    const colA = v3(0.95, 0.61, 0.37), colB = v3(0.52, 0.86, 0.37);
    add(mesh(merge([cyl(v3(RX, RY + 0.06, 0.3), colA, 0.011), sphere(colA, 0.018)]), M.steel), { group: g, type: 'int_shaft', name: 'Карданный вал рулевой колонки', e1: [0, 0.15, 0.7] });
    add(mesh(merge([cyl(colA, colB, 0.03, 0.03, 16), box(0.62, 0.8, 0.37, 0.16, 0.08, 0.12)]), M.trim), { group: g, type: 'column', name: 'Рулевая колонка', e1: [0, 0.35, 0.85] });
    const d = colB.clone().sub(colA).normalize();
    const c = v3(0.45, 0.9, 0.37);
    const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), d.clone().negate());
    const wheel = merge([
      new THREE.TorusGeometry(0.185, 0.016, 12, 48),
      ...[Math.PI / 2 + 0.2, Math.PI / 2 - 0.2 + Math.PI, -Math.PI / 2].map((a) => new THREE.BoxGeometry(0.15, 0.03, 0.015).translate(0.1, 0, 0.02).rotateZ(a)),
      new THREE.CylinderGeometry(0.04, 0.04, 0.05, 20).rotateX(Math.PI / 2).translate(0, 0, 0.02),
    ]).applyQuaternion(q).translate(c.x, c.y, c.z);
    const sw = add(mesh(wheel, M.dash), { group: g, type: 'steering_wheel', name: 'Рулевое колесо', e1: [0, 0.4, 1.05] });
    const bag = new THREE.CylinderGeometry(0.075, 0.08, 0.04, 28).rotateX(Math.PI / 2).translate(0, 0, 0.055).applyQuaternion(q).translate(c.x, c.y, c.z);
    add(mesh(bag, M.trim), { group: g, type: 'airbag', name: 'Подушка безопасности водителя', host: sw, e2: d.clone().multiplyScalar(-0.22) });
    add(mesh(nutGeo(c.clone().addScaledVector(d, 0.0), d, 0.01), M.steel), { group: g, type: 'strut_nut', name: 'Гайка рулевого колеса', host: sw, e2: d.clone().multiplyScalar(-0.1), desc: 'Гайка крепления рулевого колеса к валу колонки.' });
  }

  // ─────────────────────────── САЛОН ───────────────────────────
  function buildInterior() {
    const g = 'interior';
    const dash = add(mesh(smooth(deform(extrudeZ(shape([[0.93, 0.45], [0.93, 0.9], [0.75, 0.96], [0.56, 0.965], [0.47, 0.88], [0.5, 0.72], [0.62, 0.55], [0.7, 0.45]]), -0.79, 0.79, 0.015))), M.dash),
      { group: g, type: 'dash', name: 'Панель приборов (торпедо)' });
    add(mesh(merge([box(0.6, 0.94, 0.37, 0.1, 0.07, 0.32), ...[0.29, 0.45].map((z) => cyl(v3(0.548, 0.93, z), v3(0.552, 0.93, z), 0.045))]), M.trim),
      { group: g, type: 'cluster', name: 'Комбинация приборов', host: dash, e2: [-0.2, 0.25, 0] });
    add(mesh(box(0.6, 0.66, -0.4, 0.06, 0.15, 0.36), M.dash), { group: g, type: 'glovebox', name: 'Перчаточный ящик', host: dash, e2: [-0.3, 0, 0] });
    const con = add(mesh(merge([box(0.2, 0.39, 0, 0.8, 0.18, 0.24), box(0.62, 0.55, 0, 0.12, 0.2, 0.24)]), M.dash), { group: g, type: 'console', name: 'Центральная консоль' });
    add(mesh(merge([cyl(v3(0.42, 0.48, 0), v3(0.4, 0.6, 0), 0.008), sphere(v3(0.4, 0.62, 0), 0.025, 1, 1.3, 1)]), M.trim), { group: g, type: 'shifter', name: 'Селектор АКПП', host: con, e2: [0, 0.3, 0] });
    add(mesh(merge([cyl(v3(0.86, 0.75, 0.31), v3(0.73, 0.42, 0.31), 0.008), box(0.72, 0.41, 0.31, 0.02, 0.06, 0.07)]), M.darkSteel), { group: g, type: 'pedal_brake', name: 'Педаль тормоза' });
    add(mesh(merge([cyl(v3(0.86, 0.6, 0.47), v3(0.77, 0.36, 0.47), 0.006), box(0.76, 0.36, 0.47, 0.02, 0.1, 0.05)]), M.darkSteel), { group: g, type: 'pedal_gas', name: 'Педаль акселератора' });
    add(mesh(box(-0.1, 0.266, 0, 2.06, 0.012, 1.56), M.carpet), { group: g, type: 'carpet', name: 'Ковёр пола', e2: [0, -0.3, 0] });
    add(mesh(smooth(deform(strip([[0.14, 1.385], [-0.4, 1.415], [-1.2, 1.415], [-1.9, 1.39]], 0.01, -0.82, 0.82, 0.003))), M.fabricLight),
      { group: g, type: 'headliner', name: 'Обшивка потолка', e2: [0, 0.3, 0] });
    add(mesh(deform(box(-1.62, 0.98, 0, 0.85, 0.01, 1.42)), M.trim), { group: g, type: 'cargo_cover', name: 'Шторка багажника', e2: [-0.3, 0.2, 0] });

    // Передние сиденья
    for (const s of SIDES) {
      const z = s * 0.37;
      const nm = s > 0 ? 'водителя' : 'пассажира';
      const sp = s * 0.15;
      add(mesh(box(0.0, 0.42, z, 0.5, 0.12, 0.5).rotateZ(0), M.fabric), { group: g, type: 'seat_cushion', name: `Подушка сиденья ${nm}`, e2: [0, 0.1, sp] });
      const back = add(mesh(new THREE.BoxGeometry(0.1, 0.62, 0.48).rotateZ(0.22).translate(-0.3, 0.78, z), M.fabric),
        { group: g, type: 'seat_back', name: `Спинка сиденья ${nm}`, e2: [-0.25, 0.2, sp] });
      add(mesh(merge([
        new THREE.BoxGeometry(0.08, 0.17, 0.26).rotateZ(0.22).translate(-0.4, 1.17, z),
        cyl(v3(-0.37, 1.05, z - 0.07), v3(-0.38, 1.1, z - 0.07), 0.005), cyl(v3(-0.37, 1.05, z + 0.07), v3(-0.38, 1.1, z + 0.07), 0.005),
      ]), M.fabric), { group: g, type: 'headrest', name: `Подголовник ${nm}`, host: back, e2: [-0.05, 0.25, 0] });
      const rails = add(mesh(merge([box(0, 0.3, z - 0.18, 0.52, 0.035, 0.03), box(0, 0.3, z + 0.18, 0.52, 0.035, 0.03)]), M.darkSteel),
        { group: g, type: 'seat_rail', name: `Салазки сиденья ${nm}`, e2: [0, -0.12, sp] });
      for (const dx of [-0.24, 0.24]) for (const dz of [-0.18, 0.18]) {
        bolt(v3(dx, 0.32, z + dz), v3(0, 1, 0), { group: g, host: rails, type: 'seat_bolt', name: `Болт крепления сиденья ${nm}`, e2: [0, -0.12, 0] }, 0.007, 0.05);
      }
    }
    // Задний диван
    add(mesh(box(-0.82, 0.42, 0, 0.48, 0.12, 1.28), M.fabric), { group: g, type: 'rear_cushion', name: 'Подушка заднего сиденья' });
    const backs = [
      [-0.64, 0.12, 'Спинка заднего сиденья (60%)'],
      [0.125, 0.64, 'Спинка заднего сиденья (40%)'],
    ].map(([z0, z1, n]) => add(mesh(new THREE.BoxGeometry(0.1, 0.56, z1 - z0 - 0.005).rotateZ(0.2).translate(-1.1, 0.76, (z0 + z1) / 2), M.fabric),
      { group: g, type: 'rear_back', name: n, e2: [-0.3, 0.15, (z0 + z1) / 2 * 0.4] }));
    [[-0.45, 0], [-0.05, 0], [0.4, 1]].forEach(([z, bi], i) => {
      add(mesh(new THREE.BoxGeometry(0.07, 0.13, 0.22).rotateZ(0.2).translate(-1.18, 1.11, z), M.fabric),
        { group: g, type: 'headrest', name: `Подголовник задний №${i + 1}`, host: backs[bi], e2: [-0.05, 0.22, 0] });
    });
  }
}
