// Гладкая поверхность кузова. Кузов описан «стенкой», огибающей машину в плане
// (боковины + скруглённые углы + слегка выпуклые нос и корма), и «крышками»
// сверху (капот, лобовое стекло, крыша). Панели вырезаются из этих поверхностей
// по контурам и получают толщину — поэтому все стыки совпадают.
import * as THREE from 'three';
import Delaunator from 'delaunator';
import { D } from './geo.js';

const { FA, RA, AR, AY } = D;
const HALF_PI = Math.PI / 2;

// Монотонная кубическая интерполяция по таблице [[x, y], ...]
export function curve(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ── Профили (метры) ──
export const H = curve([[0.975, 0.905], [1.3, 0.86], [1.7, 0.8], [2.0, 0.748], [2.12, 0.722], [2.2, 0.695], [2.32, 0.66]]); // линия капота
export const A = curve([[0.16, 1.41], [0.55, 1.18], [0.975, 0.905]]);                                                      // линия стойки A
export const R = curve([[-2.1, 1.38], [-1.95, 1.415], [-1.6, 1.438], [-0.8, 1.452], [-0.2, 1.445], [0.16, 1.41]]);        // линия крыши
export function Ytop(x) { return x >= 0.975 ? H(x) : x >= 0.16 ? A(x) : R(x); }

const XN = curve([[0.19, 2.16], [0.23, 2.235], [0.3, 2.278], [0.42, 2.29], [0.52, 2.275], [0.58, 2.245], [0.64, 2.22], [0.7, 2.18], [0.75, 2.15]]);
const XT = curve([[0.19, -2.16], [0.23, -2.235], [0.3, -2.278], [0.5, -2.285], [0.57, -2.255], [0.62, -2.235], [0.8, -2.2], [1.0, -2.158], [1.2, -2.105], [1.37, -2.04], [1.43, -1.97]]);
export const Wy = curve([[0.19, 0.828], [0.25, 0.856], [0.4, 0.868], [0.75, 0.874], [0.88, 0.869], [0.96, 0.853], [1.1, 0.818], [1.28, 0.775], [1.46, 0.728]]);
const RF = curve([[0.19, 0.2], [0.55, 0.22], [0.8, 0.26]]);
const RR = () => 0.17;
const KF = 0.07, KR = 0.045;

// Лёгкое расширение крыльев вокруг колёсных арок
function flare(x, y) {
  if (y > 0.8) return 0;
  let f = 0;
  for (const ax of [FA, RA]) {
    const d = Math.hypot(x - ax, y - AY);
    f += 0.014 * Math.exp(-(((d - (AR + 0.05)) / 0.07) ** 2));
  }
  return f * Math.min(1, (0.8 - y) / 0.15);
}
export const Wfun = (x, y) => Wy(y) + flare(x, y);

function front(y) {
  const R_ = RF(y), F = Wy(y) - R_;
  return { R: R_, F, xc: XN(y) - R_ - KF * F * F };
}
function rear(y) {
  const R_ = RR(y), F = Wy(y) - R_;
  return { R: R_, F, xc: XT(y) + R_ + KR * F * F };
}

// Точка на стенке. a — длина дуги от оси симметрии спереди, b — сзади, x — боковая координата.
export function pFront(s, a, y) {
  const { R: R_, F, xc } = front(y);
  a = Math.max(0, a);
  let x, z;
  if (a <= F) { x = xc + R_ + KF * (F * F - a * a); z = a; }
  else if (a <= F + R_ * HALF_PI) { const t = (a - F) / R_; x = xc + R_ * Math.cos(t); z = F + R_ * Math.sin(t); }
  else { x = xc - (a - F - R_ * HALF_PI); z = Wfun(x, y); }
  return new THREE.Vector3(x, y, s * z);
}
export function pRear(s, b, y) {
  const { R: R_, F, xc } = rear(y);
  b = Math.max(0, b);
  let x, z;
  if (b <= F) { x = xc - R_ - KR * (F * F - b * b); z = b; }
  else if (b <= F + R_ * HALF_PI) { const t = (b - F) / R_; x = xc - R_ * Math.cos(t); z = F + R_ * Math.sin(t); }
  else { x = xc + (b - F - R_ * HALF_PI); z = Wfun(x, y); }
  return new THREE.Vector3(x, y, s * z);
}
export function pSide(s, x, y) {
  const f = front(y), r = rear(y);
  if (x > f.xc) return pFront(s, f.F + f.R * HALF_PI - (x - f.xc), y);
  if (x < r.xc) return pRear(s, r.F + r.R * HALF_PI - (r.xc - x), y);
  return new THREE.Vector3(x, y, s * Wfun(x, y));
}
// перевод боковой координаты в «переднюю»/«заднюю»
export const aOf = (x, y) => { const f = front(y); return f.F + f.R * HALF_PI + (f.xc - x); };
export const bOf = (x, y) => { const r = rear(y); return r.F + r.R * HALF_PI + (x - r.xc); };
export const sideOfB = (b, y) => { const r = rear(y); return r.xc - (r.F + r.R * HALF_PI - b); };
export const sideOfA = (a, y) => { const f = front(y); return f.xc + (f.F + f.R * HALF_PI - a); };
export const cornerEndA = (y) => { const f = front(y); return f.F + f.R * HALF_PI; };
export const xFrontCorner = (y) => front(y).xc;

// Высота верхней кромки стенки в данной точке (решается итерациями)
export function topAt(map, c) {
  let y = 0.9;
  for (let i = 0; i < 6; i++) y = Ytop(map(1, c, y).x);
  return y;
}

export const wallHint = (p) => new THREE.Vector3(p.x - THREE.MathUtils.clamp(p.x, -1.75, 1.55), 0, p.z);
export const upHint = () => new THREE.Vector3(0, 1, 0);

// ── Построение листовой детали ──
function resample(poly, step) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const res = [];
  for (const p of out) {
    const q = res[res.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4) res.push(p);
  }
  if (res.length > 2 && Math.hypot(res[0][0] - res.at(-1)[0], res[0][1] - res.at(-1)[1]) < 1e-4) res.pop();
  return res;
}
function inside(poly, u, v) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function segDist(u, v, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - a[0] - t * dx, v - a[1] - t * dy);
}

