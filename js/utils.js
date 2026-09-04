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

  function getBest(key) {
    return localStorage.getItem('mt_best_' + key);
  }
  function setBest(key, value, higherIsBetter) {
    const cur = getBest(key);
    if (cur == null || (higherIsBetter ? Number(value) > Number(cur) : Number(value) < Number(cur))) {
      localStorage.setItem('mt_best_' + key, value);
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
    localStorage.setItem(key, JSON.stringify(hist));
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

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ icons: window.lucide.icons });
  }

  return { el, shuffle, randInt, sample, getBest, setBest, recordResult, getHistory, fmtTime, refreshIcons, startBarDrain };
})();
