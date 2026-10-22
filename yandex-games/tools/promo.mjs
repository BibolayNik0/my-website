// Промо-материалы для консоли Яндекс Игр: иконка 512×512, обложки 800×470 (ru/en),
// скриншоты настоящей игры (портрет 720×1280 и ландшафт 1280×720), тексты карточки.
// Использование: node tools/promo.mjs [slug ...]   (сначала npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist/promo');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

globalThis.window = globalThis;
await import(path.join(ROOT, 'catalog/sets.js'));
await import(path.join(ROOT, 'catalog/games.js'));
const SETS = globalThis.YG_SETS;
const GAMES = globalThis.YG_GAMES;

const GENRE = {
  clicker: ['Кликер', 'Clicker'], merge: ['Мерж', 'Merge'], match3: ['Три в ряд', 'Match 3'], runner: ['Раннер', 'Runner'],
  stack: ['Башня', 'Stack'], snake: ['Змейка', 'Snake'], g2048: ['2048', '2048'], sort: ['Сортировка', 'Sort puzzle'],
  flappy: ['Флаппи', 'Flappy'], breakout: ['Арканоид', 'Breakout'], defense: ['Оборона', 'Defense'], memory: ['Мемори', 'Memory']
};
// Категории каталога Яндекс Игр, ближайшие к жанру.
const CATEGORY = {
  clicker: 'Кликеры / Симуляторы', merge: 'Головоломки / Казуальные', match3: 'Три в ряд', runner: 'Аркады / Раннеры',
  stack: 'Аркады / Казуальные', snake: 'Аркады', g2048: 'Головоломки / 2048', sort: 'Головоломки',
  flappy: 'Аркады', breakout: 'Аркады', defense: 'Стратегии / Аркады', memory: 'Головоломки / Детские'
};
const HOWTO = {
  clicker: ['Тапай по герою, чтобы зарабатывать монеты. Покупай постройки — они приносят доход даже без тебя. Лови золотой бонус!', 'Tap the hero to earn coins. Buy buildings that earn while you are away. Catch the golden bonus!'],
  merge: ['Перетаскивай одинаковые предметы друг на друга, чтобы получить новый. Не дай полю заполниться!', 'Drag identical items onto each other to create a new one. Do not let the board fill up!'],
  match3: ['Меняй соседние фишки местами и собирай 3 и больше в ряд. Каскады дают множитель очков.', 'Swap neighbouring tiles to line up 3 or more. Cascades multiply your score.'],
  runner: ['Свайпай влево-вправо или тапай по сторонам экрана, чтобы менять полосу. Собирай монеты и уворачивайся!', 'Swipe or tap screen sides to switch lanes. Grab coins and dodge obstacles!'],
  stack: ['Тапни, чтобы поставить блок. Ставь точно — лишнее обрезается, а идеальная установка расширяет башню.', 'Tap to drop the block. Be precise — overhangs are cut, perfect drops widen the tower.'],
  snake: ['Управляй свайпами или стрелками. Ешь, расти и не врезайся в стены и в себя.', 'Steer with swipes or arrow keys. Eat, grow and avoid walls and your own tail.'],
  g2048: ['Свайпай, чтобы сдвигать плитки. Одинаковые сливаются в следующую стадию эволюции.', 'Swipe to slide the tiles. Identical tiles merge into the next evolution stage.'],
  sort: ['Нажми на колбу, затем на другую, чтобы переложить верхние предметы. В каждой колбе должен остаться один вид.', 'Tap a tube, then another, to move the top items. Each tube must end up with one kind.'],
  flappy: ['Тапай или жми пробел, чтобы взлетать. Пролетай между препятствиями и собирай бонусы.', 'Tap or press space to fly up. Pass between obstacles and collect bonuses.'],
  breakout: ['Двигай платформу пальцем или мышью, отбивай шар и разбивай все блоки.', 'Move the paddle with finger or mouse, bounce the ball and break every block.'],
  defense: ['Тапай по врагам, пока автопушка помогает. Не пропусти их к базе! Каждая 5-я волна — босс.', 'Tap enemies while the auto turret helps. Keep them away from the base! Every 5th wave has a boss.'],
  memory: ['Открывай карточки парами и запоминай расположение. Успей найти все пары до конца таймера.', 'Flip cards in pairs and remember where they are. Find all pairs before the timer ends.']
};
const META = [
  'Собирай коллекцию из 16 предметов, открывай сундуки, получай ежедневные награды и проходи боевой пропуск!',
  'Collect 16 items, open chests, claim daily rewards and level up the season pass!'
];

