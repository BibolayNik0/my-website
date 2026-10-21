// Собирает каждую игру в самодостаточный index.html и zip-архив для консоли Яндекс Игр.
// Использование: node tools/build.mjs [slug ...]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

globalThis.window = globalThis;
await import(path.join(ROOT, 'catalog/sets.js'));
await import(path.join(ROOT, 'catalog/games.js'));
const SETS = globalThis.YG_SETS;
const GAMES = globalThis.YG_GAMES;

// ---- минимальный zip (deflate) без зависимостей ----
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
function zip(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name), comp = zlib.deflateRawSync(data, { level: 9 }), crc = crc32(data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt16LE(0, 10); h.writeUInt16LE(DOS_DATE, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22);
    h.writeUInt16LE(nameBuf.length, 26); h.writeUInt16LE(0, 28);
    parts.push(h, nameBuf, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(DOS_DATE, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24);
    c.writeUInt16LE(nameBuf.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, nameBuf);
    offset += h.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

const css = read('engine/ui.css');
const shared = ['engine/sdk.js', 'engine/core.js', 'engine/input.js'].map(read).join('\n');
const genreSrc = {};
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');

function page(g) {
  const genre = genreSrc[g.genre] ||= read(`engine/genres/${g.genre}.js`);
  const data = `window.YG_SETS=${JSON.stringify({ [g.set]: SETS[g.set] })};window.YG_GAME=${JSON.stringify(g)};`;
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>${g.title.ru}</title>
<script src="/sdk.js"></script>
<style>${css}</style>
</head>
<body>
<div id="loader">${g.sp.hero}</div>
<div id="app"></div>
<script>${esc(data)}
${esc(shared)}
${esc(genre)}
YG.boot(window.YG_GAME);</script>
</body>
</html>
`;
}

const only = process.argv.slice(2);
const targets = only.length ? GAMES.filter((g) => only.includes(g.slug)) : GAMES;
fs.mkdirSync(path.join(DIST, 'zips'), { recursive: true });
const manifest = [];
for (const g of targets) {
  const html = page(g);
  const dir = path.join(DIST, 'games', g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  const name = `${String(g.id).padStart(3, '0')}-${g.slug}.zip`;
  const z = zip([['index.html', Buffer.from(html)]]);
  fs.writeFileSync(path.join(DIST, 'zips', name), z);
  manifest.push({ id: g.id, slug: g.slug, genre: g.genre, title: g.title, zip: name, kb: Math.round(z.length / 1024) });
}
fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Собрано игр: ${manifest.length}. Средний размер zip: ${Math.round(manifest.reduce((a, m) => a + m.kb, 0) / manifest.length)} КБ → ${path.relative(ROOT, DIST)}/zips`);
