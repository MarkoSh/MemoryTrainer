// Меню и навигация между тренажёрами
(() => {
  const root = document.getElementById('app-root');
  const games = [GameLine, GameMath, GamePairs, GameSchulte, GameWords, GameSpeedRead];
  const menuItems = [...games, StatsView];

  function langToggle() {
    const other = I18N.getLang() === 'ru' ? 'en' : 'ru';
    return Utils.el('button', {
      class: 'shrink-0 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:border-indigo-400',
      onclick: () => { I18N.setLang(other); showMenu(); },
    }, I18N.getLang().toUpperCase());
  }

  function showMenu() {
    document.title = I18N.t('app.title');
    root.innerHTML = '';
    const header = Utils.el('div', { class: 'px-5 pt-6 pb-4 flex items-start justify-between gap-3' }, [
      Utils.el('div', {}, [
        Utils.el('h1', { class: 'text-2xl font-extrabold text-slate-100' }, I18N.t('app.title')),
        Utils.el('p', { class: 'text-sm text-slate-500 mt-1' }, I18N.t('app.subtitle')),
      ]),
      langToggle(),
    ]);

    const list = Utils.el('div', { class: 'px-4 pb-8 space-y-3' });
    menuItems.forEach(g => {
      const card = Utils.el('button', {
        class: 'w-full flex items-center gap-4 p-4 bg-slate-900 border border-slate-700 rounded-md hover:border-indigo-400 active:scale-[.98] transition text-left',
        onclick: () => openGame(g),
      }, [
        Utils.el('div', { class: `w-12 h-12 shrink-0 rounded-md flex items-center justify-center ${g.color}` }, [
          Utils.el('i', { 'data-lucide': g.icon, class: 'w-6 h-6 text-white' }),
        ]),
        Utils.el('div', { class: 'flex-1 min-w-0' }, [
          Utils.el('div', { class: 'font-bold text-slate-100' }, I18N.t(g.titleKey)),
          Utils.el('div', { class: 'text-xs text-slate-500 mt-0.5' }, I18N.t(g.descKey)),
        ]),
      ]);
      list.appendChild(card);
    });

    root.appendChild(header);
    root.appendChild(list);
    Utils.refreshIcons();
  }

  function openGame(g) {
    root.innerHTML = '';
    const bar = Utils.el('div', { class: 'sticky top-0 z-20 flex items-center gap-2 px-3 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800' }, [
      Utils.el('button', {
        class: 'w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-800 active:scale-95 transition text-slate-300',
        onclick: showMenu,
      }, [Utils.el('i', { 'data-lucide': 'arrow-left', class: 'w-5 h-5' })]),
      Utils.el('div', { class: 'font-bold text-slate-100' }, I18N.t(g.titleKey)),
    ]);
    const body = Utils.el('div', { class: 'p-4' });
    root.appendChild(bar);
    root.appendChild(body);
    Utils.refreshIcons();
    g.mount(body, showMenu);
  }

  showMenu();
})();
