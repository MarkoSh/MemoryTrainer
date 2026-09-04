// Тренажёр "Строчка" — запоминание и воспроизведение последовательности символов
const GameLine = (() => {
  const LEVELS = {
    en: { nameKey: 'line.setEn', pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch => ({ id: ch, ch })) },
    icons: { nameKey: 'line.setIcons', pool: ICON_POOL.map(name => ({ id: name, icon: name })) },
    thai: { nameKey: 'line.setThai', pool: THAI_POOL.map(t => ({ id: t.ch, ch: t.ch, tr: t.tr })) },
  };

  const ROUND_TYPES = {
    forward: { nameKey: 'line.roundForward', descKey: 'line.roundForwardDesc' },
    reverse: { nameKey: 'line.roundReverse', descKey: 'line.roundReverseDesc' },
    guess: { nameKey: 'line.roundGuess', descKey: 'line.roundGuessDesc' },
    combo: { nameKey: 'line.roundCombo', descKey: 'line.roundComboDesc' },
  };

  const LENGTHS = [3, 4, 5, 6, 7, 8, 10, 12];

  function phasesFor(roundType) {
    return roundType === 'combo' ? ['forward', 'reverse', 'guess'] : [roundType];
  }

  function historyVariants() {
    const arr = [];
    Object.entries(LEVELS).forEach(([lk, lv]) => {
      Object.entries(ROUND_TYPES).forEach(([rk, rt]) => {
        arr.push({ key: `line_${lk}_${rk}`, label: `${I18N.t(lv.nameKey)} · ${I18N.t(rt.nameKey)}` });
      });
    });
    return arr;
  }

  function tokenNode(token, big) {
    if (token.icon) {
      return Utils.el('i', { 'data-lucide': token.icon, class: big ? 'w-7 h-7' : 'w-6 h-6' });
    }
    if (token.tr) {
      return Utils.el('div', { class: 'flex flex-col items-center leading-none' }, [
        Utils.el('span', { class: `thai ${big ? 'text-2xl' : 'text-xl'} font-bold` }, token.ch),
        Utils.el('span', { class: 'text-[9px] text-slate-500 mt-0.5' }, token.tr),
      ]);
    }
    return Utils.el('span', { class: big ? 'text-2xl font-extrabold' : 'text-xl font-extrabold' }, token.ch);
  }

  function mount(root, onExit) {
    let levelKey = 'en';
    let roundType = 'forward';
    let length = 5;

    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'mb-5' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('line.symbolSet')),
        Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, Object.entries(LEVELS).map(([key, lv]) =>
          Utils.el('button', {
            class: `p-3 rounded-md border text-left transition ${levelKey === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}`,
            onclick: () => { levelKey = key; renderSetup(); },
          }, [Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t(lv.nameKey)), Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t('line.symbolsInSet', { n: lv.pool.length }))])
        )),
      ]));
      root.appendChild(Utils.el('div', { class: 'mb-5' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('line.length')),
        Utils.el('div', { class: 'grid grid-cols-4 gap-2' }, LENGTHS.map(n =>
          Utils.el('button', {
            class: `py-2 rounded-md border font-bold transition ${length === n ? 'border-indigo-500 bg-indigo-500/10 text-slate-100' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`,
            onclick: () => { length = n; renderSetup(); },
          }, String(n))
        )),
      ]));
      root.appendChild(Utils.el('div', { class: 'mb-6' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('line.roundType')),
        Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, Object.entries(ROUND_TYPES).map(([key, rt]) =>
          Utils.el('button', {
            class: `p-3 rounded-md border text-left transition ${roundType === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}`,
            onclick: () => { roundType = key; renderSetup(); },
          }, [Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t(rt.nameKey)), Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t(rt.descKey))])
        )),
      ]));
      root.appendChild(Utils.el('button', {
        class: 'w-full py-3 rounded-md bg-indigo-500 text-white font-bold hover:bg-indigo-400 active:scale-[.98] transition',
        onclick: () => startGame(levelKey, roundType, length),
      }, I18N.t('line.start')));
      Utils.refreshIcons();
    }

    function startGame(levelKey, roundType, length) {
      const state = {
        levelKey, roundType,
        pool: LEVELS[levelKey].pool,
        length,
        score: 0,
        lives: 3,
        hints: 3,
        round: 1,
      };
      playRound(state);
    }

    function scoreKey(levelKey, roundType) { return `line_${levelKey}_${roundType}`; }

    function playRound(state) {
      const sequence = Utils.sample(state.pool, state.length);
      const phases = phasesFor(state.roundType);
      playPhase(state, sequence, phases, 0, true);
    }

    function playPhase(state, sequence, phases, phaseIdx, doStudy) {
      const phaseType = phases[phaseIdx];
      const noiseCount = Math.min(state.pool.length - state.length, 6 + Math.floor(state.length / 3));
      const noise = Utils.sample(state.pool.filter(t => !sequence.includes(t)), Math.max(0, noiseCount));
      const keyboardTokens = Utils.shuffle([...sequence, ...noise]);

      let askOrder;
      if (phaseType === 'forward') askOrder = sequence.map((_, i) => i);
      else if (phaseType === 'reverse') askOrder = sequence.map((_, i) => i).reverse();
      else askOrder = [Utils.randInt(0, sequence.length - 1)];

      let askPtr = 0;
      const studyTime = 1000 + state.length * 700;

      root.innerHTML = '';
      root.appendChild(header());

      const isCombo = phases.length > 1;
      const info = Utils.el('div', { class: 'text-center text-sm text-slate-400 mb-3' },
        isCombo ? I18N.t('line.phase', { i: phaseIdx + 1, n: phases.length, name: I18N.t(ROUND_TYPES[phaseType].nameKey) }) : I18N.t(ROUND_TYPES[phaseType].descKey));
      root.appendChild(info);

      const barOuter = Utils.el('div', { class: 'w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4' });
      const barInner = Utils.el('div', { class: 'h-full bg-indigo-500', style: `width:100%;transition:width linear` });
      barOuter.appendChild(barInner);
      if (!doStudy) barOuter.classList.add('invisible');
      root.appendChild(barOuter);

      const cardsRow = Utils.el('div', { class: 'flex flex-wrap justify-center gap-2 mb-6' });
      const cardEls = sequence.map((tok, i) => {
        const front = Utils.el('div', { class: 'flip-face front bg-indigo-500/10 border border-indigo-500/40' }, tokenNode(tok, true));
        const back = Utils.el('div', { class: 'flip-face back bg-slate-800 border border-slate-700' });
        const inner = Utils.el('div', { class: 'flip-inner' }, [front, back]);
        const card = Utils.el('div', { class: `flip-card w-12 h-14 sm:w-14 sm:h-16 ${doStudy ? '' : 'is-hidden'}`, 'data-i': i }, inner);
        cardsRow.appendChild(card);
        return card;
      });
      root.appendChild(cardsRow);

      const keyboardWrap = Utils.el('div', { class: 'grid grid-cols-5 gap-2' });
      root.appendChild(keyboardWrap);
      Utils.refreshIcons();

      if (doStudy) {
        Utils.startBarDrain(barInner, studyTime);
        const studyTimeout = setTimeout(() => {
          cardEls.forEach(c => c.classList.add('is-hidden'));
          setTimeout(() => showKeyboard(), 380);
        }, studyTime);
        state._studyTimeout = studyTimeout;
      } else {
        showKeyboard();
      }

      function showKeyboard() {
        highlightTarget();
        keyboardTokens.forEach(tok => {
          const btn = Utils.el('button', {
            class: 'aspect-square flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 hover:border-indigo-400 active:scale-95 transition text-slate-100',
            onclick: () => handleGuess(tok, btn),
          }, tokenNode(tok, false));
          btn.dataset.id = tok.id;
          keyboardWrap.appendChild(btn);
        });
        Utils.refreshIcons();
      }

      function highlightTarget() {
        cardEls.forEach(c => c.classList.remove('ring-2', 'ring-amber-400'));
        if (askPtr < askOrder.length) {
          cardEls[askOrder[askPtr]].classList.add('ring-2', 'ring-amber-400');
        }
      }

      function handleGuess(tok, btn) {
        if (askPtr >= askOrder.length) return;
        const targetIdx = askOrder[askPtr];
        const correct = sequence[targetIdx].id === tok.id;
        if (correct) {
          revealCard(targetIdx, sequence[targetIdx]);
          state.score += 10 + state.length;
          askPtr++;
          highlightTarget();
          updateHud();
          if (askPtr >= askOrder.length) advancePhase();
        } else {
          state.lives--;
          btn.classList.add('shake');
          setTimeout(() => btn.classList.remove('shake'), 500);
          state.score = Math.max(0, state.score - 5);
          updateHud();
          if (state.lives <= 0) gameOver(state);
        }
      }

      function revealCard(idx, tok) {
        const card = cardEls[idx];
        card.classList.remove('is-hidden');
        const front = card.querySelector('.flip-face.front');
        front.innerHTML = '';
        front.className = 'flip-face front bg-emerald-500/10 border border-emerald-500/50';
        front.appendChild(tokenNode(tok, true));
        Utils.refreshIcons();
      }

      function advancePhase() {
        clearTimeout(state._studyTimeout);
        setTimeout(() => {
          if (phaseIdx + 1 < phases.length) {
            playPhase(state, sequence, phases, phaseIdx + 1, false);
          } else {
            state.round++;
            playRound(state);
          }
        }, 900);
      }

      function useHint() {
        if (state.hints <= 0 || askPtr >= askOrder.length) return;
        state.hints--;
        state.score = Math.max(0, state.score - 15);
        const targetIdx = askOrder[askPtr];
        revealCard(targetIdx, sequence[targetIdx]);
        askPtr++;
        highlightTarget();
        updateHud();
        if (askPtr >= askOrder.length) advancePhase();
      }

      function header() {
        const hud = Utils.el('div', { class: 'flex items-center justify-between mb-4' }, [
          Utils.el('div', { class: 'text-sm font-semibold text-slate-400' }, I18N.t('line.round', { n: state.round })),
          Utils.el('div', { id: 'line-hearts', class: 'flex items-center gap-1' }),
          Utils.el('button', { id: 'line-hint-btn', class: 'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400', onclick: () => useHint() }, [
            Utils.el('i', { 'data-lucide': 'lightbulb', class: 'w-4 h-4' }),
            Utils.el('span', { id: 'line-hint-count' }, String(state.hints)),
          ]),
          Utils.el('span', { id: 'line-score', class: 'text-sm font-bold text-indigo-400' }, I18N.t('common.points', { n: state.score })),
        ]);
        setTimeout(updateHud, 0);
        return hud;
      }

      function updateHud() {
        const hearts = root.querySelector('#line-hearts');
        if (hearts) {
          hearts.innerHTML = '';
          for (let i = 0; i < 3; i++) {
            hearts.appendChild(Utils.el('i', { 'data-lucide': 'heart', class: `w-4 h-4 ${i < state.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-700'}` }));
          }
        }
        const hintCount = root.querySelector('#line-hint-count');
        if (hintCount) hintCount.textContent = String(state.hints);
        const scoreEl = root.querySelector('#line-score');
        if (scoreEl) scoreEl.textContent = I18N.t('common.points', { n: state.score });
        Utils.refreshIcons();
      }
    }

    function gameOver(state) {
      const key = scoreKey(state.levelKey, state.roundType);
      const isBest = Utils.setBest(key, state.score, true);
      Utils.recordResult('line', state.score);
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': 'flag', class: 'w-10 h-10 mx-auto text-slate-500 mb-3' }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t('line.gameOver')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, I18N.t('line.scoreLine', { score: state.score }) + (isBest ? I18N.t('common.newRecord') : '')),
        Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => startGame(state.levelKey, state.roundType, state.length) }, I18N.t('common.playAgain')),
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: onExit }, I18N.t('common.toMenu')),
        ]),
      ]));
      Utils.refreshIcons();
    }
  }

  return { id: 'line', titleKey: 'game.line.title', descKey: 'game.line.desc', icon: 'rows-3', color: 'bg-indigo-500', historyVariants, mount };
})();
