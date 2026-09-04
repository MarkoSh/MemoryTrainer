// Тренажёр "Таблицы Шульте" — находи числа по порядку, не отводя взгляд от центра
const GameSchulte = (() => {
  // сетки всегда чётные — иначе точка фиксации в центре закрывает число
  const LEVELS = [
    { nameKey: 'schulte.levelClassic', descKey: 'schulte.levelClassicDesc', size: 4, mode: 'static' },
    { nameKey: 'schulte.levelMoving', descKey: 'schulte.levelMovingDesc', size: 6, mode: 'reshuffle-order' },
    { nameKey: 'schulte.levelPeriphery', descKey: 'schulte.levelPeripheryDesc', size: 8, mode: 'reshuffle-random' },
  ];

  function historyVariants() {
    return LEVELS.map((lv, i) => ({ key: `schulte_${i}`, label: I18N.t(lv.nameKey) }));
  }

  function mount(root, onExit) {
    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('common.chooseLevel')));
      root.appendChild(Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, LEVELS.map((lv, i) => {
        const best = Utils.getBest(`schulte_${i}`);
        return Utils.el('button', {
          class: 'p-4 rounded-md border border-slate-700 bg-slate-800/50 text-left hover:border-indigo-400 transition',
          onclick: () => startGame(i),
        }, [
          Utils.el('div', { class: 'font-semibold text-slate-100' }, `${I18N.t(lv.nameKey)} — ${lv.size}×${lv.size}`),
          Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t(lv.descKey) + (best ? I18N.t('schulte.recordSuffix', { t: Utils.fmtTime(Number(best)) }) : '')),
        ]);
      })));
    }

    function startGame(levelIdx) {
      const level = LEVELS[levelIdx];
      const total = level.size * level.size;
      const state = {
        levelIdx, level, total,
        layout: Utils.shuffle(Array.from({ length: total }, (_, i) => i + 1)),
        found: new Set(),
        next: 1, mistakes: 0, hints: 2, hintsUsed: 0,
        target: null, startedAt: Date.now(), timerId: null,
      };
      if (level.mode === 'reshuffle-random') state.target = state.layout[Utils.randInt(0, total - 1)];

      root.innerHTML = '';
      root.appendChild(hud(state));

      const gridWrap = Utils.el('div', { class: 'relative aspect-square' });
      root.appendChild(gridWrap);
      renderGrid(state, gridWrap);

      state.timerId = setInterval(() => {
        const t = root.querySelector('#schulte-time');
        if (t) t.textContent = Utils.fmtTime(Date.now() - state.startedAt);
      }, 50);

      function useHint() {
        if (state.hints <= 0) return;
        state.hints--;
        state.hintsUsed++;
        const expected = level.mode === 'reshuffle-random' ? state.target : state.next;
        const idx = state.layout.indexOf(expected);
        const cell = gridWrap.querySelector(`[data-idx="${idx}"]`);
        if (cell) {
          cell.classList.add('ring-2', 'ring-amber-400');
          setTimeout(() => cell.classList.remove('ring-2', 'ring-amber-400'), 800);
        }
        updateHud(state);
      }

      function onCellClick(idx) {
        const number = state.layout[idx];
        if (state.found.has(number)) return;
        const expected = level.mode === 'reshuffle-random' ? state.target : state.next;
        const cell = gridWrap.querySelector(`[data-idx="${idx}"]`);
        if (number === expected) {
          state.found.add(number);
          state.next++;
          if (state.found.size === state.total) { finishGame(state); return; }
          if (level.mode === 'reshuffle-random') {
            const remaining = state.layout.filter(n => !state.found.has(n));
            state.target = remaining[Utils.randInt(0, remaining.length - 1)];
          }
          // перемешиваем всю сетку целиком — найденные клетки остаются видимыми,
          // но не закрепляются на месте, чтобы взгляду не становилось легче с каждым разом
          if (level.mode !== 'static') state.layout = Utils.shuffle(state.layout);
          renderGrid(state, gridWrap);
        } else {
          state.mistakes++;
          if (cell) { cell.classList.add('shake', 'bg-rose-500/10'); setTimeout(() => cell.classList.remove('shake', 'bg-rose-500/10'), 400); }
        }
        updateHud(state);
      }

      function renderGrid(state, wrap) {
        wrap.innerHTML = '';
        const grid = Utils.el('div', {
          class: 'grid gap-1.5 w-full h-full',
          style: `grid-template-columns:repeat(${level.size},1fr);`,
        });
        state.layout.forEach((num, idx) => {
          const done = state.found.has(num);
          const cell = Utils.el('button', {
            'data-idx': idx,
            class: `aspect-square flex items-center justify-center rounded-md border font-bold text-base sm:text-lg transition ${done ? 'border-slate-800 bg-slate-800/40 text-slate-600 cursor-default' : 'border-slate-700 bg-slate-800 hover:border-indigo-400 active:scale-95 text-slate-100'}`,
            onclick: () => onCellClick(idx),
          }, String(num));
          grid.appendChild(cell);
        });
        wrap.appendChild(grid);

        if (level.mode === 'reshuffle-random') {
          wrap.appendChild(Utils.el('div', {
            class: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-11 h-11 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center font-extrabold text-lg shadow-lg',
          }, String(state.target)));
        } else {
          wrap.appendChild(Utils.el('div', {
            class: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 rounded-full bg-rose-500 pulse-dot',
          }));
        }
      }

      function hud(state) {
        const wrap = Utils.el('div', { class: 'flex items-center justify-between mb-3' }, [
          Utils.el('div', { id: 'schulte-time', class: 'text-sm font-mono font-bold text-slate-200' }, '0.00с'),
          Utils.el('div', { id: 'schulte-mistakes', class: 'text-xs text-rose-400' }, ''),
          Utils.el('button', {
            class: 'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400',
            onclick: () => useHint(),
          }, [Utils.el('i', { 'data-lucide': 'lightbulb', class: 'w-4 h-4' }), Utils.el('span', { id: 'schulte-hints' }, ` ${state.hints}`)]),
        ]);
        setTimeout(() => updateHud(state), 0);
        return wrap;
      }

      function updateHud(state) {
        const m = root.querySelector('#schulte-mistakes');
        if (m) m.textContent = I18N.t('schulte.mistakes', { n: state.mistakes });
        const h = root.querySelector('#schulte-hints');
        if (h) h.textContent = ` ${state.hints}`;
        Utils.refreshIcons();
      }
    }

    function finishGame(state) {
      clearInterval(state.timerId);
      const elapsed = Date.now() - state.startedAt;
      const adjusted = elapsed + state.mistakes * 2000 + state.hintsUsed * 3000;
      const key = `schulte_${state.levelIdx}`;
      const isBest = Utils.setBest(key, adjusted, false);
      Utils.recordResult(key, adjusted);
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': 'target', class: 'w-10 h-10 mx-auto text-emerald-400 mb-3' }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t('schulte.won')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, I18N.t('schulte.wonInfo', { t: Utils.fmtTime(elapsed), n: state.mistakes }) + (isBest ? I18N.t('common.newRecord') : '')),
        Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => startGame(state.levelIdx) }, I18N.t('common.playAgain')),
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: onExit }, I18N.t('common.toMenu')),
        ]),
      ]));
      Utils.refreshIcons();
    }
  }

  return { id: 'schulte', titleKey: 'game.schulte.title', descKey: 'game.schulte.desc', icon: 'grid-3x3', color: 'bg-amber-500', historyVariants, mount };
})();
