// Реестр деталей: у каждой детали — свой «пивот», базовое положение
// и три вектора разлёта (по стадиям разборки).
import * as THREE from 'three';

const toV = (a) => (a == null ? null : a.isVector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export const STAGES = ['Кузов и навесное', 'Агрегаты и системы', 'Детали и крепёж'];

export class Registry {
  constructor(root) {
    this.root = root;
    this.parts = [];
    this.groups = new Map();
  }

  group(id, cfg) {
    this.groups.set(id, { id, parts: [], ...cfg });
  }

  // objs — меши/группы, уже расставленные в мировых координатах
  add(objs, o) {
    if (!Array.isArray(objs)) objs = [objs];
    const box = new THREE.Box3();
    for (const ob of objs) { ob.updateMatrixWorld(true); box.expandByObject(ob); }
    const c = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Group();
    pivot.position.copy(c);
    const part = {
      id: this.parts.length,
      name: o.name,
      group: o.group,
      type: o.type || o.name,
      desc: o.desc,
      pivot,
      base: c.clone(),
      size: box.getSize(new THREE.Vector3()),
      opt: o,
      host: o.host || null,
      hidden: false,
      meshes: [],
      E: [null, null, null],
    };
    for (const ob of objs) {
      ob.position.sub(c);
      pivot.add(ob);
      ob.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
          n.userData.part = part;
          n.userData.baseMat = n.material;
          part.meshes.push(n);
        }
      });
    }
    this.root.add(pivot);
    this.parts.push(part);
    this.groups.get(o.group).parts.push(part);
    return part;
  }

  finalize() {
    for (const g of this.groups.values()) {
      const own = g.parts.filter((p) => !p.host);
      const c = new THREE.Vector3();
      own.forEach((p) => c.add(p.base));
      if (own.length) c.divideScalar(own.length);
      g.center = c;
    }
    for (const p of this.parts) {
      const g = this.groups.get(p.group);
      const o = p.opt;
      p.E[0] = toV(o.e0);
      p.E[1] = toV(o.e1);
      p.E[2] = toV(o.e2);
      if (!p.host) {
        if (o.e1 === undefined && g.vec) {
          p.E[1] = toV(g.vec);
          if (g.mirrorZ) p.E[1].z *= Math.sign(p.base.z) || 1;
        }
        if (o.e2 === undefined && g.spread) {
          p.E[2] = p.base.clone().sub(g.center).multiplyScalar(g.spread);
        }
      }
    }
    // Сколько одинаковых деталей в машине
    const count = new Map();
    for (const p of this.parts) count.set(p.type, (count.get(p.type) || 0) + 1);
    for (const p of this.parts) p.sameCount = count.get(p.type);
  }

  // t — общая степень разборки 0..1
  update(t) {
    const k = [0, 1, 2].map((i) => ease(t * 3 - i));
    const memo = new Map();
    const disp = (p) => {
      if (memo.has(p)) return memo.get(p);
      const d = p.host ? disp(p.host).clone() : new THREE.Vector3();
      for (let i = 0; i < 3; i++) if (p.E[i]) d.addScaledVector(p.E[i], k[i]);
      memo.set(p, d);
      return d;
    };
    for (const p of this.parts) p.pivot.position.copy(p.base).add(disp(p));
  }
}
