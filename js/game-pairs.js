// Тренажёр "Пары" — классическая игра на память, найди все пары карточек
const GamePairs = (() => {
  const SYMBOL_SETS = {
    icons: { nameKey: 'pairs.setIcons', pool: ICON_POOL.map(name => ({ id: name, icon: name })) },
    thai: { nameKey: 'pairs.setThai', pool: THAI_POOL.map(t => ({ id: t.ch, ch: t.ch, tr: t.tr })) },
  };

  const LEVELS = [
    { nameKey: 'pairs.levelEasy', cols: 4, rows: 4, memorize: 5000, mistakesAllowed: 6, hints: 2 },
    { nameKey: 'pairs.levelMedium', cols: 6, rows: 6, memorize: 4000, mistakesAllowed: 4, hints: 1 },
    { nameKey: 'pairs.levelHard', cols: 6, rows: 8, memorize: 3000, mistakesAllowed: 2, hints: 0 },
  ];

  function historyVariants() {
    const arr = [];
    LEVELS.forEach((lv, i) => {
      Object.entries(SYMBOL_SETS).forEach(([sk, s]) => {
        arr.push({ key: `pairs_${i}_${sk}`, label: `${I18N.t(lv.nameKey)} · ${I18N.t(s.nameKey)}` });
      });
    });
    return arr;
  }

  function tokenNode(token, big) {
    if (token.icon) {
      return Utils.el('i', { 'data-lucide': token.icon, class: big ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-5 h-5' });
    }
    return Utils.el('div', { class: 'flex flex-col items-center leading-none' }, [
      Utils.el('span', { class: `thai ${big ? 'text-xl sm:text-2xl' : 'text-lg'} font-bold` }, token.ch),
      Utils.el('span', { class: 'text-[8px] text-slate-500 mt-0.5' }, token.tr),
    ]);
  }

  function mount(root, onExit) {
    let symbolKey = 'icons';
    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'mb-5' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('pairs.symbolSet')),
        Utils.el('div', { class: 'grid grid-cols-2 gap-2' }, Object.entries(SYMBOL_SETS).map(([key, s]) =>
          Utils.el('button', {
            class: `p-3 rounded-md border text-center transition ${symbolKey === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}`,
            onclick: () => { symbolKey = key; renderSetup(); },
          }, Utils.el('div', { class: 'font-semibold text-slate-100 text-sm' }, I18N.t(s.nameKey)))
        )),
      ]));
      root.appendChild(Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('common.chooseLevel')));
      root.appendChild(Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, LEVELS.map((lv, i) => {
        const best = Utils.getBest(`pairs_${i}_${symbolKey}`);
        return Utils.el('button', {
          class: 'p-4 rounded-md border border-slate-700 bg-slate-800/50 text-left hover:border-indigo-400 transition',
          onclick: () => startGame(i, symbolKey),
        }, [
          Utils.el('div', { class: 'font-semibold text-slate-100' }, `${I18N.t(lv.nameKey)} — ${lv.cols}×${lv.rows}`),
          Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t('pairs.memorizeInfo', { s: (lv.memorize / 1000).toFixed(0), m: lv.mistakesAllowed }) + (best ? ` · ${I18N.t('common.record')}: ${best}` : '')),
        ]);
      })));
      Utils.refreshIcons();
    }

    function startGame(levelIdx, symbolKey) {
      const level = LEVELS[levelIdx];
      const pool = SYMBOL_SETS[symbolKey].pool;
      const total = level.cols * level.rows;
      const pairsCount = total / 2;
      const uniq = Utils.sample(pool, pairsCount);
      const deck = Utils.shuffle([...uniq, ...uniq]).map(token => ({ token, matched: false }));

      const state = { levelIdx, symbolKey, level, deck, mistakes: 0, score: 1000, hints: level.hints, flipped: [], locked: true, startedAt: 0, matchedPairs: 0, timerId: null };

      root.innerHTML = '';
      root.appendChild(hud());
      const grid = Utils.el('div', {
        class: 'grid gap-1.5 no-scrollbar',
        style: `grid-template-columns:repeat(${level.cols},1fr);`,
      });
      root.appendChild(grid);

      const cardEls = state.deck.map((card, i) => {
        const front = Utils.el('div', { class: 'flip-face front bg-slate-800 border border-slate-700 text-slate-100' }, tokenNode(card.token, true));
        const back = Utils.el('div', { class: 'flip-face back bg-indigo-500/20 border border-indigo-500/40' }, Utils.el('span', { class: 'text-indigo-300 font-bold' }, '?'));
        const inner = Utils.el('div', { class: 'flip-inner' }, [front, back]);
        const el = Utils.el('div', {
          class: 'flip-card aspect-square cursor-pointer',
          onclick: () => onCardClick(i),
        }, inner);
        grid.appendChild(el);
        return el;
      });
      Utils.refreshIcons();

      // фаза запоминания: карточки открыты
      const barOuter = root.querySelector('#pairs-bar-outer');
      const barInner = root.querySelector('#pairs-bar-inner');
      Utils.startBarDrain(barInner, level.memorize);
      setTimeout(() => {
        cardEls.forEach(c => c.classList.add('is-hidden'));
        setTimeout(() => {
          state.locked = false;
          state.startedAt = Date.now();
          startTimer();
          barOuter.classList.add('invisible');
        }, 380);
      }, level.memorize);

      function startTimer() {
        state.timerId = setInterval(() => {
          const timeEl = root.querySelector('#pairs-time');
          if (timeEl) timeEl.textContent = Utils.fmtTime(Date.now() - state.startedAt);
        }, 50);
      }

      function onCardClick(i) {
        if (state.locked) return;
        const card = state.deck[i];
        if (card.matched || state.flipped.includes(i)) return;
        cardEls[i].classList.remove('is-hidden');
        state.flipped.push(i);
        if (state.flipped.length === 2) {
          state.locked = true;
          const [a, b] = state.flipped;
          if (state.deck[a].token.id === state.deck[b].token.id) {
            state.deck[a].matched = state.deck[b].matched = true;
            cardEls[a].classList.add('opacity-40');
            cardEls[b].classList.add('opacity-40');
            state.matchedPairs++;
            state.flipped = [];
            state.locked = false;
            if (state.matchedPairs === pairsCount) finishGame(state);
          } else {
            state.mistakes++;
            state.score = Math.max(0, state.score - 20);
            cardEls[a].classList.add('shake');
            cardEls[b].classList.add('shake');
            updateHud(state);
            setTimeout(() => {
              cardEls[a].classList.remove('shake');
              cardEls[b].classList.remove('shake');
              cardEls[a].classList.add('is-hidden');
              cardEls[b].classList.add('is-hidden');
              state.flipped = [];
              state.locked = false;
              if (state.mistakes >= level.mistakesAllowed) gameOver(state);
            }, 700);
          }
        }
        updateHud(state);
      }

      function useHint() {
        if (state.hints <= 0 || state.locked || state.flipped.length) return;
        state.hints--;
        state.score = Math.max(0, state.score - 60);
        state.locked = true;
        cardEls.forEach((c, i) => { if (!state.deck[i].matched) c.classList.remove('is-hidden'); });
        setTimeout(() => {
          cardEls.forEach((c, i) => { if (!state.deck[i].matched) c.classList.add('is-hidden'); });
          state.locked = false;
        }, 1000);
        updateHud(state);
      }

      function hud() {
        const wrap = Utils.el('div', { class: 'mb-3' }, [
          Utils.el('div', { class: 'flex items-center justify-between mb-2' }, [
            Utils.el('div', { class: 'text-sm font-semibold text-slate-400' }, I18N.t('pairs.label')),
            Utils.el('div', { id: 'pairs-time', class: 'text-sm font-mono text-slate-400' }, '0.00с'),
            Utils.el('button', {
              class: 'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 disabled:opacity-30',
              onclick: () => useHint(),
            }, [Utils.el('i', { 'data-lucide': 'lightbulb', class: 'w-4 h-4' }), Utils.el('span', { id: 'pairs-hints' }, ` ${state.hints}`)]),
          ]),
          Utils.el('div', { id: 'pairs-mistakes', class: 'text-xs text-rose-400 mb-2' }, ''),
          Utils.el('div', { id: 'pairs-bar-outer', class: 'w-full h-1.5 bg-slate-800 rounded-full overflow-hidden' }, Utils.el('div', { id: 'pairs-bar-inner', class: 'h-full bg-indigo-500', style: 'width:100%;transition:width linear' })),
        ]);
        setTimeout(() => updateHud(state), 0);
        Utils.refreshIcons();
        return wrap;
      }

      function updateHud(state) {
        const mistakesEl = root.querySelector('#pairs-mistakes');
        if (mistakesEl) mistakesEl.textContent = I18N.t('pairs.mistakes', { m: state.mistakes, allowed: level.mistakesAllowed });
        const hintsEl = root.querySelector('#pairs-hints');
        if (hintsEl) hintsEl.textContent = ` ${state.hints}`;
        Utils.refreshIcons();
      }
    }

    function finishGame(state) {
      clearInterval(state.timerId);
      const elapsed = Date.now() - state.startedAt;
      const finalScore = Math.max(50, state.score - Math.floor(elapsed / 1000) * 5);
      const key = `pairs_${state.levelIdx}_${state.symbolKey}`;
      const isBest = Utils.setBest(key, finalScore, true);
      Utils.recordResult(key, finalScore);
      showResult(state, true, finalScore, isBest, elapsed);
    }

    function gameOver(state) {
      clearInterval(state.timerId);
      showResult(state, false, 0, false, Date.now() - state.startedAt);
    }

    function showResult(state, won, finalScore, isBest, elapsed) {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': won ? 'party-popper' : 'flag', class: `w-10 h-10 mx-auto mb-3 ${won ? 'text-emerald-400' : 'text-slate-500'}` }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, won ? I18N.t('pairs.won') : I18N.t('pairs.lost')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, won ? I18N.t('pairs.wonInfo', { t: Utils.fmtTime(elapsed), s: finalScore }) + (isBest ? I18N.t('common.newRecord') : '') : I18N.t('pairs.tryAgain')),
        Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => startGame(state.levelIdx, state.symbolKey) }, I18N.t('common.playAgain')),
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: onExit }, I18N.t('common.toMenu')),
        ]),
      ]));
      Utils.refreshIcons();
    }
  }

  return { id: 'pairs', titleKey: 'game.pairs.title', descKey: 'game.pairs.desc', icon: 'layout-grid', color: 'bg-rose-500', historyVariants, mount };
})();