/**
 * Лист по контуру в параметрическом пространстве (u, v).
 * map(u, v) -> Vector3, hint(p) -> примерное направление «наружу».
 */
export function sheet({ outline, holes = [], map, hint = wallHint, thick = 0.012, offset = 0, h = 0.035 }) {
  const contour = resample(outline, h * 0.5);
  const hs = holes.map((p) => resample(p, h * 0.5));
  const loops = [contour, ...hs];
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const [u, v] of contour) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
  const steiner = [];
  let row = 0;
  for (let v = minV + h * 0.5; v < maxV; v += h * 0.866, row++) {
    for (let u = minU + (row % 2 ? h * 0.5 : 0) + h * 0.25; u < maxU; u += h) {
      if (!inside(contour, u, v) || hs.some((p) => inside(p, u, v))) continue;
      let dmin = Infinity;
      for (const L of loops) for (let i = 0; i < L.length && dmin >= h * 0.55; i++) dmin = Math.min(dmin, segDist(u, v, L[i], L[(i + 1) % L.length]));
      if (dmin >= h * 0.55) steiner.push([u, v]);
    }
  }
  // Триангуляция Делоне по всем точкам, затем отбрасываем треугольники вне контура
  const uv = [...contour, ...hs.flat(), ...steiner];
  const del = new Delaunator(uv.flat());
  const maxEdge = h * 2.2;
  let tris = [];
  for (let t = 0; t < del.triangles.length; t += 3) {
    const a = del.triangles[t], b = del.triangles[t + 1], c = del.triangles[t + 2];
    const A = uv[a], B = uv[b], C = uv[c];
    const cu = (A[0] + B[0] + C[0]) / 3, cv = (A[1] + B[1] + C[1]) / 3;
    if (!inside(contour, cu, cv) || hs.some((p) => inside(p, cu, cv))) continue;
    const le = Math.max(Math.hypot(A[0] - B[0], A[1] - B[1]), Math.hypot(B[0] - C[0], B[1] - C[1]), Math.hypot(C[0] - A[0], C[1] - A[1]));
    if (le > maxEdge) continue;
    tris.push([a, b, c]);
  }

  const e = 1e-3;
  const P = [], N = [];
  for (const [u, v] of uv) {
    const p = map(u, v);
    const du = map(u + e, v).sub(map(u - e, v));
    const dv = map(u, v + e).sub(map(u, v - e));
    const n = du.cross(dv).normalize();
    if (n.dot(hint(p)) < 0) n.negate();
    P.push(p.addScaledVector(n, offset));
    N.push(n);
  }
  // ориентация треугольников — наружу
  let best = 0, bi = 0;
  tris.forEach((t, i) => {
    const ar = new THREE.Vector3().subVectors(P[t[1]], P[t[0]]).cross(new THREE.Vector3().subVectors(P[t[2]], P[t[0]])).length();
    if (ar > best) { best = ar; bi = i; }
  });
  const t0 = tris[bi];
  const fn = new THREE.Vector3().subVectors(P[t0[1]], P[t0[0]]).cross(new THREE.Vector3().subVectors(P[t0[2]], P[t0[0]]));
  if (fn.dot(N[t0[0]]) < 0) tris = tris.map(([a, b, c]) => [a, c, b]);

  const pos = [], nor = [], idx = [];
  const n0 = P.length;
  P.forEach((p, i) => { pos.push(p.x, p.y, p.z); nor.push(N[i].x, N[i].y, N[i].z); });
  tris.forEach((t) => idx.push(...t));
  if (thick > 0) {
    P.forEach((p, i) => { const q = p.clone().addScaledVector(N[i], -thick); pos.push(q.x, q.y, q.z); nor.push(-N[i].x, -N[i].y, -N[i].z); });
    tris.forEach(([a, b, c]) => idx.push(a + n0, c + n0, b + n0));
    const cnt = new Map();
    const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    tris.forEach(([a, b, c]) => [[a, b], [b, c], [c, a]].forEach(([i, j]) => cnt.set(key(i, j), (cnt.get(key(i, j)) || 0) + 1)));
    let vi = pos.length / 3;
    tris.forEach(([a, b, c]) => [[a, b], [b, c], [c, a]].forEach(([i, j]) => {
      if (cnt.get(key(i, j)) !== 1) return;
      const pi = P[i], pj = P[j];
      const ii = pi.clone().addScaledVector(N[i], -thick), jj = pj.clone().addScaledVector(N[j], -thick);
      const sn = new THREE.Vector3().subVectors(pj, pi).cross(N[i]).normalize();
      for (const q of [pi, pj, jj, ii]) { pos.push(q.x, q.y, q.z); nor.push(sn.x, sn.y, sn.z); }
      idx.push(vi, vi + 3, vi + 1, vi + 1, vi + 3, vi + 2);
      vi += 4;
    }));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// ── Крышки сверху: капот, лобовое стекло, крыша ──
export const CROWN = 0.03;
function smooth01(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

// Контур крышки — правая половина по верхней кромке стенки, от x0 до оси симметрии
// (dir = +1 — к носу, -1 — к корме). Возвращает точки плана [x, z].
function capHalf(x0, dir, inset) {
  const pts = [];
  const f = front(0.7), r = rear(1.41);
  const xEnd = dir > 0 ? f.xc + f.F + f.R * HALF_PI : r.xc - (r.F + r.R * HALF_PI);
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const xs = x0 + ((xEnd - x0) * i) / n;
    let y = 0.9, p;
    for (let k = 0; k < 6; k++) {
      // xEnd зависит от высоты — пересчитываем конец для текущего y
      const ff = front(y), rr = rear(y);
      const e = dir > 0 ? ff.xc + ff.F + ff.R * HALF_PI : rr.xc - (rr.F + rr.R * HALF_PI);
      const xx = x0 + ((e - x0) * i) / n;
      p = pSide(1, xx, y);
      y = Ytop(p.x);
    }
    pts.push([p.x, Math.max(0, p.z - inset)]);
  }
  return pts;
}
function makeCap(half, yBase, endSmooth) {
  const sorted = [...half].sort((a, b) => a[0] - b[0]);
  const xs = sorted.map((p) => p[0]);
  const zw = (x) => {
    if (x <= xs[0]) return sorted[0][1];
    if (x >= xs.at(-1)) return sorted.at(-1)[1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / (xs[i + 1] - xs[i] || 1);
    return sorted[i][1] + (sorted[i + 1][1] - sorted[i][1]) * t;
  };
  const xMax = xs.at(-1), xMin = xs[0];
  return (x, z) => {
    const w = Math.max(0.05, zw(x));
    let lat = Math.max(0, 1 - (z / w) ** 2);
    if (endSmooth > 0) lat *= smooth01((xMax - x) / 0.35);
    if (endSmooth < 0) lat *= smooth01((x - xMin) / 0.35);
    return yBase(x) + CROWN * lat;
  };
}
const fullOutline = (half) => [...half.map(([x, z]) => [x, z]), ...[...half].reverse().map(([x, z]) => [x, -z])];

export const hoodHalf = capHalf(0.99, 1, 0.006);
export const hoodY = makeCap(hoodHalf, H, 1);
export const roofHalf = capHalf(0.165, -1, 0.006);
export const roofY = makeCap(roofHalf, R, -1);
export const wsZw = (x) => Wfun(x, A(x));
export const wsY = (x, z) => A(x) + CROWN * Math.max(0, 1 - (z / wsZw(x)) ** 2);

export function capSheet(outline, yfun, opt = {}) {
  return sheet({ outline, map: (x, z) => new THREE.Vector3(x, yfun(x, z), z), hint: upHint, ...opt });
}
export const hoodOutline = () => fullOutline(hoodHalf);
export const roofOutline = () => fullOutline(roofHalf);
