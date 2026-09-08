// Тренажёр "Слова" — запоминание и воспроизведение набора слов (англ./тайск.)
// Транскрипция тайского — упрощённая RTGS (официальная система романизации Таиланда).
const GameWords = (() => {
  const WORD_PAIRS = [
    // местоимения
    { en: 'I', th: 'ฉัน', tr: 'chan' }, { en: 'you', th: 'คุณ', tr: 'khun' },
    { en: 'he', th: 'เขา', tr: 'khao' }, { en: 'she', th: 'เธอ', tr: 'thoe' },
    { en: 'we', th: 'เรา', tr: 'rao' }, { en: 'they', th: 'พวกเขา', tr: 'phuak khao' },
    { en: 'it', th: 'มัน', tr: 'man' },
    // вопросительные слова
    { en: 'what', th: 'อะไร', tr: 'a rai' }, { en: 'who', th: 'ใคร', tr: 'khrai' },
    { en: 'where', th: 'ที่ไหน', tr: 'thii nai' }, { en: 'when', th: 'เมื่อไหร่', tr: 'muea rai' },
    { en: 'why', th: 'ทำไม', tr: 'tham mai' }, { en: 'how', th: 'ยังไง', tr: 'yang ngai' },
    { en: 'which', th: 'ไหน', tr: 'nai' },
    // да/нет/вежливость
    { en: 'yes', th: 'ใช่', tr: 'chai' }, { en: 'no', th: 'ไม่', tr: 'mai' },
    { en: 'please', th: 'ขอ', tr: 'kho' }, { en: 'thanks', th: 'ขอบคุณ', tr: 'khop khun' },
    { en: 'sorry', th: 'ขอโทษ', tr: 'kho thot' },
    // числа
    { en: 'one', th: 'หนึ่ง', tr: 'nueng' }, { en: 'two', th: 'สอง', tr: 'song' },
    { en: 'three', th: 'สาม', tr: 'saam' }, { en: 'four', th: 'สี่', tr: 'sii' },
    { en: 'five', th: 'ห้า', tr: 'haa' }, { en: 'six', th: 'หก', tr: 'hok' },
    { en: 'seven', th: 'เจ็ด', tr: 'chet' }, { en: 'eight', th: 'แปด', tr: 'paet' },
    { en: 'nine', th: 'เก้า', tr: 'kao' }, { en: 'ten', th: 'สิบ', tr: 'sip' },
    // время
    { en: 'day', th: 'วัน', tr: 'wan' }, { en: 'night', th: 'คืน', tr: 'khuen' },
    { en: 'time', th: 'เวลา', tr: 'we laa' }, { en: 'year', th: 'ปี', tr: 'pii' },
    { en: 'now', th: 'ตอนนี้', tr: 'ton nii' }, { en: 'today', th: 'วันนี้', tr: 'wan nii' },
    { en: 'tomorrow', th: 'พรุ่งนี้', tr: 'phrung nii' },
    // глаголы
    { en: 'go', th: 'ไป', tr: 'pai' }, { en: 'come', th: 'มา', tr: 'maa' },
    { en: 'eat', th: 'กิน', tr: 'kin' }, { en: 'drink', th: 'ดื่ม', tr: 'duem' },
    { en: 'see', th: 'เห็น', tr: 'hen' }, { en: 'look', th: 'ดู', tr: 'duu' },
    { en: 'know', th: 'รู้', tr: 'ruu' }, { en: 'like', th: 'ชอบ', tr: 'chop' },
    { en: 'love', th: 'รัก', tr: 'rak' }, { en: 'want', th: 'อยาก', tr: 'yaak' },
    { en: 'have', th: 'มี', tr: 'mii' }, { en: 'do', th: 'ทำ', tr: 'tham' },
    { en: 'say', th: 'พูด', tr: 'phuut' }, { en: 'give', th: 'ให้', tr: 'hai' },
    { en: 'take', th: 'เอา', tr: 'ao' }, { en: 'buy', th: 'ซื้อ', tr: 'sue' },
    { en: 'sell', th: 'ขาย', tr: 'khaai' }, { en: 'work', th: 'ทำงาน', tr: 'tham ngaan' },
    { en: 'sleep', th: 'นอน', tr: 'non' }, { en: 'walk', th: 'เดิน', tr: 'doen' },
    { en: 'run', th: 'วิ่ง', tr: 'wing' }, { en: 'sit', th: 'นั่ง', tr: 'nang' },
    { en: 'stand', th: 'ยืน', tr: 'yuen' }, { en: 'open', th: 'เปิด', tr: 'poet' },
    { en: 'close', th: 'ปิด', tr: 'pit' }, { en: 'read', th: 'อ่าน', tr: 'aan' },
    { en: 'write', th: 'เขียน', tr: 'khian' }, { en: 'talk', th: 'คุย', tr: 'khui' },
    { en: 'listen', th: 'ฟัง', tr: 'fang' }, { en: 'play', th: 'เล่น', tr: 'len' },
    { en: 'help', th: 'ช่วย', tr: 'chuai' }, { en: 'wait', th: 'รอ', tr: 'ro' },
    { en: 'stop', th: 'หยุด', tr: 'yut' }, { en: 'start', th: 'เริ่ม', tr: 'roem' },
    { en: 'finish', th: 'เสร็จ', tr: 'set' }, { en: 'live', th: 'อยู่', tr: 'yuu' },
    { en: 'think', th: 'คิด', tr: 'khit' }, { en: 'understand', th: 'เข้าใจ', tr: 'khao jai' },
    { en: 'remember', th: 'จำ', tr: 'cham' }, { en: 'forget', th: 'ลืม', tr: 'luem' },
    { en: 'learn', th: 'เรียน', tr: 'rian' }, { en: 'teach', th: 'สอน', tr: 'son' },
    // существительные
    { en: 'water', th: 'น้ำ', tr: 'naam' }, { en: 'food', th: 'อาหาร', tr: 'aa haan' },
    { en: 'rice', th: 'ข้าว', tr: 'khaao' }, { en: 'house', th: 'บ้าน', tr: 'baan' },
    { en: 'school', th: 'โรงเรียน', tr: 'rong rian' }, { en: 'book', th: 'หนังสือ', tr: 'nang sue' },
    { en: 'money', th: 'เงิน', tr: 'ngoen' }, { en: 'friend', th: 'เพื่อน', tr: 'phuean' },
    { en: 'family', th: 'ครอบครัว', tr: 'khrop khrua' }, { en: 'mother', th: 'แม่', tr: 'mae' },
    { en: 'father', th: 'พ่อ', tr: 'pho' }, { en: 'child', th: 'เด็ก', tr: 'dek' },
    { en: 'name', th: 'ชื่อ', tr: 'chue' }, { en: 'dog', th: 'หมา', tr: 'maa' },
    { en: 'cat', th: 'แมว', tr: 'maeo' }, { en: 'car', th: 'รถ', tr: 'rot' },
    { en: 'road', th: 'ถนน', tr: 'tha non' }, { en: 'city', th: 'เมือง', tr: 'mueang' },
    { en: 'country', th: 'ประเทศ', tr: 'pra thet' }, { en: 'world', th: 'โลก', tr: 'lok' },
    { en: 'moon', th: 'ดวงจันทร์', tr: 'duang chan' }, { en: 'star', th: 'ดาว', tr: 'daao' },
    { en: 'sky', th: 'ฟ้า', tr: 'faa' }, { en: 'rain', th: 'ฝน', tr: 'fon' },
    { en: 'fire', th: 'ไฟ', tr: 'fai' }, { en: 'tree', th: 'ต้นไม้', tr: 'ton mai' },
    { en: 'flower', th: 'ดอกไม้', tr: 'dok mai' }, { en: 'color', th: 'สี', tr: 'sii' },
    { en: 'heart', th: 'หัวใจ', tr: 'hua jai' }, { en: 'head', th: 'หัว', tr: 'hua' },
    { en: 'hand', th: 'มือ', tr: 'mue' }, { en: 'eye', th: 'ตา', tr: 'taa' },
    // прилагательные
    { en: 'good', th: 'ดี', tr: 'dii' }, { en: 'bad', th: 'แย่', tr: 'yae' },
    { en: 'big', th: 'ใหญ่', tr: 'yai' }, { en: 'small', th: 'เล็ก', tr: 'lek' },
    { en: 'new', th: 'ใหม่', tr: 'mai' }, { en: 'old', th: 'เก่า', tr: 'kao' },
    { en: 'hot', th: 'ร้อน', tr: 'ron' }, { en: 'cold', th: 'หนาว', tr: 'naao' },
    { en: 'happy', th: 'ดีใจ', tr: 'dii jai' }, { en: 'sad', th: 'เศร้า', tr: 'sao' },
    { en: 'beautiful', th: 'สวย', tr: 'suai' }, { en: 'easy', th: 'ง่าย', tr: 'ngaai' },
    { en: 'difficult', th: 'ยาก', tr: 'yaak' }, { en: 'fast', th: 'เร็ว', tr: 'reo' },
    { en: 'slow', th: 'ช้า', tr: 'chaa' }, { en: 'near', th: 'ใกล้', tr: 'klai' },
    { en: 'far', th: 'ไกล', tr: 'klai' },
    // прочее короткое и частое
    { en: 'here', th: 'ที่นี่', tr: 'thii nii' }, { en: 'there', th: 'ที่นั่น', tr: 'thii nan' },
    { en: 'more', th: 'อีก', tr: 'iik' }, { en: 'all', th: 'ทั้งหมด', tr: 'thang mot' },
    { en: 'very', th: 'มาก', tr: 'maak' },
  ];

  const LEVELS = {
    en: { nameKey: 'words.setEn', pool: WORD_PAIRS.map(w => ({ id: 'en_' + w.en, main: w.en, sub: `${w.th} · ${w.tr}`, thai: false })) },
    th: { nameKey: 'words.setTh', pool: WORD_PAIRS.map(w => ({ id: 'th_' + w.th, main: w.th, sub: `${w.tr} · ${w.en}`, thai: true })) },
  };

  const ROUND_TYPES = {
    forward: { nameKey: 'words.roundForward', descKey: 'words.roundForwardDesc' },
    reverse: { nameKey: 'words.roundReverse', descKey: 'words.roundReverseDesc' },
    guess: { nameKey: 'words.roundGuess', descKey: 'words.roundGuessDesc' },
    combo: { nameKey: 'words.roundCombo', descKey: 'words.roundComboDesc' },
  };

  const LENGTHS = [3, 4, 5, 6, 7, 8];

  function phasesFor(roundType) {
    return roundType === 'combo' ? ['forward', 'reverse', 'guess'] : [roundType];
  }

  function historyVariants() {
    const arr = [];
    Object.entries(LEVELS).forEach(([lk, lv]) => {
      Object.entries(ROUND_TYPES).forEach(([rk, rt]) => {
        arr.push({ key: `words_${lk}_${rk}`, label: `${I18N.t(lv.nameKey)} · ${I18N.t(rt.nameKey)}` });
      });
    });
    return arr;
  }

  // карточки — не фиксированного размера (слова разной длины), поэтому вместо
  // 3D-переворота используется простая смена контента с pop-in анимацией
  function maybeSpeak(token) {
    if (!Utils.getVoiceEnabled() || !token) return;
    Utils.speak(token.main, token.thai ? 'th-TH' : 'en-US');
  }

  function renderCard(cardEl, token, variant) {
    cardEl.dataset.variant = variant;
    cardEl.classList.remove('pop-in');
    if (variant === 'hidden') {
      cardEl.className = 'min-w-[52px] h-14 sm:h-16 px-2 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-600 font-bold';
      cardEl.textContent = '?';
    } else {
      const tint = variant === 'revealed' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-indigo-500/40 bg-indigo-500/10';
      cardEl.className = `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-h-14 sm:min-h-16 rounded-md border ${tint}`;
      cardEl.innerHTML = '';
      cardEl.appendChild(Utils.el('span', { class: `${token.thai ? 'thai' : ''} font-bold text-sm sm:text-base text-slate-100 whitespace-nowrap` }, token.main));
      cardEl.appendChild(Utils.el('span', { class: 'text-[9px] text-slate-500 whitespace-nowrap' }, token.sub));
    }
    // принудительный reflow, чтобы pop-in анимация перезапускалась при каждом вызове,
    // а не оставалась "уже применённой" с точки зрения браузера
    void cardEl.offsetWidth;
    cardEl.classList.add('pop-in');
  }

  function keyboardButton(token, onClick) {
    const btn = Utils.el('button', {
      class: 'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:border-indigo-400 active:scale-95 transition',
      onclick: onClick,
    }, [
      Utils.el('span', { class: `${token.thai ? 'thai' : ''} font-bold text-sm text-slate-100 whitespace-nowrap` }, token.main),
      Utils.el('span', { class: 'text-[8px] text-slate-500 whitespace-nowrap' }, token.sub),
    ]);
    btn.dataset.id = token.id;
    return btn;
  }

  function mount(root, onExit) {
    let langKey = 'en';
    let roundType = 'forward';
    let length = 4;

    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'mb-5' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('words.language')),
        Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, Object.entries(LEVELS).map(([key, lv]) =>
          Utils.el('button', {
            class: `p-3 rounded-md border text-left transition ${langKey === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}`,
            onclick: () => { langKey = key; renderSetup(); },
          }, [Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t(lv.nameKey)), Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t('words.wordsInSet', { n: lv.pool.length }))])
        )),
      ]));
      root.appendChild(Utils.el('div', { class: 'mb-5' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('words.wordCount')),
        Utils.el('div', { class: 'grid grid-cols-3 gap-2' }, LENGTHS.map(n =>
          Utils.el('button', {
            class: `py-2 rounded-md border font-bold transition ${length === n ? 'border-indigo-500 bg-indigo-500/10 text-slate-100' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`,
            onclick: () => { length = n; renderSetup(); },
          }, String(n))
        )),
      ]));
      root.appendChild(Utils.el('div', { class: 'mb-6' }, [
        Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('words.roundType')),
        Utils.el('div', { class: 'grid grid-cols-1 gap-2' }, Object.entries(ROUND_TYPES).map(([key, rt]) =>
          Utils.el('button', {
            class: `p-3 rounded-md border text-left transition ${roundType === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}`,
            onclick: () => { roundType = key; renderSetup(); },
          }, [Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t(rt.nameKey)), Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t(rt.descKey))])
        )),
      ]));
      root.appendChild(Utils.buildVoiceToggle(renderSetup));
      root.appendChild(Utils.el('button', {
        class: 'w-full py-3 rounded-md bg-indigo-500 text-white font-bold hover:bg-indigo-400 active:scale-[.98] transition',
        onclick: () => startGame(langKey, roundType, length),
      }, I18N.t('words.start')));
      Utils.refreshIcons();
    }

    function startGame(langKey, roundType, length) {
      const state = {
        langKey, roundType,
        pool: LEVELS[langKey].pool,
        length,
        score: 0,
        lives: 3,
        hints: 3,
        round: 1,
      };
      playRound(state);
    }

    function scoreKey(langKey, roundType) { return `words_${langKey}_${roundType}`; }

    function playRound(state) {
      const sequence = Utils.sample(state.pool, state.length);
      const phases = phasesFor(state.roundType);
      playPhase(state, sequence, phases, 0, true);
    }

    function playPhase(state, sequence, phases, phaseIdx, doStudy) {
      const phaseType = phases[phaseIdx];
      const noiseCount = Math.min(state.pool.length - state.length, 4 + Math.floor(state.length / 2));
      const noise = Utils.sample(state.pool.filter(t => !sequence.includes(t)), Math.max(0, noiseCount));
      const keyboardTokens = Utils.shuffle([...sequence, ...noise]);

      let askOrder;
      if (phaseType === 'forward') askOrder = sequence.map((_, i) => i);
      else if (phaseType === 'reverse') askOrder = sequence.map((_, i) => i).reverse();
      else askOrder = [Utils.randInt(0, sequence.length - 1)];

      let askPtr = 0;
      const studyTime = 1400 + state.length * 1300;

      root.innerHTML = '';
      root.appendChild(header());

      const isCombo = phases.length > 1;
      const info = Utils.el('div', { class: 'text-center text-sm text-slate-400 mb-3' },
        isCombo ? I18N.t('words.phase', { i: phaseIdx + 1, n: phases.length, name: I18N.t(ROUND_TYPES[phaseType].nameKey) }) : I18N.t(ROUND_TYPES[phaseType].descKey));
      root.appendChild(info);

      const barOuter = Utils.el('div', { class: 'w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4' });
      const barInner = Utils.el('div', { class: 'h-full bg-indigo-500', style: 'width:100%;transition:width linear' });
      barOuter.appendChild(barInner);
      if (!doStudy) barOuter.classList.add('invisible');
      root.appendChild(barOuter);

      const cardsRow = Utils.el('div', { class: 'flex flex-wrap justify-center gap-2 mb-6' });
      const cardEls = sequence.map((tok, i) => {
        const card = Utils.el('div', { 'data-i': i });
        renderCard(card, tok, doStudy ? 'study' : 'hidden');
        card.addEventListener('click', () => { if (card.dataset.variant !== 'hidden') maybeSpeak(tok); });
        cardsRow.appendChild(card);
        return card;
      });
      root.appendChild(cardsRow);

      const keyboardWrap = Utils.el('div', { class: 'flex flex-wrap gap-2 justify-center' });
      root.appendChild(keyboardWrap);
      Utils.refreshIcons();

      if (doStudy) {
        Utils.startBarDrain(barInner, studyTime);
        const studyTimeout = setTimeout(() => {
          cardEls.forEach(c => renderCard(c, null, 'hidden'));
          setTimeout(() => showKeyboard(), 200);
        }, studyTime);
        state._studyTimeout = studyTimeout;
      } else {
        showKeyboard();
      }

      function showKeyboard() {
        highlightTarget();
        keyboardTokens.forEach(tok => keyboardWrap.appendChild(keyboardButton(tok, (e) => { maybeSpeak(tok); handleGuess(tok, e.currentTarget); })));
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
          renderCard(cardEls[targetIdx], sequence[targetIdx], 'revealed');
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
        renderCard(cardEls[targetIdx], sequence[targetIdx], 'revealed');
        askPtr++;
        highlightTarget();
        updateHud();
        if (askPtr >= askOrder.length) advancePhase();
      }

      function header() {
        const hud = Utils.el('div', { class: 'flex items-center justify-between mb-4' }, [
          Utils.el('div', { class: 'text-sm font-semibold text-slate-400' }, I18N.t('words.round', { n: state.round })),
          Utils.el('div', { id: 'words-hearts', class: 'flex items-center gap-1' }),
          Utils.el('button', { id: 'words-hint-btn', class: 'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400', onclick: () => useHint() }, [
            Utils.el('i', { 'data-lucide': 'lightbulb', class: 'w-4 h-4' }),
            Utils.el('span', { id: 'words-hint-count' }, String(state.hints)),
          ]),
          Utils.el('span', { id: 'words-score', class: 'text-sm font-bold text-indigo-400' }, I18N.t('common.points', { n: state.score })),
        ]);
        setTimeout(updateHud, 0);
        return hud;
      }

      function updateHud() {
        const hearts = root.querySelector('#words-hearts');
        if (hearts) {
          hearts.innerHTML = '';
          for (let i = 0; i < 3; i++) {
            hearts.appendChild(Utils.el('i', { 'data-lucide': 'heart', class: `w-4 h-4 ${i < state.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-700'}` }));
          }
        }
        const hintCount = root.querySelector('#words-hint-count');
        if (hintCount) hintCount.textContent = String(state.hints);
        const scoreEl = root.querySelector('#words-score');
        if (scoreEl) scoreEl.textContent = I18N.t('common.points', { n: state.score });
        Utils.refreshIcons();
      }
    }

    function gameOver(state) {
      const key = scoreKey(state.langKey, state.roundType);
      const isBest = Utils.setBest(key, state.score, true);
      Utils.recordResult(key, state.score);
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-10' }, [
        Utils.el('i', { 'data-lucide': 'flag', class: 'w-10 h-10 mx-auto text-slate-500 mb-3' }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t('words.gameOver')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, I18N.t('words.scoreLine', { score: state.score }) + (isBest ? I18N.t('common.newRecord') : '')),
        Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => startGame(state.langKey, state.roundType, state.length) }, I18N.t('common.playAgain')),
          Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: onExit }, I18N.t('common.toMenu')),
        ]),
      ]));
      Utils.refreshIcons();
    }
  }

  return { id: 'words', titleKey: 'game.words.title', descKey: 'game.words.desc', icon: 'languages', color: 'bg-cyan-500', historyVariants, mount };
})();
