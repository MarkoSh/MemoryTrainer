// Экран статистики — графики прогресса по каждому режиму/уровню тренажёра
const StatsView = (() => {
  const GAMES_META = [
    { game: GameLine, stroke: '#818cf8', higherIsBetter: true, fmt: v => `${v}` },
    { game: GameMath, stroke: '#34d399', higherIsBetter: true, fmt: v => `${v}` },
    { game: GamePairs, stroke: '#fb7185', higherIsBetter: true, fmt: v => `${v}` },
    { game: GameSchulte, stroke: '#fbbf24', higherIsBetter: false, fmt: v => Utils.fmtTime(v) },
    { game: GameWords, stroke: '#22d3ee', higherIsBetter: true, fmt: v => `${v}` },
    { game: GameSumer, stroke: '#2dd4bf', higherIsBetter: true, fmt: v => `${v}` },
  ];

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function buildChart(history, meta) {
    const W = 100, H = 36;
    if (history.length < 2) {
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full h-16' });
      const text = svgEl('text', { x: W / 2, y: H / 2, fill: '#64748b', 'font-size': '5', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      text.textContent = I18N.t('stats.playAgain');
      svg.appendChild(text);
      return svg;
    }
    const values = history.map(h => h.v);
    const plotVals = meta.higherIsBetter ? values : values.map(v => -v);
    const min = Math.min(...plotVals), max = Math.max(...plotVals);
    const range = max - min || 1;
    const pts = plotVals.map((v, i) => {
      const x = (i / (history.length - 1)) * W;
      const y = H - 4 - ((v - min) / range) * (H - 8);
      return [x, y];
    });
    const pointsAttr = pts.map(p => p.join(',')).join(' ');
    const areaAttr = `0,${H} ${pointsAttr} ${W},${H}`;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full h-16', preserveAspectRatio: 'none' });
    svg.appendChild(svgEl('polygon', { points: areaAttr, fill: meta.stroke, 'fill-opacity': '0.12', stroke: 'none' }));
    svg.appendChild(svgEl('polyline', { points: pointsAttr, fill: 'none', stroke: meta.stroke, 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const last = pts[pts.length - 1];
    svg.appendChild(svgEl('circle', { cx: last[0], cy: last[1], r: '2', fill: meta.stroke }));
    return svg;
  }

  function buildCard(meta) {
    const variants = meta.game.historyVariants();
    let activeKey = variants[0].key;
    let bestCount = -1;
    variants.forEach(v => {
      const len = Utils.getHistory(v.key).length;
      if (len > bestCount) { bestCount = len; activeKey = v.key; }
    });

    const card = Utils.el('div', { class: 'p-4 rounded-md border border-slate-700 bg-slate-800/50' });
    const chartHolder = Utils.el('div', {});
    const metaLine = Utils.el('div', { class: 'flex items-center justify-between mt-2 text-xs text-slate-500' });
    const sessionsLabel = Utils.el('span', { class: 'text-xs text-slate-500' });

    const select = Utils.el('select', {
      class: 'bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-300 px-2 py-1 max-w-[55%]',
      onchange: (e) => renderVariant(e.target.value),
    }, variants.map(v => Utils.el('option', { value: v.key }, v.label)));
    select.value = activeKey;

    card.appendChild(Utils.el('div', { class: 'flex items-center justify-between mb-2 gap-2' }, [
      Utils.el('div', { class: 'flex items-center gap-2 shrink-0' }, [
        Utils.el('i', { 'data-lucide': meta.game.icon, class: 'w-4 h-4 text-slate-400' }),
        Utils.el('span', { class: 'font-semibold text-slate-100 text-sm' }, I18N.t(meta.game.titleKey)),
      ]),
      select,
    ]));
    card.appendChild(sessionsLabel);
    card.appendChild(chartHolder);
    card.appendChild(metaLine);

    function renderVariant(key) {
      const history = Utils.getHistory(key);
      sessionsLabel.textContent = I18N.t('stats.sessions', { n: history.length });
      chartHolder.innerHTML = '';
      chartHolder.appendChild(buildChart(history, meta));
      metaLine.innerHTML = '';
      if (history.length) {
        const vals = history.map(h => h.v);
        const bestVal = meta.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
        const lastVal = vals[vals.length - 1];
        metaLine.appendChild(Utils.el('span', {}, I18N.t('stats.last', { v: meta.fmt(lastVal) })));
        metaLine.appendChild(Utils.el('span', {}, I18N.t('stats.best', { v: meta.fmt(bestVal) })));
      }
    }
    renderVariant(activeKey);

    return card;
  }

  function mount(root, onExit) {
    root.innerHTML = '';
    const wrap = Utils.el('div', { class: 'space-y-4' });
    GAMES_META.forEach(meta => wrap.appendChild(buildCard(meta)));
    root.appendChild(wrap);
    Utils.refreshIcons();
  }

  return { id: 'stats', titleKey: 'game.stats.title', descKey: 'game.stats.desc', icon: 'bar-chart-3', color: 'bg-slate-700', mount };
})();
