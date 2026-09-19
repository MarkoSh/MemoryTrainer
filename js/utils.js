// Общие утилиты и наборы символов для всех тренажёров
const ICON_POOL = ['star','heart','sun','moon','cloud','umbrella','anchor','bell','book-open','camera',
  'car','cat','coffee','gift','key','leaf','map-pin','music','phone','rocket',
  'scissors','shield','smile','trophy','watch','wifi','zap','flag','gem','flame',
  'snowflake','ghost','bike','fish','house'];

// полный тайский алфавит — все 44 согласные (включая 2 устаревшие: ฃ, ฅ)
const THAI_POOL = [
  { ch: 'ก', tr: 'k' }, { ch: 'ข', tr: 'kh' }, { ch: 'ฃ', tr: 'kh' }, { ch: 'ค', tr: 'kh' },
  { ch: 'ฅ', tr: 'kh' }, { ch: 'ฆ', tr: 'kh' }, { ch: 'ง', tr: 'ng' }, { ch: 'จ', tr: 'ch' },
  { ch: 'ฉ', tr: 'ch' }, { ch: 'ช', tr: 'ch' }, { ch: 'ซ', tr: 's' }, { ch: 'ฌ', tr: 'ch' },
  { ch: 'ญ', tr: 'y' }, { ch: 'ฎ', tr: 'd' }, { ch: 'ฏ', tr: 't' }, { ch: 'ฐ', tr: 'th' },
  { ch: 'ฑ', tr: 'th' }, { ch: 'ฒ', tr: 'th' }, { ch: 'ณ', tr: 'n' }, { ch: 'ด', tr: 'd' },
  { ch: 'ต', tr: 't' }, { ch: 'ถ', tr: 'th' }, { ch: 'ท', tr: 'th' }, { ch: 'ธ', tr: 'th' },
  { ch: 'น', tr: 'n' }, { ch: 'บ', tr: 'b' }, { ch: 'ป', tr: 'p' }, { ch: 'ผ', tr: 'ph' },
  { ch: 'ฝ', tr: 'f' }, { ch: 'พ', tr: 'ph' }, { ch: 'ฟ', tr: 'f' }, { ch: 'ภ', tr: 'ph' },
  { ch: 'ม', tr: 'm' }, { ch: 'ย', tr: 'y' }, { ch: 'ร', tr: 'r' }, { ch: 'ล', tr: 'l' },
  { ch: 'ว', tr: 'w' }, { ch: 'ศ', tr: 's' }, { ch: 'ษ', tr: 's' }, { ch: 'ส', tr: 's' },
  { ch: 'ห', tr: 'h' }, { ch: 'ฬ', tr: 'l' }, { ch: 'อ', tr: 'o' }, { ch: 'ฮ', tr: 'h' },
];

const Utils = (() => {
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // берёт n случайных уникальных элементов из массива
  function sample(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  // localStorage может бросать (напр. недоступное хранилище в WebView) —
  // без защиты это роняет весь обработчик клика на середине игры
  function getBest(key) {
    try { return localStorage.getItem('mt_best_' + key); } catch (e) { return null; }
  }
  function setBest(key, value, higherIsBetter) {
    const cur = getBest(key);
    if (cur == null || (higherIsBetter ? Number(value) > Number(cur) : Number(value) < Number(cur))) {
      try { localStorage.setItem('mt_best_' + key, value); } catch (e) { /* нет хранилища — рекорд просто не сохранится */ }
      return true;
    }
    return false;
  }

  const HISTORY_LIMIT = 30;
  function recordResult(gameId, value) {
    const key = 'mt_hist_' + gameId;
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { hist = []; }
    hist.push({ t: Date.now(), v: value });
    if (hist.length > HISTORY_LIMIT) hist = hist.slice(hist.length - HISTORY_LIMIT);
    try { localStorage.setItem(key, JSON.stringify(hist)); } catch (e) { /* нет хранилища — история просто не сохранится */ }
  }
  function getHistory(gameId) {
    try { return JSON.parse(localStorage.getItem('mt_hist_' + gameId)) || []; } catch (e) { return []; }
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${s}.${String(cs).padStart(2, '0')}с`;
  }

  // запускает CSS-переход полосы прогресса со 100% до 0%; принудительный reflow
  // между сбросом ширины и стартом transition — иначе браузер иногда схлопывает
  // оба изменения в один кадр и полоса скачет к 0% без анимации (заметно через раунд)
  function startBarDrain(el, durationMs) {
    el.style.transitionDuration = '0ms';
    el.style.width = '100%';
    void el.offsetWidth;
    requestAnimationFrame(() => {
      el.style.transitionDuration = durationMs + 'ms';
      el.style.width = '0%';
    });
  }

  // озвучка слов/букв через нативный Web Speech API — без внешних зависимостей
  function speak(text, lang) {
    if (!text || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // обрываем предыдущую фразу, чтобы клики не ставились в очередь
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) { /* Web Speech недоступен — молча игнорируем */ }
  }
  function getVoiceEnabled() { try { return localStorage.getItem('mt_voice_enabled') === '1'; } catch (e) { return false; } }
  function setVoiceEnabled(v) { try { localStorage.setItem('mt_voice_enabled', v ? '1' : '0'); } catch (e) { /* нет хранилища — переключится только на эту сессию */ } }

  // тумблер озвучки — общий для тренажёров со словами/буквами (Строчка, Слова)
  function buildVoiceToggle(onChange) {
    const enabled = getVoiceEnabled();
    const toggleBtn = el('button', {
      class: 'w-full flex items-center justify-between p-3 rounded-md border border-slate-700 bg-slate-800/50',
      onclick: () => { setVoiceEnabled(!enabled); onChange(); },
    }, [
      el('div', { class: 'flex items-center gap-2' }, [
        el('i', { 'data-lucide': 'volume-2', class: 'w-4 h-4 text-slate-400' }),
        el('span', { class: 'text-sm font-semibold text-slate-100' }, I18N.t('common.voice')),
      ]),
      el('span', { class: `w-10 h-6 rounded-full relative transition ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}` },
        el('span', { class: `absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}` })
      ),
    ]);

    const help = el('details', { class: 'mt-1.5 px-1 text-xs text-slate-500' }, [
      el('summary', { class: 'cursor-pointer select-none text-slate-500 hover:text-slate-400 py-1' }, I18N.t('common.voiceHelpTitle')),
      el('div', { class: 'mt-1.5 space-y-1.5 pb-1' }, [
        el('p', {}, I18N.t('common.voiceHelpWindows')),
        el('p', {}, I18N.t('common.voiceHelpMac')),
        el('p', {}, I18N.t('common.voiceHelpIOS')),
        el('p', {}, I18N.t('common.voiceHelpAndroid')),
        el('p', {}, I18N.t('common.voiceHelpLinux')),
        el('p', { class: 'italic' }, I18N.t('common.voiceHelpNote')),
      ]),
    ]);

    return el('div', { class: 'mb-6' }, [toggleBtn, help]);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ icons: window.lucide.icons });
  }

  return { el, shuffle, randInt, sample, getBest, setBest, recordResult, getHistory, fmtTime, refreshIcons, startBarDrain, speak, getVoiceEnabled, setVoiceEnabled, buildVoiceToggle };
})();
