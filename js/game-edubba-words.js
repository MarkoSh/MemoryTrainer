// Тренажёр "Эдуба: слова" — тематические блоки, как в лексических списках шумерских писцов:
// сначала всё близкое и конкретное (тело, семья, животные), в конце — действия.
// Каждый блок сдаётся целиком (см. edubba.js), прежде чем откроется следующий.
// Слово: [английский, тайский, транскрипция тайского (RTGS-подобная, долгие a/i/u удвоены)].
const GameEdubba = (() => {
  const CATEGORIES = [
    { id: 'body', words: [['head', 'หัว', 'hua'], ['hair', 'ผม', 'phom'], ['face', 'หน้า', 'naa'], ['eye', 'ตา', 'taa'],
      ['ear', 'หู', 'huu'], ['nose', 'จมูก', 'chamuuk'], ['mouth', 'ปาก', 'paak'], ['hand', 'มือ', 'mue']] },
    { id: 'family', words: [['mother', 'แม่', 'mae'], ['father', 'พ่อ', 'pho'], ['son', 'ลูกชาย', 'luuk chaai'], ['daughter', 'ลูกสาว', 'luuk saao'],
      ['friend', 'เพื่อน', 'phuean'], ['family', 'ครอบครัว', 'khrop khrua'], ['man', 'ผู้ชาย', 'phuu chaai'], ['woman', 'ผู้หญิง', 'phuu ying']] },
    { id: 'animals', words: [['dog', 'หมา', 'maa'], ['cat', 'แมว', 'maeo'], ['bird', 'นก', 'nok'], ['fish', 'ปลา', 'plaa'],
      ['cow', 'วัว', 'wua'], ['pig', 'หมู', 'muu'], ['elephant', 'ช้าง', 'chaang'], ['chicken', 'ไก่', 'kai']] },
    { id: 'food', words: [['water', 'น้ำ', 'naam'], ['rice', 'ข้าว', 'khaao'], ['egg', 'ไข่', 'khai'], ['milk', 'นม', 'nom'],
      ['tea', 'ชา', 'chaa'], ['coffee', 'กาแฟ', 'kaa fae'], ['salt', 'เกลือ', 'kluea'], ['fruit', 'ผลไม้', 'phon la mai']] },
    { id: 'numbers', words: [['one', 'หนึ่ง', 'nueng'], ['two', 'สอง', 'song'], ['three', 'สาม', 'saam'], ['four', 'สี่', 'sii'], ['five', 'ห้า', 'haa'],
      ['six', 'หก', 'hok'], ['seven', 'เจ็ด', 'chet'], ['eight', 'แปด', 'paet'], ['nine', 'เก้า', 'kao'], ['ten', 'สิบ', 'sip']] },
    { id: 'time', words: [['day', 'วัน', 'wan'], ['night', 'คืน', 'khuen'], ['morning', 'เช้า', 'chaao'], ['evening', 'เย็น', 'yen'],
      ['week', 'สัปดาห์', 'sap daa'], ['month', 'เดือน', 'duean'], ['year', 'ปี', 'pii'], ['yesterday', 'เมื่อวาน', 'muea waan']] },
    { id: 'nature', words: [['sky', 'ฟ้า', 'faa'], ['rain', 'ฝน', 'fon'], ['wind', 'ลม', 'lom'], ['fire', 'ไฟ', 'fai'],
      ['tree', 'ต้นไม้', 'ton mai'], ['flower', 'ดอกไม้', 'dok mai'], ['river', 'แม่น้ำ', 'mae naam'], ['sea', 'ทะเล', 'tha le']] },
    { id: 'home', words: [['house', 'บ้าน', 'baan'], ['door', 'ประตู', 'pra tuu'], ['window', 'หน้าต่าง', 'naa tang'], ['table', 'โต๊ะ', 'to'],
      ['chair', 'เก้าอี้', 'kao ii'], ['bed', 'เตียง', 'tiang'], ['book', 'หนังสือ', 'nang sue'], ['key', 'กุญแจ', 'kun chae']] },
    { id: 'people', words: [['scribe', 'เสมียน', 'sa mian'], ['teacher', 'ครู', 'khruu'], ['student', 'นักเรียน', 'nak rian'], ['doctor', 'หมอ', 'mo'],
      ['farmer', 'ชาวนา', 'chaao naa'], ['cook', 'พ่อครัว', 'pho khrua'], ['police', 'ตำรวจ', 'tam ruat'], ['king', 'กษัตริย์', 'ka sat']] },
    { id: 'actions', words: [['eat', 'กิน', 'kin'], ['drink', 'ดื่ม', 'duem'], ['go', 'ไป', 'pai'], ['come', 'มา', 'maa'],
      ['sleep', 'นอน', 'non'], ['read', 'อ่าน', 'aan'], ['write', 'เขียน', 'khian'], ['speak', 'พูด', 'phuut']] },
  ];

  // режимы независимы: слова двух языков в одной сессии не смешиваются
  const MODES = {
    en: { nameKey: 'edubba.modeEn', thai: false, lang: 'en-US', main: w => w[0], sub: w => `${w[1]} · ${w[2]}` },
    th: { nameKey: 'edubba.modeTh', thai: true, lang: 'th-TH', main: w => w[1], sub: w => `${w[2]} · ${w[0]}` },
  };

  // лишние плитки-"помехи" по фазам: копирование почти без них, проверка — с запасом
  const EXTRA_TILES = { copy: 2, recall: 4, exam: 6 };
  // кластер = буква + её надстрочные/подстрочные знаки (тайские гласные и тоны), чтобы плитка была читаемой
  const CLUSTER = /\P{M}\p{M}*/gu;

  function makeItem(mode, w) {
    const m = MODES[mode];
    return { id: mode + '_' + w[0], answer: m.main(w), main: m.main(w), sub: m.sub(w), thai: m.thai };
  }

  function modelNode(item) {
    return Utils.el('div', { class: 'pop-in text-center p-4 rounded-md border border-indigo-500/40 bg-indigo-500/10' }, [
      Utils.el('div', { class: `${item.thai ? 'thai' : ''} text-3xl font-extrabold text-slate-100` }, item.main),
      Utils.el('div', { class: 'thai text-sm text-slate-400 mt-1' }, item.sub),
    ]);
  }

  function promptNode(item) {
    return Utils.el('div', { class: 'text-center p-4 rounded-md border border-slate-700 bg-slate-800/50' }, [
      Utils.el('div', { class: 'thai text-xl font-bold text-slate-100' }, item.sub),
      Utils.el('div', { class: 'text-2xl text-slate-600 mt-1' }, '?'),
    ]);
  }

  // слово собирается из плиток: и для латиницы, и для тайского работает без экранной клавиатуры
  function tilesInput(answer, extra, pool, submit, thai) {
    const chars = answer.match(CLUSTER);
    const tiles = Utils.shuffle([...chars, ...Utils.sample(pool.filter(c => !chars.includes(c)), extra)]);
    let picked = [];
    const line = Utils.el('div', { class: `${thai ? 'thai' : ''} min-h-[3.5rem] flex flex-wrap items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-900 p-2 mb-3 text-2xl font-bold text-slate-100` });
    const bank = Utils.el('div', { class: 'flex flex-wrap justify-center gap-2' });
    const node = Utils.el('div', {}, [line, bank]);

    function draw() {
      line.innerHTML = '';
      picked.forEach(i => line.appendChild(Utils.el('span', {}, tiles[i])));
      bank.innerHTML = '';
      tiles.forEach((t, i) => bank.appendChild(Utils.el('button', {
        class: `${thai ? 'thai' : ''} min-w-[44px] h-12 px-3 rounded-md border border-slate-700 bg-slate-800 text-xl font-bold text-slate-100 hover:border-indigo-400 active:scale-95 transition ${picked.includes(i) ? 'opacity-25' : ''}`,
        disabled: picked.includes(i) ? '' : null,
        onclick: () => {
          picked.push(i);
          draw();
          if (picked.length === chars.length) submit(picked.map(j => tiles[j]).join(''));
        },
      }, t)));
      bank.appendChild(Utils.el('button', {
        class: 'min-w-[44px] h-12 px-3 rounded-md border border-slate-700 bg-slate-900 text-slate-400 hover:border-indigo-400',
        onclick: () => { picked.pop(); draw(); },
      }, '⌫'));
    }
    node.reset = () => { picked = []; draw(); };
    draw();
    return node;
  }

  function mount(root) {
    let mode = 'en';
    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'grid grid-cols-2 gap-2 mb-5' }, Object.entries(MODES).map(([key, m]) =>
        Utils.el('button', {
          class: `p-3 rounded-md border font-semibold transition ${mode === key ? 'border-indigo-500 bg-indigo-500/10 text-slate-100' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`,
          onclick: () => { mode = key; renderSetup(); },
        }, I18N.t(m.nameKey)))));
      root.appendChild(Edubba.renderLessons(CATEGORIES.map(c => ({
        id: `words_${mode}_${c.id}`,
        cat: c,
        title: I18N.t('edubba.cat.' + c.id),
        sub: I18N.t('edubba.wordsN', { n: c.words.length }),
      })), l => startLesson(l.cat)));
      root.appendChild(Utils.el('div', { class: 'mt-5' }, Utils.buildVoiceToggle(renderSetup)));
      Utils.refreshIcons();
    }

    function startLesson(cat) {
      const m = MODES[mode];
      const items = cat.words.map(w => makeItem(mode, w));
      const pool = [...new Set(items.flatMap(it => it.answer.match(CLUSTER)))];
      Edubba.run(root, {
        id: `words_${mode}_${cat.id}`,
        title: `${I18N.t(m.nameKey)} · ${I18N.t('edubba.cat.' + cat.id)}`,
        items,
        prompt: promptNode,
        model: modelNode,
        makeInput: (item, phase, submit) => tilesInput(item.answer, EXTRA_TILES[phase], pool, submit, m.thai),
        isCorrect: (item, value) => value === item.answer,
        speak: it => { if (Utils.getVoiceEnabled()) Utils.speak(it.main, m.lang); },
        onExit: renderSetup,
      });
    }
  }

  return { id: 'edubba', titleKey: 'game.edubba.title', descKey: 'game.edubba.desc', icon: 'scroll-text', color: 'bg-orange-600', mount };
})();
