// Общий движок "эдубы" (шумерской школы писцов): блок материала осваивается целиком
// по циклу копирование (образец на виду) -> вспоминание (образца нет) -> проверка
// (порядок перемешан, без подсказок), и только после сдачи проверки открывается
// следующий блок. Движок не знает ни про слова, ни про числа — их даёт игра через cfg.
const Edubba = (() => {
  const PASS_PCT = 85;

  // освоенность блока хранится как лучший % проверки в общем Utils.getBest/setBest
  const masteryKey = id => 'edubba_' + id;
  const bestPct = id => { const v = Utils.getBest(masteryKey(id)); return v == null ? null : Number(v); };
  const isMastered = id => (bestPct(id) ?? -1) >= PASS_PCT;

  // список блоков: следующий открывается только после освоения предыдущего
  function renderLessons(lessons, onOpen) {
    return Utils.el('div', { class: 'space-y-2' }, lessons.map((l, i) => {
      const done = isMastered(l.id);
      const locked = i > 0 && !done && !isMastered(lessons[i - 1].id);
      const best = bestPct(l.id);
      const tone = locked ? 'border-slate-800 bg-slate-900/40 opacity-50'
        : done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-indigo-400';
      return Utils.el('button', { class: `w-full flex items-center gap-3 p-3 rounded-md border text-left transition ${tone}`, onclick: locked ? null : () => onOpen(l) }, [
        Utils.el('i', { 'data-lucide': locked ? 'lock' : done ? 'circle-check' : 'circle', class: `w-5 h-5 shrink-0 ${done ? 'text-emerald-400' : 'text-slate-500'}` }),
        Utils.el('div', { class: 'flex-1 min-w-0' }, [
          Utils.el('div', { class: 'font-semibold text-slate-100 truncate' }, `${i + 1}. ${l.title}`),
          Utils.el('div', { class: 'text-xs text-slate-500' }, l.sub),
        ]),
        best != null ? Utils.el('span', { class: 'text-xs font-bold text-slate-400' }, `${best}%`) : null,
      ]);
    }));
  }

  // cfg: { id, title, items, prompt(item), model(item), makeInput(item, phase, submit),
  //        isCorrect(item, value), speak?(item), onExit() }
  // makeInput возвращает узел; при ошибке движок вызывает node.reset(), если он есть.
  function run(root, cfg) {
    const shake = el => { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); };
    const btn = (label, onclick, tone = 'bg-indigo-500 text-white hover:bg-indigo-400') =>
      Utils.el('button', { class: `w-full py-3 rounded-md font-bold active:scale-[.98] transition ${tone}`, onclick }, label);

    each('copy', cfg.items, () => each('recall', cfg.items, exam));

    function each(phase, list, done) {
      const results = [];
      next(0);
      function next(i) {
        if (i >= list.length) return done(results);
        screen(phase, list, i, ok => { results.push({ item: list[i], ok }); next(i + 1); });
      }
    }

    function screen(phase, list, i, finish) {
      const item = list[i];
      let mistakes = 0, settled = false;
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-xs text-slate-500 truncate' }, cfg.title));
      root.appendChild(Utils.el('div', { class: 'flex items-center justify-between mb-1' }, [
        Utils.el('span', { class: 'font-semibold text-slate-200' }, I18N.t('edubba.phase.' + phase)),
        Utils.el('span', { class: 'text-sm text-slate-500' }, `${i + 1} / ${list.length}`),
      ]));
      root.appendChild(Utils.el('div', { class: 'text-xs text-slate-500 mb-4' }, I18N.t('edubba.hint.' + phase)));
      const stage = Utils.el('div', { class: 'mb-5' }, phase === 'copy' ? cfg.model(item) : cfg.prompt(item));
      const area = Utils.el('div', {});
      root.appendChild(stage);
      root.appendChild(area);

      const showModel = () => { stage.innerHTML = ''; stage.appendChild(cfg.model(item)); };
      const reveal = () => {
        settled = true;
        showModel();
        area.innerHTML = '';
        area.appendChild(btn(I18N.t('edubba.next'), () => finish(false)));
      };

      const widget = cfg.makeInput(item, phase, value => {
        if (settled) return;
        if (cfg.isCorrect(item, value)) {
          settled = true;
          if (cfg.speak) cfg.speak(item);
          showModel();
          setTimeout(() => finish(phase === 'copy' || mistakes === 0), 600);
        } else {
          mistakes++;
          shake(widget);
          if (widget.reset) widget.reset();
          if (phase === 'exam' || (phase === 'recall' && mistakes >= 2)) reveal();
        }
      });
      area.appendChild(widget);
      if (phase === 'recall') {
        area.appendChild(Utils.el('button', {
          class: 'w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-300',
          onclick: reveal,
        }, I18N.t('edubba.peek')));
      }
    }

    function exam() {
      each('exam', Utils.shuffle(cfg.items), results => {
        const pct = Math.round(results.filter(r => r.ok).length / results.length * 100);
        Utils.setBest(masteryKey(cfg.id), pct, true);
        result(pct, results.filter(r => !r.ok).map(r => r.item));
      });
    }

    function result(pct, failed) {
      const pass = pct >= PASS_PCT;
      root.innerHTML = '';
      root.appendChild(Utils.el('div', { class: 'text-center py-6' }, [
        Utils.el('i', { 'data-lucide': pass ? 'trophy' : 'flag', class: `w-10 h-10 mx-auto mb-3 ${pass ? 'text-emerald-400' : 'text-slate-500'}` }),
        Utils.el('div', { class: 'text-xl font-extrabold text-slate-100' }, I18N.t(pass ? 'edubba.mastered' : 'edubba.notYet')),
        Utils.el('div', { class: 'text-slate-400 mt-1' }, `${pct}%` + (pass ? '' : ' · ' + I18N.t('edubba.need', { n: PASS_PCT }))),
      ]));
      if (failed.length) {
        root.appendChild(Utils.el('div', { class: 'text-xs text-slate-500 mb-2' }, I18N.t('edubba.mistakesList')));
        root.appendChild(Utils.el('div', { class: 'space-y-2 mb-5' }, failed.map(it => cfg.model(it))));
      }
      const row = Utils.el('div', { class: 'space-y-2' });
      if (!pass) row.appendChild(btn(I18N.t('edubba.repeat'), () => each('recall', failed, exam)));
      row.appendChild(btn(I18N.t('edubba.toList'), cfg.onExit, pass ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'));
      root.appendChild(row);
      Utils.refreshIcons();
    }
  }

  return { renderLessons, isMastered, run };
})();
