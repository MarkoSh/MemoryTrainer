// Тренажёр "Математика" — вычисли выражение, выбери ответ из 5 вариантов
const GameMath = (() => {
  const QUESTIONS_TOTAL = 10;
  const LEVELS = [
    { nameKey: 'math.level1', ops: 1, brackets: false, range: 20, time: 10000 },
    { nameKey: 'math.level2', ops: 2, brackets: false, range: 20, time: 13000 },
    { nameKey: 'math.level3', ops: 3, brackets: true, range: 12, time: 18000 },
  ];

  function historyVariants() {
    return LEVELS.map((lv, i) => ({ key: `math_${i}`, label: I18N.t(lv.nameKey) }));
  }

  function randOp() { return Utils.sample(['+', '-', '*'], 1)[0]; }

  function apply(a, op, b) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    return a * b;
  }

  // строит случайное выражение из N чисел/операций, опционально со скобками
  function buildExpr(level) {
    const nums = [];
    const ops = [];
    const count = level.ops + 1;
    for (let i = 0; i < count; i++) nums.push(Utils.randInt(2, level.range));
    for (let i = 0; i < level.ops; i++) ops.push(randOp());

    let exprStr = String(nums[0]);
    let value;
    if (level.brackets && ops.length >= 2) {
      const bi = Utils.randInt(0, ops.length - 2);
      exprStr = wrapBrackets(nums, ops, bi);
      value = evalBracketed(nums, ops, bi);
    } else {
      for (let i = 0; i < ops.length; i++) exprStr += ` ${ops[i]} ${nums[i + 1]}`;
      value = nums[0];
      for (let i = 0; i < ops.length; i++) value = apply(value, ops[i], nums[i + 1]);
    }
    return { text: exprStr, value };
  }

  function wrapBrackets(nums, ops, bi) {
    let s = '';
    for (let i = 0; i < nums.length; i++) {
      if (i === bi) s += '(';
      s += nums[i];
      if (i === bi + 1) s += ')';
      if (i < ops.length) s += ` ${ops[i]} `;
    }
    return s;
  }

  function evalBracketed(nums, ops, bi) {
    const inner = apply(nums[bi], ops[bi], nums[bi + 1]);
    const seq = [...nums.slice(0, bi), inner, ...nums.slice(bi + 2)];
    const seqOps = [...ops.slice(0, bi), ...ops.slice(bi + 1)];
    let value = seq[0];
    for (let i = 0; i < seqOps.length; i++) value = apply(value, seqOps[i], seq[i + 1]);
    return value;
  }

  function buildOptions(correct) {
    const set = new Set([correct]);
    while (set.size < 5) {
      const delta = Utils.randInt(-6, 6) || 1;
      set.add(correct + delta);
    }
    return Utils.shuffle([...set]);
  }

  function mount(root, onExit) {
    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('math.chooseLevel', { n: QUESTIONS_TOTAL })));
      root.appendChild(Utils.el('div', { class: 'grid grid-cols-1 gap-2 mb-6' }, LEVELS.map((lv, i) => {
        const best = Utils.getBest(`math_${i}`);
        return Utils.el('button', {
          class: 'p-4 rounded-md border border-slate-700 bg-slate-800/50 text-left hover:border-indigo-400 transition',
          onclick: () => startGame(i),
        }, [
          Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t(lv.nameKey)),
          Utils.el('div', { class: 'text-xs text-slate-500' }, best ? I18N.t('math.recordN', { n: best }) : I18N.t('math.notPlayed')),
        ]);
      })));
      Utils.refreshIcons();
    }

    function startGame(levelIdx) {
      const state = { levelIdx, score: 0, lives: 3, hints: 2, qIndex: 0, correct: 0 };
      runQuestion(state);
    }

    function runQuestion(state) {
      const level = LEVELS[state.levelIdx];
      const { text, value } = buildExpr(level);
      const options = buildOptions(value);
      let eliminated = [];
      let answered = false;

      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'flex items-center justify-between mb-2' }, [
        Utils.el('div', { class: 'flex items-center gap-1', id: 'math-hearts' }),
        Utils.el('div', { id: 'math-progress', class: 'text-sm font-semibold text-slate-400' }, I18N.t('math.question', { i: state.qIndex + 1, n: QUESTIONS_TOTAL })),
      ]));
      root.appendChild(Utils.el('div', { class: 'flex items-center justify-between mb-6' }, [
        Utils.el('div', { id: 'math-score', class: 'text-sm font-bold text-indigo-400' }, I18N.t('common.points', { n: state.score })),
        Utils.el('button', {
          class: 'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400',
          onclick: () => useHint(),
        }, [Utils.el('i', { 'data-lucide': 'lightbulb', class: 'w-4 h-4' }), Utils.el('span', { id: 'math-hint-count' }, ` ${state.hints}`)]),
      ]));

      const barOuter = Utils.el('div', { class: 'w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6' });
      const barInner = Utils.el('div', { class: 'h-full bg-emerald-500', style: 'width:100%;transition:width linear' });
      barOuter.appendChild(barInner);
      root.appendChild(barOuter);

      root.appendChild(Utils.el('div', { class: 'text-center text-3xl font-extrabold mb-8 pop-in tracking-wide text-slate-100' }, text + ' = ?'));

      const optsWrap = Utils.el('div', { class: 'grid grid-cols-1 gap-2' });
      root.appendChild(optsWrap);
      renderOptions();
      updateHud();
      Utils.refreshIcons();

      Utils.startBarDrain(barInner, level.time);
      const timeout = setTimeout(() => handleAnswer(null), level.time);

      function renderOptions() {
        optsWrap.innerHTML = '';
        options.forEach(opt => {
          if (eliminated.includes(opt)) {
            optsWrap.appendChild(Utils.el('button', { class: 'py-3 rounded-md border border-slate-800 text-slate-700', disabled: 'true' }, String(opt)));
            return;
          }
          optsWrap.appendChild(Utils.el('button', {
            class: 'py-3 rounded-md border border-slate-700 bg-slate-800/50 font-bold text-lg text-slate-100 hover:border-indigo-400 active:scale-95 transition',
            onclick: (e) => handleAnswer(opt, e.currentTarget),
          }, String(opt)));
        });
      }

      function handleAnswer(opt, btnEl) {
        if (answered) return;
        answered = true;
        clearTimeout(timeout);
        if (opt === value) {
          state.score += 15;
          state.correct++;
          if (btnEl) btnEl.classList.add('border-emerald-500', 'bg-emerald-500/10');
          proceed();
        } else {
          state.lives--;
          if (btnEl) btnEl.classList.add('border-rose-500', 'bg-rose-500/10', 'shake');
          state.score = Math.max(0, state.score - 5);
          updateHud();
          proceed();
        }
      }

      function proceed() {
        state.qIndex++;
        if (state.lives <= 0 || state.qIndex >= QUESTIONS_TOTAL) {
          setTimeout(() => gameOver(state), 600);
        } else {
          setTimeout(() => runQuestion(state), 600);
        }
      }

      function useHint() {
        if (state.hints <= 0 || answered) return;
        state.hints--;
        state.score = Math.max(0, state.score - 10);
        const wrongOpts = options.filter(o => o !== value && !eliminated.includes(o));
        eliminated.push(...Utils.sample(wrongOpts, Math.min(2, wrongOpts.length)));
        renderOptions();
        updateHud();
      }

      function updateHud() {
        const hearts = root.querySelector('#math-hearts');
        if (hearts) {
          hearts.innerHTML = '';
          for (let i = 0; i < 3; i++) hearts.appendChild(Utils.el('i', { 'data-lucide': 'heart', class: `w-4 h-4 ${i < state.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-700'}` }));
        }
        const scoreEl = root.querySelector('#math-score');
        if (scoreEl) scoreEl.textContent = I18N.t('common.points', { n: state.score });
        const hintEl = root.querySelector('#math-hint-count');
        if (hintEl) hintEl.textContent = ` ${state.hints}`;
        Utils.refreshIcons();
      }
    }

    function gameOver(state) {
      const key = `math_${state.levelIdx}`;
      const isBest = Utils.setBest(key, state.score, true);
      Utils.recordResult(key, state.score);
      const accuracy = Math.round((state.correct / QUESTIONS_TOTAL) * 100);
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': 'calculator', class: 'w-10 h-10 mx-auto text-slate-500 mb-3' }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t('math.result')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, I18N.t('math.correct', { c: state.correct, t: QUESTIONS_TOTAL, pct: accuracy })),
        Utils.el('div', { class: 'text-slate-400' }, I18N.t('math.scoreLine', { score: state.score }) + (isBest ? I18N.t('common.newRecord') : '')),
        Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => startGame(state.levelIdx) }, I18N.t('common.playAgain')),
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: onExit }, I18N.t('common.toMenu')),
        ]),
      ]));
      Utils.refreshIcons();
    }
  }

  return { id: 'math', titleKey: 'game.math.title', descKey: 'game.math.desc', icon: 'calculator', color: 'bg-emerald-500', historyVariants, mount };
})();