const items = (g) => SETS[g.set].items.map((s) => s.split('|')[0]);
const font = `system-ui,"Noto Sans","Segoe UI",sans-serif`;
const emojiFont = `"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
const baseCss = `*{margin:0;box-sizing:border-box}body{width:100vw;height:100vh;overflow:hidden;font-family:${font};color:#fff}.e{font-family:${emojiFont};line-height:1}`;

function iconHtml(g) {
  const [b1, b2, acc] = g.pal;
  return `<style>${baseCss}
    body{background:radial-gradient(circle at 50% 42%,${acc}66 0,transparent 55%),linear-gradient(160deg,${b1},${b2});display:grid;place-items:center}
    .rays{position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.07) 0 10deg,transparent 10deg 20deg)}
    .hero{font-size:330px;filter:drop-shadow(0 18px 18px rgba(0,0,0,.45));position:relative}
    .s{position:absolute;font-size:70px;filter:drop-shadow(0 6px 6px rgba(0,0,0,.4))}</style>
    <div class="rays"></div><div class="e hero">${g.sp.hero}</div>
    <div class="e s" style="right:26px;top:26px">${items(g)[15]}</div>`;
}

function coverHtml(g, lang) {
  const [b1, b2, acc] = g.pal;
  const it = items(g);
  const title = g.title[lang];
  const size = title.length > 26 ? 44 : title.length > 18 ? 52 : 60;
  const float = [[470, 330, 64, -12, it[8]], [610, 360, 56, 10, it[12]], [720, 300, 60, -8, it[15]], [540, 24, 48, 14, it[1]], [690, 40, 44, -10, it[3]]];
  return `<style>${baseCss}
    body{background:radial-gradient(circle at 24% 55%,${acc}88 0,transparent 42%),linear-gradient(135deg,${b1},${b2})}
    .rays{position:absolute;left:-400px;top:-500px;width:1400px;height:1400px;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.06) 0 8deg,transparent 8deg 16deg)}
    .hero{position:absolute;left:30px;top:70px;font-size:300px;filter:drop-shadow(0 16px 16px rgba(0,0,0,.5))}
    .t{position:absolute;left:390px;right:30px;top:120px;font-size:${size}px;font-weight:900;line-height:1.05;text-shadow:0 4px 0 rgba(0,0,0,.35),0 0 30px rgba(0,0,0,.3)}
    .g{position:absolute;left:392px;top:80px;background:${acc};color:#1b1b1b;font-weight:800;font-size:20px;padding:5px 14px;border-radius:99px}
    .f{position:absolute;filter:drop-shadow(0 6px 6px rgba(0,0,0,.4))}</style>
    <div class="rays"></div><div class="e hero">${g.sp.hero}</div>
    <div class="g">${GENRE[g.genre][lang === 'ru' ? 0 : 1]}</div><div class="t">${title}</div>
    ${float.map(([x, y, s, r, e]) => `<div class="e f" style="left:${x}px;top:${y}px;font-size:${s}px;transform:rotate(${r}deg)">${e}</div>`).join('')}`;
}

// Прогресс «бывалого» игрока, чтобы скриншоты меню и коллекции выглядели живыми.
function seedSave(g) {
  const owned = {};
  [0, 1, 2, 3, 4, 5, 8, 9, 12].forEach((i) => { owned[g.set + '_' + i] = i < 4 ? 2 : 1; });
  const today = new Date().toISOString().slice(0, 10);
  return {
    v: 1, ts: Date.now(), coins: 48250, gems: 340, xp: 120, lvl: 12, upg: { income: 6, power: 3 }, owned, equip: null,
    daily: { idx: 3, last: null }, quests: { date: null, list: [] }, pass: { xp: 1650, free: [1, 2, 3, 4, 5], prem: [] }, perm: {},
    starterShownAt: 0, starterGranted: false, chest: { freeAt: 0, adDate: today, adCount: 1, pity: 4, pityL: 12, opened: 20 },
    best: 1240, rounds: 2, sound: false, gs: g.genre === 'clicker' ? { gens: [12, 8, 4, 1, 0, 0], total: 52000 } : {}, lastSeen: Date.now()
  };
}

async function shots(browser, g, dir, landscape) {
  const vp = landscape ? { width: 640, height: 360 } : { width: 360, height: 640 };
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, locale: 'ru-RU' });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, ['yg_' + g.slug, JSON.stringify(seedSave(g))]);
  await page.goto('file://' + path.join(ROOT, 'dist/games', g.slug, 'index.html'));
  await page.waitForSelector('.nav');
  const click = (sel) => page.$eval(sel, (e) => e.click());
  const suffix = landscape ? 'land' : 'port';
  const shot = (n) => page.screenshot({ path: path.join(dir, `screenshot-${suffix}-${n}.jpg`), type: 'jpeg', quality: 88 });
  const closeModals = async () => { for (let k = 0; k < 3; k++) { const b = page.locator('.modal-wrap.show [data-m]').last(); if (!(await b.count())) break; await b.click({ force: true }); await page.waitForTimeout(150); } };
  await page.waitForTimeout(300);
  await closeModals();
  // 1 — геймплей: несколько осмысленных касаний и снимок до конца раунда
  await click('[data-act=play]');
  await page.waitForTimeout(500);
  const box = await page.locator('canvas').first().boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const taps = { flappy: 3, clicker: 8, stack: 4, defense: 0, runner: 2 }[g.genre] ?? 3;
  for (let i = 0; i < taps; i++) {
    await page.mouse.click(cx + (i % 2 ? 40 : -40), cy + (g.genre === 'defense' ? -box.height * 0.25 : 0));
    await page.waitForTimeout(g.genre === 'flappy' ? 260 : 180);
  }
  const settle = { defense: 8000, runner: 1800, snake: 1200, breakout: 1200 }[g.genre];
  if (settle) await page.waitForTimeout(settle);
  await shot(1);
  // 2 — коллекция
  await page.evaluate(() => { document.body.classList.remove('in-game'); });
  await click('.nav [data-go=collection]');
  await page.waitForTimeout(200);
  await closeModals();
  // прокручиваем к альбомам: на кадре должны быть сами предметы, а не только сундуки
  await page.evaluate(() => { const v = document.querySelector('.view'), h = v.querySelector('h3'); v.scrollTop = h.offsetTop - 70; });
  await shot(2);
  // 3 — главное меню
  await click('.nav [data-go=menu]');
  await page.waitForTimeout(200);
  await closeModals();
  await shot(3);
  await ctx.close();
}

