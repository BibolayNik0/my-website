// Дымовой тест всех собранных игр в headless Chromium:
// загрузка, раунд со случайным вводом, пауза → результаты, все вкладки меню, сундук, покупка (заглушка).
// Использование: node tools/check.mjs [slug ...]   (сначала npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/manifest.json'), 'utf8'));
const only = process.argv.slice(2);
const games = only.length ? manifest.filter((m) => only.includes(m.slug)) : manifest;
const browser = await pw.chromium.launch({ headless: true });
let failed = 0;

for (const g of games) {
  const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|sdk\.js/.test(m.text())) errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  // DOM-клик: у кнопок бесконечная анимация «дыхания», Playwright ждал бы их остановки.
  const click = (sel) => page.$eval(sel, (e) => e.click());
  try {
    await page.goto('file://' + path.join(ROOT, 'dist/games', g.slug, 'index.html'));
    await page.waitForSelector('.nav', { timeout: 5000 });
    await click('[data-act=play]');
    await page.waitForSelector('body.in-game canvas', { timeout: 3000 });
    const box = await page.locator('canvas').first().boundingBox();
    for (let i = 0; i < 40; i++) {
      const x = box.x + 30 + Math.random() * (box.width - 60), y = box.y + 100 + Math.random() * (box.height - 200);
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120, { steps: 3 });
      await page.mouse.up();
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'][i % 5]);
      await page.waitForTimeout(40);
    }
    // Если раунд уже закончился — модалка возрождения/результатов; иначе выходим через паузу.
    for (let k = 0; k < 6; k++) {
      if (!(await page.evaluate(() => document.body.classList.contains('in-game')))) break;
      const m = page.locator('.modal-wrap.show [data-m]');
      if (await m.count()) {
        const prefer = ['menu', 'no', 'ok'];
        let clicked = false;
        for (const v of prefer) { const b = page.locator(`.modal-wrap.show [data-m=${v}]`); if (await b.count()) { await b.first().click({ force: true }); clicked = true; break; } }
        if (!clicked) await m.first().click({ force: true });
      } else {
        await click('[data-act=pause]');
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(150);
    }
    // закрываем возможные модалки (результаты, оффер)
    for (let k = 0; k < 4; k++) {
      const b = page.locator('.modal-wrap.show [data-m=close], .modal-wrap.show [data-m=ok], .modal-wrap.show [data-m=menu]');
      if (!(await b.count())) break;
      await b.first().click({ force: true }); await page.waitForTimeout(100);
    }
    for (const tab of ['upgrades', 'collection', 'tasks', 'shop', 'menu']) {
      await click(`.nav [data-go=${tab}]`);
      await page.waitForTimeout(30);
    }
    await click('.nav [data-go=collection]');
    await click('[data-act=freechest]');
    await page.waitForSelector('.modal-wrap.show .chest-res', { timeout: 2000 });
    await click('.modal-wrap.show [data-m=ok]');
    await click('.nav [data-go=shop]');
    await click('[data-buy=gems_small]');
    await page.waitForTimeout(100);
    const gems = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('yg_')))).gems);
    if (gems < 80) errors.push('purchase did not grant gems: ' + gems);
  } catch (e) {
    errors.push('flow: ' + e.message.split('\n')[0]);
  }
  await page.close();
  if (errors.length) { failed++; console.log(`✗ ${g.id} ${g.slug}: ${[...new Set(errors)].slice(0, 3).join(' | ')}`); }
  else console.log(`✓ ${g.id} ${g.slug}`);
}
await browser.close();
console.log(failed ? `\nОшибок: ${failed} из ${games.length}` : `\nВсе ${games.length} игр прошли проверку`);
process.exit(failed ? 1 : 0);
