// Тренажёр "Скорочтение" — метод Spritz (RSVP): слова показываются по одному
// в фиксированной точке экрана, с "оптимальной точкой распознавания" (ORP) —
// одна буква слова всегда выровнена по центру, чтобы глаз не двигался.
const GameSpeedRead = (() => {
  const MIN_WPM = 100, MAX_WPM = 900, STEP_WPM = 25, DEFAULT_WPM = 300;

  // эвристика ORP: чем длиннее слово, тем дальше от начала фиксируемая буква
  function pivotIndex(len) {
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return 4;
  }

  // ponytail: линейная надбавка за длину/пунктуацию — грубое приближение к
  // реальному тайминг-движку Spritz, но покрывает главный эффект (длинные
  // слова и концы предложений требуют больше времени на осмысление)
  function msForWord(word, wpm) {
    const base = 60000 / wpm;
    let ms = base;
    if (word.length > 6) ms += base * 0.04 * (word.length - 6);
    if (/[.!?]$/.test(word)) ms += base * 0.8;
    else if (/[,;:—]$/.test(word)) ms += base * 0.4;
    return ms;
  }

  function mount(root, onExit) {
    const state = { words: [], fileName: '', idx: 0, wpm: DEFAULT_WPM, playing: false, bookmark: null, timer: null };

    renderSetup();

    function renderSetup() {
      clearTimeout(state.timer);
      root.innerHTML = '';
      const input = Utils.el('input', {
        type: 'file', accept: '.txt,text/plain', class: 'hidden',
        onchange: async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const text = await file.text();
          const words = text.trim().split(/\s+/).filter(Boolean);
          if (!words.length) { alert(I18N.t('speedread.emptyFile')); return; }
          state.words = words;
          state.fileName = file.name;
          state.idx = 0;
          state.bookmark = null;
          renderReader();
        },
      });
      root.appendChild(input);
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': 'file-text', class: 'w-10 h-10 mx-auto text-slate-500 mb-3' }),
        Utils.el('div', { class: 'text-slate-400 mb-5' }, I18N.t('speedread.chooseFile')),
        Utils.el('button', {
          class: 'px-5 py-3 rounded-md bg-indigo-500 text-white font-bold hover:bg-indigo-400 active:scale-[.98] transition',
          onclick: () => input.click(),
        }, I18N.t('speedread.chooseFileBtn')),
      ]));
      Utils.refreshIcons();
    }

    function renderReader() {
      root.innerHTML = '';

      const header = Utils.el('div', { class: 'flex items-center justify-between mb-4 gap-2' }, [
        Utils.el('div', { class: 'text-sm text-slate-400 truncate' }, state.fileName),
        Utils.el('button', {
          class: 'shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700',
          onclick: renderSetup,
        }, [Utils.el('i', { 'data-lucide': 'file-x', class: 'w-4 h-4' }), I18N.t('speedread.changeFile')]),
      ]);

      const progressLabel = Utils.el('div', { class: 'text-center text-xs text-slate-500 mb-1' });
      const barOuter = Utils.el('div', { class: 'w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4' });
      const barInner = Utils.el('div', { class: 'h-full bg-indigo-500', style: 'width:0%' });
      barOuter.appendChild(barInner);

      const pivotEl = Utils.el('span', { class: 'spritz-pivot' });
      const leftEl = Utils.el('span', { class: 'spritz-left' });
      const rightEl = Utils.el('span', { class: 'spritz-right' });
      const stage = Utils.el('div', { class: 'spritz-stage mb-4' }, [
        Utils.el('div', { class: 'spritz-tick top' }),
        Utils.el('div', { class: 'spritz-word' }, [leftEl, pivotEl, rightEl]),
        Utils.el('div', { class: 'spritz-tick bottom' }),
      ]);

      const wpmLabel = Utils.el('span', { class: 'font-bold text-slate-100' }, String(state.wpm));
      const speedRow = Utils.el('div', { class: 'flex items-center gap-3 mb-5' }, [
        Utils.el('button', {
          class: 'w-9 h-9 shrink-0 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:border-indigo-400',
          onclick: () => setWpm(state.wpm - STEP_WPM),
        }, '−'),
        Utils.el('div', { class: 'flex-1 text-center text-sm text-slate-400' }, [I18N.t('speedread.speedLabel') + ' ', wpmLabel, ' ' + I18N.t('speedread.wpmUnit')]),
        Utils.el('button', {
          class: 'w-9 h-9 shrink-0 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:border-indigo-400',
          onclick: () => setWpm(state.wpm + STEP_WPM),
        }, '+'),
      ]);
      const slider = Utils.el('input', {
        type: 'range', min: MIN_WPM, max: MAX_WPM, step: STEP_WPM, value: state.wpm,
        class: 'w-full mb-6 accent-indigo-500',
        oninput: (e) => setWpm(Number(e.target.value)),
      });

      const toggleBtn = Utils.el('button', {
        class: 'w-full py-3 rounded-md bg-indigo-500 text-white font-bold hover:bg-indigo-400 active:scale-[.98] transition flex items-center justify-center gap-2',
        onclick: toggle,
      });
      const primaryRow = Utils.el('div', { class: 'mb-2' }, [toggleBtn]);

      const toStartBtn = Utils.el('button', {
        class: 'py-2.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:border-indigo-400 flex items-center justify-center gap-1.5',
        onclick: toBeginning,
      }, [Utils.el('i', { 'data-lucide': 'rotate-ccw', class: 'w-4 h-4' }), I18N.t('speedread.toStart')]);
      const bookmarkBtn = Utils.el('button', {
        class: 'py-2.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:border-indigo-400 flex items-center justify-center gap-1.5',
        onclick: setBookmark,
      }, [Utils.el('i', { 'data-lucide': 'bookmark', class: 'w-4 h-4' }), I18N.t('speedread.bookmark')]);
      const toBookmarkBtn = Utils.el('button', {
        class: 'py-2.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:border-indigo-400 flex items-center justify-center gap-1.5 disabled:opacity-40',
        onclick: goToBookmark,
      }, [Utils.el('i', { 'data-lucide': 'bookmark-check', class: 'w-4 h-4' }), I18N.t('speedread.toBookmark')]);
      const secondaryRow = Utils.el('div', { class: 'grid grid-cols-3 gap-2' }, [toStartBtn, bookmarkBtn, toBookmarkBtn]);

      root.appendChild(header);
      root.appendChild(progressLabel);
      root.appendChild(barOuter);
      root.appendChild(stage);
      root.appendChild(speedRow);
      root.appendChild(slider);
      root.appendChild(primaryRow);
      root.appendChild(secondaryRow);
      Utils.refreshIcons();

      function setWpm(v) {
        state.wpm = Math.min(MAX_WPM, Math.max(MIN_WPM, v));
        wpmLabel.textContent = String(state.wpm);
        slider.value = state.wpm;
      }

      function updateWord() {
        const word = state.words[state.idx] || '';
        const pIdx = Math.min(pivotIndex(word.length), Math.max(0, word.length - 1));
        leftEl.textContent = word.slice(0, pIdx);
        pivotEl.textContent = word[pIdx] || '';
        rightEl.textContent = word.slice(pIdx + 1);
        progressLabel.textContent = I18N.t('speedread.progress', { i: state.idx + 1, n: state.words.length });
        barInner.style.width = `${(state.idx / Math.max(1, state.words.length - 1)) * 100}%`;
        toBookmarkBtn.disabled = state.bookmark == null;
      }

      function updateToggleBtn() {
        toggleBtn.innerHTML = '';
        toggleBtn.appendChild(Utils.el('i', { 'data-lucide': state.playing ? 'pause' : 'play', class: 'w-5 h-5' }));
        toggleBtn.append(state.playing ? I18N.t('speedread.pause') : I18N.t('speedread.start'));
        Utils.refreshIcons();
      }

      function scheduleTick() {
        const word = state.words[state.idx];
        state.timer = setTimeout(advance, msForWord(word, state.wpm));
      }

      function advance() {
        if (state.idx >= state.words.length - 1) { pause(); return; }
        state.idx++;
        updateWord();
        scheduleTick();
      }

      function play() {
        if (state.playing || !state.words.length) return;
        if (state.idx >= state.words.length - 1) state.idx = 0;
        state.playing = true;
        updateToggleBtn();
        updateWord();
        scheduleTick();
      }

      function pause() {
        state.playing = false;
        clearTimeout(state.timer);
        updateToggleBtn();
      }

      function toggle() {
        if (state.playing) pause(); else play();
      }

      function toBeginning() {
        pause();
        state.idx = 0;
        updateWord();
      }

      function setBookmark() {
        state.bookmark = state.idx;
        updateWord();
      }

      function goToBookmark() {
        if (state.bookmark == null) return;
        pause();
        state.idx = state.bookmark;
        updateWord();
      }

      updateWord();
      updateToggleBtn();
      registerSpaceToggle(stage, toggle);
    }
  }

  // пробел переключает старт/паузу, пока экран чтения виден; слушатель
  // само-снимается при первом же пробеле после того, как экран закрыт
  // (root пересоздаётся при переходе в меню/настройки — своего unmount-хука нет)
  function registerSpaceToggle(stage, toggle) {
    document.addEventListener('keydown', function onKeydown(e) {
      if (!stage.isConnected) { document.removeEventListener('keydown', onKeydown); return; }
      if (e.code !== 'Space') return;
      e.preventDefault();
      toggle();
    });
  }

  return { id: 'speedread', titleKey: 'game.speedread.title', descKey: 'game.speedread.desc', icon: 'zap', color: 'bg-violet-500', mount };
})();