function listing(g) {
  const [hr, he] = HOWTO[g.genre];
  return {
    ru: { title: g.title.ru, short: g.desc.ru, full: `${g.desc.ru}\n\n${hr}\n\n${META[0]}`, how: hr },
    en: { title: g.title.en, short: g.desc.en, full: `${g.desc.en}\n\n${he}\n\n${META[1]}`, how: he }
  };
}

const only = process.argv.slice(2);
const targets = only.length ? GAMES.filter((g) => only.includes(g.slug)) : GAMES;
fs.mkdirSync(OUT, { recursive: true });
const browser = await pw.chromium.launch();
const csv = [['№', 'slug', 'архив', 'жанр', 'категория', 'название RU', 'описание RU', 'как играть RU', 'название EN', 'описание EN', 'как играть EN']];
for (const g of targets) {
  const id = String(g.id).padStart(3, '0');
  const dir = path.join(OUT, `${id}-${g.slug}`);
  fs.mkdirSync(dir, { recursive: true });
  const art = await browser.newPage();
  for (const [name, w, h, html] of [['icon-512.png', 512, 512, iconHtml(g)], ['cover-800x470-ru.png', 800, 470, coverHtml(g, 'ru')], ['cover-800x470-en.png', 800, 470, coverHtml(g, 'en')]]) {
    await art.setViewportSize({ width: w, height: h });
    await art.setContent(html);
    await art.screenshot({ path: path.join(dir, name) });
  }
  await art.close();
  try {
    await shots(browser, g, dir, false);
    await shots(browser, g, dir, true);
  } catch (e) {
    console.log(`! ${id} ${g.slug}: скриншоты не сняты — ${e.message.split('\n')[0]}`);
  }
  const l = listing(g);
  fs.writeFileSync(path.join(dir, 'listing.txt'),
    `Архив: ${id}-${g.slug}.zip\nКатегория: ${CATEGORY[g.genre]}\nВозраст: 0+\n\n` +
    `=== RU ===\nНазвание: ${l.ru.title}\nКраткое описание: ${l.ru.short}\nПолное описание:\n${l.ru.full}\nКак играть: ${l.ru.how}\n\n` +
    `=== EN ===\nTitle: ${l.en.title}\nShort description: ${l.en.short}\nFull description:\n${l.en.full}\nHow to play: ${l.en.how}\n`);
  csv.push([g.id, g.slug, `${id}-${g.slug}.zip`, GENRE[g.genre][0], CATEGORY[g.genre], l.ru.title, l.ru.full, l.ru.how, l.en.title, l.en.full, l.en.how]);
  console.log(`✓ ${id} ${g.slug}`);
}
await browser.close();
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(OUT, 'listings.csv'), '﻿' + csv.map((r) => r.map(q).join(';')).join('\r\n'));
console.log(`Готово: ${targets.length} игр → ${path.relative(ROOT, OUT)}`);
