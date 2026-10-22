// Безопасная работа с localStorage (может быть недоступен в приватном режиме)
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

// ---------- Главная: поиск и фильтр по категориям ----------
const grid = document.getElementById('grid');
if (grid) {
  const search = document.getElementById('search');
  const chips = document.querySelectorAll('.chip');
  const empty = document.getElementById('empty');
  let category = 'all';

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    grid.querySelectorAll('.card').forEach((card) => {
      const matchCat = category === 'all' || card.dataset.cat.split(' ').includes(category);
      const matchText = !query || card.dataset.title.includes(query);
      const show = matchCat && matchText;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    empty.style.display = visible ? 'none' : 'block';
  };

  search.addEventListener('input', apply);
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    category = chip.dataset.cat;
    apply();
  }));
}

// ---------- Статья: чек-листы и прогресс по шагам ----------
const article = document.querySelector('[data-article]');
if (article) {
  const key = 'garagegid:' + article.dataset.article;
  const state = store.get(key) || { checks: {}, steps: {} };
  const save = () => store.set(key, state);

  document.querySelectorAll('.check input').forEach((input) => {
    input.checked = !!state.checks[input.id];
    input.addEventListener('change', () => {
      state.checks[input.id] = input.checked;
      save();
    });
  });

  const steps = document.querySelectorAll('.step');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');

  const render = () => {
    let done = 0;
    steps.forEach((step) => {
      const isDone = !!state.steps[step.id];
      step.classList.toggle('done', isDone);
      step.querySelector('.done-btn').textContent = isDone ? '✓ Выполнено' : 'Отметить выполненным';
      if (isDone) done++;
    });
    bar.style.width = (done / steps.length) * 100 + '%';
    text.textContent = done === steps.length
      ? 'Готово! Не забудьте проверить уровень масла через 5 минут.'
      : `Выполнено шагов: ${done} из ${steps.length}`;
  };

  steps.forEach((step) => {
    step.querySelector('.done-btn').addEventListener('click', () => {
      state.steps[step.id] = !state.steps[step.id];
      save();
      render();
    });
  });

  document.getElementById('reset')?.addEventListener('click', () => {
    state.checks = {};
    state.steps = {};
    save();
    document.querySelectorAll('.check input').forEach((i) => { i.checked = false; });
    render();
  });

  render();
}
