// Кузов: панели вырезаются из гладкой поверхности (bodysurf.js).
import * as THREE from 'three';
import { D, v3, box, cyl, sphere, merge, nutGeo, smooth, deform } from './geo.js';
import * as S from './bodysurf.js';

const { W, FA, RA, AR, AY } = D;
const SIDES = [1, -1];
const G = 0.005;   // зазор между панелями
const T = 0.012;   // толщина листа
const ARCH = AR + 0.005;

const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const topS = (x) => S.topAt(S.pSide, x);
const topF = (a) => S.topAt(S.pFront, a);
const topR = (b) => S.topAt(S.pRear, b);
const signed = (fn) => (c, y) => fn(c < 0 ? -1 : 1, Math.abs(c), y);
const mirrorHalf = (half) => [...half, ...[...half].reverse().map(([c, y]) => [-c, y])];
const archPt = (cx, th) => [cx + ARCH * Math.cos(th), AY + ARCH * Math.sin(th)];

function pn(map, s, c, y) {
  const e = 1e-3;
  const p = map(s, c, y);
  const n = map(s, c + e, y).sub(map(s, c - e, y)).cross(map(s, c, y + e).sub(map(s, c, y - e))).normalize();
  if (n.dot(S.wallHint(p)) < 0) n.negate();
  return { p, n };
}

export function emblemGeo() {
  const ring = (r, sx, sy, oy = 0) => new THREE.TorusGeometry(r, 0.0035, 8, 40).scale(sx, sy, 0.6).translate(0, oy, 0);
  return merge([ring(0.05, 1, 0.68), ring(0.034, 1, 0.42, 0.008), ring(0.026, 0.42, 1, -0.004)]);
}

