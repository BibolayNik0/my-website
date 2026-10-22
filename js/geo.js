// Геометрические помощники: всё строится в мировых координатах автомобиля.
// Оси: X — вперёд, Y — вверх, Z — вправо (машина праворульная, JDM).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);

// Основные размеры (метры), близкие к реальной Caldina T240
export const D = {
  W: 0.87,      // половина ширины кузова (1740 мм)
  FA: 1.33,     // передняя ось
  RA: -1.37,    // задняя ось (база 2700 мм)
  WR: 0.316,    // радиус колеса 205/55 R16
  TR: 0.75,     // половина колеи
  AR: 0.37,     // радиус колёсной арки
  AY: 0.31,     // высота центра арки
};

// Сужение кузова: завал боковин к крыше и скругление носа/кормы в плане
export function bodyScale(x, y) {
  let s = 1;
  if (y > 0.93) s *= 1 - 0.15 * Math.min(1, (y - 0.93) / 0.5);
  if (x > 1.7) s *= 1 - 0.13 * Math.pow((x - 1.7) / 0.58, 2);
  if (x < -1.85) s *= 1 - 0.07 * Math.pow((-1.85 - x) / 0.45, 2);
  if (y < 0.32) s *= 1 - 0.03 * Math.min(1, (0.32 - y) / 0.12);
  return s;
}

export function deform(g, fn = bodyScale) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, p.getZ(i) * fn(p.getX(i), p.getY(i)));
  }
  p.needsUpdate = true;
  return g;
}

// Сглаживание нормалей (для кузовных панелей с фасками)
export function smooth(g) {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  return g;
}

export function shape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

export function path(pts) {
  const s = new THREE.Path();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// Выдавливание профиля XY вдоль Z в диапазоне [z0, z1]
export function extrudeZ(shp, z0, z1, bevel = 0.006, curveSegments = 24) {
  const depth = Math.max(0.0005, z1 - z0 - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(shp, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments,
  });
  g.translate(0, 0, z0 + bevel);
  return g;
}

// Сплайн по точкам профиля -> плотная полилиния
function densify(pts, n = 28) {
  if (pts.length < 3) return pts;
  const c = new THREE.SplineCurve(pts.map(p => new THREE.Vector2(p[0], p[1])));
  return c.getPoints(n).map(p => [p.x, p.y]);
}

// Тонкая «полоса» вдоль линии профиля (капот, крыша, стекло, бампер).
// Внутренняя сторона — слева по ходу обхода точек.
export function stripShape(pts, t, dense = true) {
  const P = dense ? densify(pts) : pts;
  const inner = P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    return [p[0] - dy * t, p[1] + dx * t];
  });
  return shape([...P, ...inner.reverse()]);
}

export function strip(pts, t, z0, z1, bevel = 0.005) {
  return extrudeZ(stripShape(pts, t), z0, z1, bevel);
}

// Панель на боковине: side = +1 правая, -1 левая
export function sideZ(side, t, inset = 0) {
  const W = D.W - inset;
  return side > 0 ? [W - t, W] : [-W, -W + t];
}

export function box(cx, cy, cz, sx, sy, sz) {
  return new THREE.BoxGeometry(sx, sy, sz).translate(cx, cy, cz);
}

export function place(g, pos, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(pos, q, v3(1, 1, 1)));
  return g;
}

// Цилиндр между двумя точками
export function cyl(a, b, r1, r2 = r1, seg = 20, open = false) {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r2, r1, d.length(), seg, 1, open);
  return place(g, a.clone().add(b).multiplyScalar(0.5), d);
}

// Труба по сплайну
export function tube(points, r, seg = 48, radial = 12, closed = false) {
  const c = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.2);
  return new THREE.TubeGeometry(c, seg, r, radial, closed);
}

export function sphere(c, r, sx = 1, sy = 1, sz = 1) {
  return new THREE.SphereGeometry(r, 24, 16).scale(sx, sy, sz).translate(c.x, c.y, c.z);
}

export function merge(list) {
  return mergeGeometries(list.map(g => {
    g = g.index ? g.toNonIndexed() : g;
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    return g;
  }));
}

// Болт: головка (шестигранник) направлена по dir, стержень уходит внутрь детали
export function boltGeo(pos, dir, r = 0.006, len = 0.03) {
  const d = dir.clone().normalize();
  const head = cyl(pos.clone().addScaledVector(d, -r * 0.5), pos.clone().addScaledVector(d, r * 0.7), r * 1.7, r * 1.7, 6);
  const washer = cyl(pos.clone().addScaledVector(d, -r * 0.7), pos.clone().addScaledVector(d, -r * 0.5), r * 2.1, r * 2.1, 16);
  const shank = cyl(pos.clone().addScaledVector(d, -len), pos.clone().addScaledVector(d, -r * 0.6), r, r, 10);
  return merge([head, washer, shank]);
}

export function nutGeo(pos, dir, r = 0.008) {
  const d = dir.clone().normalize();
  return cyl(pos.clone().addScaledVector(d, -r * 0.6), pos.clone().addScaledVector(d, r * 0.6), r * 1.6, r * 1.6, 6);
}

// Винтовая пружина вдоль оси a->b
export function springGeo(a, b, R, wire, turns) {
  const L = a.distanceTo(b);
  class Helix extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const ang = t * turns * Math.PI * 2;
      return target.set(Math.cos(ang) * R, t * L - L / 2, Math.sin(ang) * R);
    }
  }
  const g = new THREE.TubeGeometry(new Helix(), Math.round(turns * 24), wire, 8, false);
  return place(g, a.clone().add(b).multiplyScalar(0.5), b.clone().sub(a));
}

// Ремень, огибающий набор шкивов (в плоскости XY при заданном z)
export function beltGeo(pulleys, z, width = 0.02) {
  const pts = [];
  for (const [x, y, r] of pulleys) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      pts.push([x + Math.cos(a) * (r + 0.004), y + Math.sin(a) * (r + 0.004)]);
    }
  }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const outer = shape(hull);
  const inner = hull.map(([x, y]) => {
    // смещение внутрь на толщину ремня относительно центроида
    const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
    const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
    const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy);
    return [x - (dx / l) * 0.006, y - (dy / l) * 0.006];
  });
  outer.holes.push(path(inner));
  return extrudeZ(outer, z - width / 2, z + width / 2, 0);
}
