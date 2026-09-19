// Тренажёр "Математика, шумерская" — шестидесятеричная система в логике писцов эдубы:
// не считать каждый пример заново, а заучить таблицы обратных чисел (igi) и таблицы
// умножения, а потом собирать составные вычисления только из заученного.
// Деление на n = умножение на igi n. Все числа — позиционные, места через ":" (1:06 = «1, 6»),
// в десятичный вид результат нигде не переводится: внутри код считает целыми, но игроку
// показывается и от него принимается только шестидесятеричная запись.
const GameSumer = (() => {
  // --- шестидесятеричная арифметика ---
  function fmt(n) {
    if (n === 0) return '0';
    const places = [];
    for (; n > 0; n = Math.floor(n / 60)) places.unshift(n % 60);
    return places.map((p, i) => (i ? String(p).padStart(2, '0') : String(p))).join(':');
  }

  // нормальная форма для сравнения: как в клинописи, конечные нули не пишутся ("1:00" = "1"),
  // а значение места — 0..59; всё остальное (не число, место > 59) — null
  function canon(s) {
    const parts = String(s).trim().split(':');
    if (!parts.every(p => /^\d{1,2}$/.test(p) && Number(p) < 60)) return null;
    const nums = parts.map(Number);
    while (nums.length > 1 && nums[nums.length - 1] === 0) nums.pop();
    while (nums.length > 1 && nums[0] === 0) nums.shift();
    return nums.join(':');
  }

  // igi n: число, на которое умножают n, чтобы получить 1 (степень 60); только для n = 2^a·3^b·5^c
  function rec(n) {
    for (let k = 1, p = 60; k <= 6; k++, p *= 60) if (p % n === 0) return p / n;
    return null;
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  // --- программа: обратные числа и таблицы умножения (порядок = порядок освоения) ---
  // сначала igi 2–15, потом таблицы тех самых обратных (30, 20, 15, 12, 10…): делить на n —
  // значит умножать на igi n, поэтому таблица igi n нужна ровно для деления на n
  // 7, 11, 13, 14… пропущены: у них нет конечного igi (несократимые «нерегулярные» числа)
  const IGI = [[2, 3, 4, 5, 6, 8, 9, 10, 12, 15], [16, 18, 20, 24, 25, 27, 30], [32, 36, 40, 45, 48, 50, 54]];
  const igi = i => ({ id: `sumer_igi${i + 1}`, kind: 'igi', ns: IGI[i] });
  const mul = (base, part) => ({
    id: `sumer_mul${base}${part}`, kind: 'mul', base, part,
    nums: part === 'a' ? range(1, 10) : [...range(11, 20), 30, 40, 50],
  });
  const both = base => [mul(base, 'a'), mul(base, 'b')];
  const LESSONS = [
    igi(0),
    ...[30, 20, 15, 12, 10].map(b => mul(b, 'a')),
    ...[30, 20, 15, 12, 10].map(b => mul(b, 'b')),
    ...[6, 5, 4].flatMap(both),
    igi(1),
    ...[450, 400, 3, 2].flatMap(both), // 450 = 7:30, 400 = 6:40 (igi 8 и igi 9)
    igi(2),
  ];
  const BASES = [30, 20, 15, 12, 10, 6, 5, 4, 450, 400, 3, 2];

  // до какого множителя таблица основания заучена (10 — часть A, 20 — ещё и часть B)
  const maxMul = b => (Edubba.isMastered(`sumer_mul${b}b`) ? 20 : Edubba.isMastered(`sumer_mul${b}a`) ? 10 : 0);
  const usableBases = () => BASES.filter(b => maxMul(b) >= 10);
  const usableDivisors = () => (Edubba.isMastered('sumer_igi1') ? IGI[0].filter(n => maxMul(rec(n)) >= 10) : []);

  const pick = arr => arr[Utils.randInt(0, arr.length - 1)];

  // составной пример = цепочка шагов, каждый шаг — строка из заученной таблицы либо сложение
  function makeTask(tier) {
    if (tier === 3) {
      const b = pick(usableBases()), m = maxMul(b);
      const d1 = Utils.randInt(1, m), d0 = Utils.randInt(1, m), a = d1 * 60 + d0;
      return { title: `${fmt(a)} × ${fmt(b)}`, steps: [
        { q: `${d1} × ${fmt(b)}`, answer: fmt(d1 * b) },
        { q: `${d0} × ${fmt(b)}`, answer: fmt(d0 * b) },
        { q: `${fmt(d1 * b)}:00 + ${fmt(d0 * b)}`, answer: fmt(a * b) },
      ] };
    }
    const n = pick(usableDivisors()), r = rec(n), m = maxMul(r);
    if (tier === 1) {
      const d = Utils.randInt(2, m);
      return { title: `${d} ÷ ${n}`, steps: [
        { q: `igi ${n}`, answer: fmt(r) },
        { q: `${d} × ${fmt(r)}`, answer: fmt(d * r) },
      ] };
    }
    const d1 = Utils.randInt(1, m), d0 = Utils.randInt(1, m), a = d1 * 60 + d0;
    return { title: `${fmt(a)} ÷ ${n}`, steps: [
      { q: `igi ${n}`, answer: fmt(r) },
      { q: `${d1} × ${fmt(r)}`, answer: fmt(d1 * r) },
      { q: `${d0} × ${fmt(r)}`, answer: fmt(d0 * r) },
      { q: `${fmt(d1 * r)}:00 + ${fmt(d0 * r)}`, answer: fmt(a * r) },
    ] };
  }

  const TIERS = [1, 2, 3];
  const tierReady = t => (t === 3 ? usableBases().length > 0 : usableDivisors().length > 0);
  const practiceKey = t => `sumer_practice_t${t}`;

  function historyVariants() {
    return TIERS.map(t => ({ key: practiceKey(t), label: I18N.t('sumer.tier' + t) }));
  }

  // экранная клавиатура: цифры и ":" для разделения мест — системная клавиатура двоеточия не даёт
  function keypad(submit) {
    let val = '';
    const display = Utils.el('div', { class: 'h-14 flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-3xl font-extrabold tracking-wider text-slate-100 mb-3' });
    const draw = () => { display.textContent = val || '·'; };
    const key = (label, onclick) => Utils.el('button', { class: 'py-3 rounded-md border border-slate-700 bg-slate-800 text-xl font-bold text-slate-100 hover:border-indigo-400 active:scale-95 transition', onclick }, label);
    const add = ch => () => { if (val.length < 12) { val += ch; draw(); } };
    const node = Utils.el('div', {}, [
      display,
      Utils.el('div', { class: 'grid grid-cols-3 gap-2' }, [
        ...'123456789'.split('').map(d => key(d, add(d))),
        key(':', add(':')), key('0', add('0')), key('⌫', () => { val = val.slice(0, -1); draw(); }),
      ]),
      Utils.el('button', {
        class: 'w-full mt-2 py-3 rounded-md bg-indigo-500 text-white font-bold hover:bg-indigo-400 active:scale-[.98] transition',
        onclick: () => { if (val) submit(val); },
      }, 'OK'),
    ]);
    node.reset = () => { val = ''; draw(); };
    draw();
    return node;
  }

  const eqNode = (q, a, tone) => Utils.el('div', { class: `pop-in text-center p-4 rounded-md border ${tone}` }, [
    Utils.el('span', { class: 'text-3xl font-extrabold text-slate-100' }, a == null ? `${q} = ?` : `${q} = ${a}`),
  ]);

  function lessonItems(l) {
    return l.kind === 'igi'
      ? l.ns.map(n => ({ id: 'igi' + n, q: `igi ${n}`, answer: fmt(rec(n)), hint: true }))
      : l.nums.map(k => ({ id: `${l.base}x${k}`, q: `${fmt(l.base)} × ${k}`, answer: fmt(l.base * k) }));
  }

  function lessonTitle(l) {
    return l.kind === 'igi'
      ? I18N.t('sumer.lessonIgi', { a: l.ns[0], b: l.ns[l.ns.length - 1] })
      : I18N.t('sumer.lessonMul', { p: fmt(l.base) });
  }

  // диапазон множителей — во вторую строку списка, иначе длинное название обрезается
  const rangeLabel = l => (l.kind === 'mul' ? I18N.t(l.part === 'a' ? 'sumer.rangeA' : 'sumer.rangeB') : '');
  const lessonSub = l => [rangeLabel(l), I18N.t('sumer.itemsN', { n: lessonItems(l).length })].filter(Boolean).join(' · ');

  function mount(root) {
    renderSetup();

    function renderSetup() {
      root.innerHTML = '';
      root.appendChild(Utils.el('details', { class: 'mb-5 text-xs text-slate-500' }, [
        Utils.el('summary', { class: 'cursor-pointer select-none text-slate-400 hover:text-slate-300 py-1' }, I18N.t('sumer.howTitle')),
        Utils.el('div', { class: 'mt-1.5 space-y-1.5' }, ['sumer.how1', 'sumer.how2', 'sumer.how3'].map(k => Utils.el('p', {}, I18N.t(k)))),
      ]));

      root.appendChild(Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mb-2' }, I18N.t('sumer.tables')));
      root.appendChild(Edubba.renderLessons(LESSONS.map(l => ({
        id: l.id, l, title: lessonTitle(l), sub: lessonSub(l),
      })), x => startLesson(x.l)));

      root.appendChild(Utils.el('div', { class: 'text-sm font-semibold text-slate-400 mt-6 mb-1' }, I18N.t('sumer.practice')));
      root.appendChild(Utils.el('div', { class: 'text-xs text-slate-500 mb-2' }, I18N.t('sumer.practiceNote')));
      root.appendChild(Utils.el('div', { class: 'space-y-2' }, TIERS.map(t => {
        const ready = tierReady(t), best = Utils.getBest(practiceKey(t));
        return Utils.el('button', {
          class: `w-full flex items-center justify-between p-3 rounded-md border text-left transition ${ready ? 'border-slate-700 bg-slate-800/50 hover:border-indigo-400' : 'border-slate-800 bg-slate-900/40 opacity-50'}`,
          onclick: ready ? () => runPractice(t) : null,
        }, [
          Utils.el('div', {}, [
            Utils.el('div', { class: 'font-semibold text-slate-100' }, I18N.t('sumer.tier' + t)),
            Utils.el('div', { class: 'text-xs text-slate-500' }, I18N.t('sumer.tier' + t + 'Desc')),
          ]),
          best != null ? Utils.el('span', { class: 'text-xs font-bold text-slate-400' }, I18N.t('common.record') + ': ' + best) : null,
        ]);
      })));
      Utils.refreshIcons();
    }

    function startLesson(l) {
      Edubba.run(root, {
        id: l.id,
        title: [lessonTitle(l), rangeLabel(l)].filter(Boolean).join(' · '),
        items: lessonItems(l),
        prompt: it => Utils.el('div', {}, [
          eqNode(it.q, null, 'border-slate-700 bg-slate-800/50'),
          it.hint ? Utils.el('div', { class: 'text-xs text-slate-500 text-center mt-2' }, I18N.t('sumer.igiHint')) : null,
        ]),
        model: it => eqNode(it.q, it.answer, 'border-indigo-500/40 bg-indigo-500/10'),
        makeInput: (item, phase, submit) => keypad(submit),
        isCorrect: (item, value) => canon(value) === canon(item.answer),
        onExit: renderSetup,
      });
    }

    function runPractice(tier) {
      const TASKS = 8;
      let ti = 0, score = 0;
      nextTask();

      function nextTask() {
        if (ti >= TASKS) return finish();
        const task = makeTask(tier);
        let si = 0, mistakes = 0;
        const done = [];
        renderStep();

        function frame(body) {
          root.innerHTML = '';
          root.appendChild(Utils.el('div', { class: 'flex items-center justify-between text-sm mb-3' }, [
            Utils.el('span', { class: 'font-semibold text-slate-300' }, I18N.t('sumer.taskN', { i: ti + 1, n: TASKS })),
            Utils.el('span', { class: 'font-bold text-indigo-400' }, I18N.t('common.points', { n: score })),
          ]));
          root.appendChild(Utils.el('div', { class: 'text-center text-3xl font-extrabold text-slate-100 mb-4' }, task.title));
          root.appendChild(Utils.el('div', { class: 'space-y-1 mb-4 text-center text-slate-400' }, done.map(d => Utils.el('div', {}, d))));
          body.forEach(n => root.appendChild(n));
        }

        function renderStep() {
          const step = task.steps[si];
          let tries = 0;
          const widget = keypad(value => {
            if (canon(value) === canon(step.answer)) return advance();
            mistakes++;
            tries++;
            widget.classList.add('shake');
            setTimeout(() => widget.classList.remove('shake'), 500);
            widget.reset();
            if (tries >= 3) advance();
          });
          frame([Utils.el('div', { class: 'text-center text-2xl font-bold text-indigo-300 mb-3' }, `${step.q} = ?`), widget]);

          function advance() {
            done.push(`${step.q} = ${step.answer}`);
            if (++si < task.steps.length) return renderStep();
            score += Math.max(0, 10 - 3 * mistakes);
            ti++;
            frame([]);
            setTimeout(nextTask, 700);
          }
        }
      }

      function finish() {
        Utils.setBest(practiceKey(tier), score, true);
        Utils.recordResult(practiceKey(tier), score);
        root.innerHTML = '';
        root.appendChild(Utils.el('div', { class: 'text-center py-8' }, [
          Utils.el('i', { 'data-lucide': 'flag', class: 'w-10 h-10 mx-auto text-slate-500 mb-3' }),
          Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t('sumer.practiceDone')),
          Utils.el('div', { class: 'text-slate-400 mt-1' }, I18N.t('sumer.scoreLine', { score, max: TASKS * 10 })),
          Utils.el('div', { class: 'flex gap-2 justify-center mt-6' }, [
            Utils.el('button', { class: 'px-4 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400', onclick: () => runPractice(tier) }, I18N.t('common.playAgain')),
            Utils.el('button', { class: 'px-4 py-2 rounded-md bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700', onclick: renderSetup }, I18N.t('edubba.toList')),
          ]),
        ]));
        Utils.refreshIcons();
      }
    }
  }

  return { id: 'sumer', titleKey: 'game.sumer.title', descKey: 'game.sumer.desc', icon: 'sigma', color: 'bg-teal-600', historyVariants, mount, sex: { fmt, canon, rec } };
})();