export function buildBody({ add, mesh, bolt, M, sn }) {
  const sideSheet = (s, outline, holes, opt = {}) => S.sheet({ outline, holes, map: (u, v) => S.pSide(s, u, v), thick: T, ...opt });
  const frontSheet = (s, outline, opt = {}) => S.sheet({ outline, map: (a, y) => S.pFront(s, a, y), thick: T, ...opt });
  const frontFull = (outline, opt = {}) => S.sheet({ outline, map: signed(S.pFront), thick: T, ...opt });
  const rearSheet = (s, outline, opt = {}) => S.sheet({ outline, map: (b, y) => S.pRear(s, b, y), thick: T, ...opt });
  const rearFull = (outline, holes = [], opt = {}) => S.sheet({ outline, holes, map: signed(S.pRear), thick: T, ...opt });
  const skin = (g, m = M.paint) => mesh(smooth(deform(g)), m);

  // ── Несущий каркас ──
  add(skin(box(-0.1, 0.24, 0, 2.1, 0.04, 1.62)), { group: 'body', type: 'floor', name: 'Пол кузова (салон)' });
  add(skin(merge([box(-1.66, 0.52, 0, 1.0, 0.03, 1.5), box(-1.155, 0.39, 0, 0.03, 0.27, 1.5)])),
    { group: 'body', type: 'trunkfloor', name: 'Пол багажника' });
  add(skin(box(0.94, 0.6, 0, 0.03, 0.62, 1.6)), { group: 'body', type: 'firewall', name: 'Моторный щит' });
  add(skin(merge([
    box(2.03, 0.69, 0, 0.05, 0.04, 1.1), box(2.03, 0.27, 0, 0.05, 0.04, 1.1),
    box(2.03, 0.48, 0.53, 0.05, 0.43, 0.05), box(2.03, 0.48, -0.53, 0.05, 0.43, 0.05),
  ])), { group: 'body', type: 'radsupport', name: 'Панель передка (рамка радиатора)' });
  add(skin(new THREE.BoxGeometry(0.04, 0.26, 1.5, 1, 4, 8).translate(-2.17, 0.42, 0)),
    { group: 'body', type: 'rearpanel', name: 'Задняя панель кузова' });
  for (const s of SIDES) {
    add(mesh(sideSheet(s, [[0.955, 0.19], [0.955, 0.24], [-0.99, 0.24], [-0.99, 0.19]], [], { thick: 0.03 }), M.paint),
      { group: 'body', type: 'sill', name: `Порог ${sn(s)}` });
    add(skin(box(1.55, 0.37, s * 0.58, 1.2, 0.1, 0.08)), { group: 'body', type: 'rail', name: `Лонжерон передний ${sn(s)}` });
    add(skin(box(FA - 0.03, 0.76, s * 0.555, 0.26, 0.12, 0.14)), { group: 'body', type: 'tower', name: `Чашка передней стойки ${sn(s, 'f')}` });
    add(skin(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 28, 1, true, Math.PI / 2, Math.PI)
      .rotateX(Math.PI / 2).translate(RA, AY, s * 0.6)), { group: 'body', type: 'pillar', name: `Арка заднего колеса внутренняя ${sn(s, 'f')}`, desc: 'Внутренняя арка заднего колеса — часть каркаса, образует нишу колеса в багажнике.' });
    // Стойка A — полоса между лобовым стеклом и дверью
    const aOut = range(0.975, 0.165, 30).map((x) => [x, s * (S.wsZw(x) - 0.004)]);
    const aIn = range(0.165, 0.975, 30).map((x) => [x, s * (S.wsZw(x) - 0.07)]);
    add(mesh(S.capSheet([...aOut, ...aIn], S.wsY, { thick: T, h: 0.02 }), M.paint),
      { group: 'body', type: 'pillar', name: `Стойка A ${sn(s, 'f')}` });
    for (const [x0, x1, n] of [[-0.237, -0.193, 'B'], [-1.0, -0.968, 'C']]) {
      add(mesh(sideSheet(s, [[x0, 0.995], [x1, 0.995], [x1, topS(x1) - 0.012], [x0, topS(x0) - 0.012]], [], { offset: 0.003, thick: 0.006, h: 0.015 }), M.black),
        { group: 'body', type: 'pillar', name: `Накладка стойки ${n} ${sn(s, 'f')}`, desc: 'Чёрная декоративная накладка стойки кузова.' });
    }
  }

  // ── Капот ──
  const hood = add(mesh(S.capSheet(S.hoodOutline(), S.hoodY, { thick: 0.015, h: 0.05 }), M.paint),
    { group: 'body', type: 'hood', name: 'Капот', e0: [0.9, 2.3, 0] });
  for (const s of SIDES) {
    const h = add(mesh(box(1.0, 0.875, s * 0.6, 0.06, 0.04, 0.03), M.darkSteel),
      { group: 'body', type: 'hinge', name: `Петля капота ${sn(s, 'f')}`, host: hood, e2: [-0.18, -0.08, 0] });
    for (const dz of [-0.008, 0.008]) bolt(v3(1.015, 0.897, s * 0.6 + dz), v3(0, 1, 0), { group: 'body', host: h, name: 'Болт петли капота' }, 0.005, 0.02);
  }
  const cz = S.wsZw(0.97) - 0.075;
  add(mesh(S.capSheet([[0.955, -cz], [0.997, -cz], [0.997, cz], [0.955, cz]], (x, z) => S.wsY(Math.min(x, 0.975), z) + 0.006, { thick: 0.01, h: 0.03 }), M.black),
    { group: 'ext', type: 'cowl', name: 'Жабо (решётка под лобовым стеклом)', e0: [0.4, 1.2, 0] });

  // ── Крылья ──
  const fFront = (y) => S.xFrontCorner(y) - 0.105;
  let xE = 1.8;
  for (let i = 0; i < 8; i++) xE = fFront(S.Ytop(xE) - G);
  const yE = S.Ytop(xE) - G;
  const th0 = Math.asin((0.578 - AY) / ARCH);
  for (const s of SIDES) {
    const outline = [
      [0.962, 0.31],
      ...range(0.962, xE, 30).map((x) => [x, topS(x) - G]),
      ...range(yE, 0.578, 10).map((y) => [fFront(y), y]),
      archPt(FA, th0),
      ...range(th0, Math.PI, 30).map((t) => archPt(FA, t)),
    ];
    const f = add(mesh(sideSheet(s, outline), M.paint), { group: 'body', type: 'fender', name: `Крыло переднее ${sn(s, 'n')}`, e0: [0.6, 1.0, s * 2.25] });
    for (const x of [1.1, 1.5, 1.85]) {
      const y = S.Ytop(x);
      bolt(v3(x, y - 0.002, s * (S.Wfun(x, y) - 0.015)), v3(0, 1, 0), { group: 'body', host: f, name: 'Болт крепления крыла' }, 0.005, 0.025);
    }
    const r = pn(S.pSide, s, 1.8, 0.64);
    add(mesh(sphere(r.p.clone().addScaledVector(r.n, 0.003), 0.03, 1, 0.42, 0.22), M.amber),
      { group: 'light', type: 'repeater', name: `Повторитель поворота ${sn(s)}`, host: f, e2: [0, 0, s * 0.15] });
    for (const ax of [{ x: FA, m: 'передний' }, { x: RA, m: 'задний' }]) {
      add(mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.24, 28, 1, true, Math.PI / 2, Math.PI)
        .rotateX(Math.PI / 2).translate(ax.x, AY, s * 0.74), M.black),
        { group: 'ext', type: 'liner', name: `Подкрылок ${ax.m} ${sn(s)}`, e0: [0, 0.55, s * 0.95] });
    }
  }

  // ── Двери ──
  const solveBelt = (lo, hi) => { for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (S.Ytop(m) - 0.05 > 0.99) lo = m; else hi = m; } return (lo + hi) / 2; };
  const xBelt = solveBelt(0.16, 0.975);
  const doors = [
    {
      key: 'front', gen: 'передней', name: 'Дверь передняя', type: 'door_front', e0: [0, 0.9, 2.3], x0: 0.955, x1: -0.205,
      hole: [[xBelt, 0.99], ...range(xBelt, -0.16, 30).map((x) => [x, S.Ytop(x) - 0.05]), [-0.16, 0.99]],
      handle: -0.08, hingeX: 0.955, lockX: -0.19,
    },
    {
      key: 'rear', gen: 'задней', name: 'Дверь задняя', type: 'door_rear', e0: [-0.15, 0.9, 2.3], x0: -0.225, x1: -0.985,
      hole: [[-0.27, 0.99], ...range(-0.27, -0.93, 12).map((x) => [x, S.Ytop(x) - 0.05]), [-0.93, 0.99]],
      handle: -0.86, hingeX: -0.235, lockX: -0.97,
    },
  ];
  for (const s of SIDES) {
    for (const d of doors) {
      const outline = [[d.x0, 0.245], ...range(d.x0, d.x1, 36).map((x) => [x, topS(x) - G]), [d.x1, 0.245]];
      const door = add(mesh(sideSheet(s, outline, [d.hole]), M.paint),
        { group: 'body', type: d.type, name: `${d.name} ${sn(s, 'f')}`, e0: [d.e0[0], d.e0[1], s * d.e0[2]] });
      const gs = s > 0 ? 'правой' : 'левой';
      add(mesh(sideSheet(s, d.hole, [], { offset: -0.012, thick: 0.004, h: 0.05 }), M.glass),
        { group: 'glass', type: 'door_glass', name: `Стекло двери ${d.gen} ${gs}`, host: door, e1: [0, 0.5, 0] });
      const xm = (d.x0 + d.x1) / 2, xa = d.x0 - 0.25 * (d.x0 - d.x1), xb = d.x0 - 0.7 * (d.x0 - d.x1);
      add(mesh(merge([
        box(xa, 0.66, s * (W - 0.06), 0.02, 0.6, 0.01), box(xb, 0.66, s * (W - 0.06), 0.02, 0.6, 0.01),
        cyl(v3(xm, 0.45, s * (W - 0.065)), v3(xm, 0.45, s * (W - 0.045)), 0.045),
      ]), M.darkSteel), { group: 'ext', type: 'regulator', name: `Стеклоподъёмник ${d.key === 'front' ? 'передний' : 'задний'} ${sn(s)}`, host: door, e1: [0, 0, -s * 0.28] });
      add(mesh(box(d.lockX, 0.82, s * (W - 0.055), 0.03, 0.08, 0.04), M.darkSteel),
        { group: 'ext', type: 'lock', name: `Замок двери ${d.gen} ${gs}`, host: door, e1: [-0.15, 0, -s * 0.12] });
      add(mesh(sideSheet(s, [[d.handle - 0.07, 0.85], [d.handle + 0.07, 0.85], [d.handle + 0.07, 0.885], [d.handle - 0.07, 0.885]], [], { offset: 0.007, thick: 0.012, h: 0.01 }), M.paint),
        { group: 'ext', type: 'door_handle', name: `Ручка двери ${d.gen} ${gs}`, host: door, e2: [0, 0, s * 0.14] });
      const trim = [[d.x0 - 0.02, 0.3], [d.x0 - 0.02, 0.97], [d.x1 + 0.02, 0.97], [d.x1 + 0.02, 0.3]];
      add(mesh(sideSheet(s, trim, [], { offset: -0.06, thick: 0.02, h: 0.06 }), M.fabric),
        { group: 'interior', type: 'door_trim', name: `Обшивка двери ${d.gen} ${gs}`, host: door, e1: [0, 0, -s * 0.45] });
      for (const hy of [0.45, 0.8]) {
        const h = add(mesh(box(d.hingeX, hy, s * (W - 0.055), 0.05, 0.08, 0.04), M.darkSteel),
          { group: 'body', type: 'hinge', name: `Петля двери ${d.gen} ${gs} ${hy < 0.6 ? 'нижняя' : 'верхняя'}`, host: door, e2: [0.16, 0, 0] });
        for (const dy of [-0.022, 0.022]) bolt(v3(d.hingeX + 0.03, hy + dy, s * (W - 0.055)), v3(1, 0, 0), { group: 'body', host: h, name: 'Болт петли двери' }, 0.005, 0.02);
      }
      if (d.key === 'front') {
        const b = S.pSide(s, 0.8, 1.0);
        const c = v3(0.79, 1.045, b.z + s * 0.115);
        const mir = add(mesh(merge([
          sphere(c, 0.1, 0.55, 0.55, 1),
          sphere(v3(0.81, 1.01, b.z + s * 0.035), 0.05, 0.8, 0.5, 1),
        ]), M.paint), { group: 'ext', type: 'mirror', name: `Зеркало наружное ${sn(s, 'n')}`, host: door, e1: [0, 0.05, s * 0.32] });
        add(mesh(sphere(v3(c.x - 0.054, c.y, c.z), 0.085, 0.04, 0.5, 0.92), M.chrome),
          { group: 'ext', type: 'mirror_glass', name: `Зеркальный элемент ${sn(s)}`, host: mir, e2: [-0.14, 0, 0] });
      }
    }
  }

  // ── Задние боковины ──
  const xsTg = (y) => S.sideOfB(0.605, y);
  let xq = -2.0;
  for (let i = 0; i < 8; i++) xq = xsTg(topS(xq) - G);
  const yq = topS(xq) - G;
  const th1 = Math.PI - Math.asin((0.578 - AY) / ARCH);
  const qHole = [[-1.04, 0.995], ...range(-1.04, -1.8, 20).map((x) => [x, S.Ytop(x) - 0.05]), [-1.9, 0.995]];
  for (const s of SIDES) {
    const outline = [
      [-0.995, 0.31],
      ...range(-0.995, xq, 40).map((x) => [x, topS(x) - G]),
      ...range(yq, 0.578, 16).map((y) => [xsTg(y), y]),
      archPt(RA, th1),
      ...range(th1, 0, 30).map((t) => archPt(RA, t)),
    ];
    const q = add(mesh(sideSheet(s, outline, [qHole]), M.paint), { group: 'body', type: 'quarter', name: `Боковина задняя ${sn(s, 'f')}`, e0: [-0.5, 0.95, s * 2.25] });
    add(mesh(sideSheet(s, qHole, [], { offset: -0.01, thick: 0.004, h: 0.05 }), M.glass),
      { group: 'glass', type: 'quarter_glass', name: `Стекло боковое багажника ${sn(s, 'n')}`, host: q, e1: [0, 0, s * 0.28] });
    if (s < 0) {
      add(mesh(sideSheet(s, [[-1.82, 0.8], [-1.68, 0.8], [-1.68, 0.91], [-1.82, 0.91]], [], { offset: 0.003, thick: 0.006, h: 0.02 }), M.paint),
        { group: 'ext', type: 'fuel_door', name: 'Лючок бензобака', host: q, e2: [0, 0, -0.14] });
    }
  }

  // ── Крыша и лобовое стекло ──
  add(mesh(S.capSheet(S.roofOutline(), S.roofY, { thick: 0.015, h: 0.06 }), M.paint),
    { group: 'body', type: 'roof', name: 'Панель крыши', e0: [-0.3, 2.45, 0] });
  const wsR = range(0.968, 0.172, 30).map((x) => [x, S.wsZw(x) - 0.072]);
  add(mesh(S.capSheet([...wsR, ...[...wsR].reverse().map(([x, z]) => [x, -z])], S.wsY, { offset: -0.002, thick: 0.005, h: 0.06 }), M.glass),
    { group: 'glass', type: 'windshield', name: 'Лобовое стекло', e0: [1.0, 1.75, 0] });

  // ── Дверь багажника ──
  const bTg = 0.595;
  let yTg = 1.4;
  for (let i = 0; i < 6; i++) yTg = topR(bTg) - G;
  const tgHole = [[-0.5, 1.0], [0.5, 1.0], [0.47, 1.355], [-0.47, 1.355]];
  const tg = add([
    mesh(rearFull(mirrorHalf([[0, 0.578], [bTg, 0.578], ...range(0.578, yTg, 12).map((y) => [bTg, y]), ...range(bTg, 0, 24).map((b) => [b, topR(b) - G])]), [tgHole]), M.paint),
    mesh(S.capSheet([[-1.86, -0.6], [-1.86, 0.6], [-1.93, 0.64], [-2.07, 0.6], [-2.08, 0], [-2.07, -0.6], [-1.93, -0.64]],
      (x, z) => S.roofY(-1.86, z * 0.9) + 0.026 - 0.15 * Math.max(0, -1.9 - x), { thick: 0.016, h: 0.03 }), M.paint),
  ], { group: 'body', type: 'tailgate', name: 'Дверь багажника со спойлером', e0: [-1.55, 0.5, 0] });
  add(mesh(rearFull(tgHole, [], { offset: -0.006, thick: 0.004, h: 0.06 }), M.glass),
    { group: 'glass', type: 'rear_glass', name: 'Стекло двери багажника', host: tg, e1: [-0.32, 0.1, 0] });
  add(mesh(box(-2.05, 1.43, 0, 0.03, 0.018, 0.3), M.redLens),
    { group: 'light', type: 'stoplamp', name: 'Дополнительный стоп-сигнал', host: tg, e2: [-0.12, 0.1, 0] });
  add(mesh(rearFull([[-0.3, 0.775], [0.3, 0.775], [0.3, 0.81], [-0.3, 0.81]], [], { offset: 0.004, thick: 0.006, h: 0.02 }), M.chrome),
    { group: 'ext', type: 'door_handle', name: 'Накладка с ручкой двери багажника', host: tg, e2: [-0.14, 0, 0] });
  const pl = S.pRear(1, 0, 0.75);
  add(mesh(box(pl.x - 0.005, 0.75, 0, 0.012, 0.012, 0.12), M.lens),
    { group: 'light', type: 'plate_lamp', name: 'Фонарь подсветки номера', host: tg, e2: [-0.12, -0.05, 0] });
  const re = S.pRear(1, 0, 0.9);
  add(mesh(emblemGeo().rotateY(-Math.PI / 2).translate(re.x - 0.006, 0.9, 0), M.chrome),
    { group: 'ext', type: 'emblem', name: 'Эмблема Toyota задняя', host: tg, e2: [-0.16, 0, 0] });
  const rw = S.pRear(1, 0, 1.03);
  const rwa = add(mesh(merge([box(rw.x - 0.012, 1.05, 0.15, 0.015, 0.02, 0.32), cyl(v3(rw.x, 1.03, 0), v3(rw.x - 0.03, 1.03, 0), 0.018)]), M.black),
    { group: 'ext', type: 'wiper_arm', name: 'Рычаг заднего стеклоочистителя', host: tg, e2: [-0.18, 0, 0] });
  add(mesh(box(rw.x - 0.005, 1.07, 0.17, 0.01, 0.012, 0.36), M.rubber),
    { group: 'ext', type: 'wiper_blade', name: 'Щётка заднего стеклоочистителя', host: rwa, e2: [-0.08, 0.08, 0] });
  for (const s of SIDES) {
    const h = add(mesh(box(-1.915, 1.4, s * 0.5, 0.06, 0.03, 0.04), M.darkSteel),
      { group: 'body', type: 'hinge', name: `Петля двери багажника ${sn(s, 'f')}`, host: tg, e2: [0.16, 0.1, 0] });
    bolt(v3(-1.9, 1.42, s * 0.5), v3(0, 1, 0), { group: 'body', host: h, name: 'Болт петли двери багажника' }, 0.005, 0.02);
  }

  // ── Передний бампер, решётки ──
  const thB = -Math.asin((AY - 0.2) / ARCH);
  const thT = Math.asin((0.572 - AY) / ARCH);
  const [xb0] = archPt(FA, thB);
  const fbHalf = [[0, 0.2], [S.aOf(xb0, 0.2), 0.2], ...range(thB, thT, 24).map((t) => { const [x, y] = archPt(FA, t); return [S.aOf(x, y), y]; }), [0, 0.572]];
  const fb = add(mesh(frontFull(mirrorHalf(fbHalf), { h: 0.04 }), M.paint), { group: 'body', type: 'bumper_f', name: 'Бампер передний', e0: [1.55, 0, 0] });
  add(mesh(frontFull(mirrorHalf([[0, 0.255], [0.4, 0.265], [0.38, 0.41], [0, 0.41]]), { offset: 0.003, thick: 0.006, h: 0.03 }), M.black),
    { group: 'body', type: 'grille_lower', name: 'Решётка бампера нижняя', host: fb, e2: [0.14, 0, 0] });
  for (const s of SIDES) {
    const f = pn(S.pFront, s, 0.58, 0.33);
    add(mesh(cyl(f.p.clone().addScaledVector(f.n, -0.012), f.p.clone().addScaledVector(f.n, 0.004), 0.04, 0.04, 28), M.lens),
      { group: 'light', type: 'fog', name: `Противотуманная фара ${sn(s, 'f')}`, host: fb, e2: [0.16, 0, s * 0.1] });
    const tb = S.pFront(s, 0.5, 0.572);
    bolt(v3(tb.x - 0.03, 0.578, tb.z), v3(0, 1, 0), { group: 'body', host: fb, name: 'Болт крепления бампера' }, 0.005, 0.02);
    const sb = pn(S.pSide, s, 1.8, 0.45);
    bolt(sb.p.clone().addScaledVector(sb.n, 0.003), sb.n, { group: 'body', host: fb, name: 'Саморез бампера к крылу' }, 0.004, 0.02);
  }
  const grHalf = [[0, 0.587], [0.33, 0.587], ...range(0.33, 0, 12).map((a) => [a, topF(a) - G])];
  add(mesh(frontFull(mirrorHalf(grHalf), { offset: -0.012, thick: 0.01, h: 0.02 }), M.black),
    { group: 'body', type: 'grille', name: 'Решётка радиатора', e0: [1.35, 0.32, 0] });
  add(mesh(frontFull(mirrorHalf([[0, 0.653], [0.32, 0.653], [0.32, 0.667], [0, 0.667]]), { offset: -0.004, thick: 0.008, h: 0.01 }), M.chrome),
    { group: 'body', type: 'grille', name: 'Хромированный молдинг решётки', e0: [1.45, 0.36, 0] });
  const fe = S.pFront(1, 0, 0.628);
  add(mesh(emblemGeo().rotateY(Math.PI / 2).translate(fe.x + 0.002, 0.628, 0), M.chrome),
    { group: 'ext', type: 'emblem', name: 'Эмблема Toyota передняя', e0: [1.6, 0.42, 0] });

  // ── Задний бампер ──
  const thRB = Math.PI + Math.asin((AY - 0.2) / ARCH);
  const thRT = Math.PI - Math.asin((0.572 - AY) / ARCH);
  const [xr0] = archPt(RA, thRB);
  const rbHalf = [[0, 0.2], [S.bOf(xr0, 0.2), 0.2], ...range(thRB, thRT, 24).map((t) => { const [x, y] = archPt(RA, t); return [S.bOf(x, y), y]; }), [0, 0.572]];
  const rb = add(mesh(rearFull(mirrorHalf(rbHalf), [], { h: 0.04 }), M.paint), { group: 'body', type: 'bumper_r', name: 'Бампер задний', e0: [-1.55, -0.05, 0] });
  for (const s of SIDES) {
    const tb = S.pRear(s, 0.5, 0.572);
    bolt(v3(tb.x + 0.03, 0.578, tb.z), v3(0, 1, 0), { group: 'body', host: rb, name: 'Болт крепления бампера' }, 0.005, 0.02);
  }

  // ── Фары и фонари ──
  const aIn = 0.345;
  const aOutF = (y) => S.cornerEndA(y) + 0.1;
  let yHT = 0.75;
  for (let i = 0; i < 8; i++) yHT = topF(aOutF(yHT)) - G;
  for (const s of SIDES) {
    const outline = [
      [aIn, 0.587], ...range(0, 1, 8).map((t) => [aIn + (aOutF(0.6) - aIn) * t, 0.587 + 0.018 * t * t]).slice(1),
      ...range(0.605, yHT, 8).map((y) => [aOutF(y), y]),
      ...range(aOutF(yHT), aIn, 24).map((a) => [a, topF(a) - G]),
    ];
    const hl = add([
      mesh(frontSheet(s, outline, { offset: 0.002, thick: 0.004, h: 0.03 }), M.lens),
      mesh(frontSheet(s, outline, { offset: -0.035, thick: 0.004, h: 0.03 }), M.chrome),
      ...[0.47, 0.66].map((a) => {
        const q = pn(S.pFront, s, a, 0.64);
        return mesh(cyl(q.p.clone().addScaledVector(q.n, -0.034), q.p.clone().addScaledVector(q.n, -0.012), 0.032, 0.036, 28), M.black);
      }),
    ], { group: 'light', type: 'headlight', name: `Фара ${sn(s, 'f')}`, e0: [1.3, 0.45, s * 0.42] });
    for (const [a, n] of [[0.47, 'ближнего'], [0.66, 'дальнего']]) {
      const q = pn(S.pFront, s, a, 0.64);
      const c = q.p.clone().addScaledVector(q.n, -0.06);
      add(mesh(merge([sphere(c, 0.012, 1.4, 1, 1), cyl(c.clone().addScaledVector(q.n, -0.05), c.clone().addScaledVector(q.n, -0.01), 0.014)]), M.white),
        { group: 'light', type: 'bulb', name: `Лампа ${n} света ${sn(s, 'f')}`, host: hl, e2: [-0.25, 0, 0] });
    }
    const hb = S.pFront(s, 0.6, 0.7);
    bolt(v3(hb.x - 0.07, 0.69, hb.z), v3(0, 1, 0), { group: 'light', host: hl, name: 'Болт крепления фары' }, 0.005, 0.02);

    const tlOutline = [[0.612, 0.645], [0.89, 0.67], [0.89, 1.0], [0.612, 1.03]];
    const tl = add(mesh(rearSheet(s, tlOutline, { offset: 0.004, thick: 0.012, h: 0.025 }), M.redLens),
      { group: 'light', type: 'taillight', name: `Фонарь задний ${sn(s)}`, e0: [-1.3, 0.45, s * 0.45] });
    const tq = pn(S.pRear, s, 0.72, 0.85);
    add(mesh(sphere(tq.p.clone().addScaledVector(tq.n, -0.03), 0.014), M.white),
      { group: 'light', type: 'bulb', name: `Лампа стоп-сигнала ${s > 0 ? 'правая' : 'левая'}`, host: tl, e2: [0.18, 0, 0], desc: 'Лампа стоп-сигнала и габарита (21/5 Вт).' });
  }

  // ── Стеклоочистители ──
  for (const [z, len, n] of [[0.42, 0.55, 'водителя'], [-0.2, 0.45, 'пассажира']]) {
    const zm = z - len / 2;
    const y0 = S.wsY(0.975, z), y1 = S.wsY(0.95, zm);
    const arm = add(mesh(merge([
      cyl(v3(0.985, y0 - 0.02, z), v3(0.985, y0 + 0.015, z), 0.014),
      box(0.955, y1 + 0.018, zm, 0.02, 0.012, len),
    ]), M.black), { group: 'ext', type: 'wiper_arm', name: `Рычаг стеклоочистителя (${n})`, e0: [0.6, 1.55, 0] });
    add(mesh(box(0.935, y1 + 0.03, zm - 0.02, 0.014, 0.014, len + 0.05), M.rubber),
      { group: 'ext', type: 'wiper_blade', name: `Щётка стеклоочистителя (${n})`, host: arm, e2: [-0.05, 0.15, 0] });
    add(mesh(nutGeo(v3(0.985, y0 + 0.02, z), v3(0, 1, 0), 0.008), M.steel),
      { group: 'ext', type: 'bolt_body', name: 'Гайка рычага стеклоочистителя', host: arm, e2: [0, 0.12, 0] });
  }
  add(mesh(merge([cyl(v3(1.0, 0.82, 0.3), v3(1.0, 0.82, 0.18), 0.04), box(0.98, 0.86, 0.1, 0.03, 0.02, 0.6)]), M.darkSteel),
    { group: 'ext', type: 'wiper_motor', name: 'Моторедуктор стеклоочистителя', e0: [0.45, 1.25, 0] });

}
