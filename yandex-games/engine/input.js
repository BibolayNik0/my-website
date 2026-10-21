// Свайпы и стрелки клавиатуры для жанров с направленным управлением.
(function () {
  'use strict';
  YG.swipe = function (target, cb) {
    let sx = 0, sy = 0, active = false;
    const down = (e) => { active = true; sx = e.clientX; sy = e.clientY; };
    const up = (e) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) { cb('tap', e); return; }
      cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), e);
    };
    const key = (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down', Space: 'tap' };
      if (map[e.code]) { e.preventDefault(); cb(map[e.code], e); }
    };
    target.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key);
    return () => {
      target.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', key);
    };
  };
})();
