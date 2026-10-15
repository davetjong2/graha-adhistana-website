/* Graha Adhistana — projects index (projects.html).
   Builds the editorial grid and the plain-text index from GA_PROJECTS. Loaded before main.js
   (deferred scripts run in order), so the first render is in place when main.js wires reveals;
   every later render calls GAUI.refresh. Filter and view live in the URL: ?c=interior&v=index */
(() => {
  'use strict';

  const data = window.GA_PROJECTS;
  const GA = window.GA;
  const grid = document.querySelector('[data-pj-grid]');
  const index = document.querySelector('[data-pj-index]');
  if (!Array.isArray(data) || !GA || !grid || !index) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATEGORIES = ['Modern', 'Classic', 'Interior', 'Commercial'];
  const RATIO = { '4x5': 4 / 5, '1x1': 1, '3x2': 3 / 2, '16x9': 16 / 9 };

  /* Art direction per cover file. Most renders carry the studio's logo near the bottom edge:
     `safe` is how far down the frame stays clear of it (share of the height) and no crop goes
     below it. fx/fy is the point kept in frame. Covers not listed fall back to their shape. */
  const ART = {
    '01-DZpcQDjSgkV-1.jpg': { r: '3x2', safe: 0.79, fy: 0.47 }, // house and its reflection
    '00-DeUDSS1kj_y-1.jpg': { r: '16x9', safe: 0.8, fy: 0.4 },
    '07-DX185WpEp13-1.jpg': { r: '4x5', safe: 0.865, fy: 0.62 },
    '02-DZDKEcTyScP-1.jpg': { r: '4x5', safe: 0.88, fy: 0.6 },
    '06-DYZF-QCEkty-1.jpg': { r: '4x5', safe: 0.915, fy: 0.65 },
    '15-DMjrisZStGu-1.jpg': { r: '4x5', safe: 0.925, fy: 0.62 },
    '18-DL7EZlEyJn2-2.jpg': { r: '4x5' },
    '25-DFuVs-mzNap-2.jpg': { r: '4x5' },
    '27-DECYS40SCCG-1.jpg': { r: '1x1', safe: 0.93, fy: 0.5 },
    '32-DDFU9dMS-hu-3.jpg': { r: '3x2', fy: 0.5 },
    '09-DXEI-lMklvt-2.jpg': { r: '16x9', safe: 0.895, fy: 0.45 },
    '31-DDFVGn8ypYG-1.jpg': { r: '3x2', safe: 0.85, fy: 0.45 },
    '21-DHSSq5xyUiE-1.jpg': { r: '1x1', safe: 0.83, fy: 0.45 },
    '12-DRl40TEEoLi-1.jpg': { r: '4x5', fy: 0.55 }, // roofline and lake
    '13-DRl4enzEtC0-5.jpg': { r: '1x1' },
    '05-DYjm9Etyiq9-1.jpg': { r: '4x5', safe: 0.875, fy: 0.6 },
    '04-DYjpWESyKVP-1.jpg': { r: '4x5', safe: 0.875, fy: 0.6 },
    '03-DYmWxNFylYu-1.jpg': { r: '4x5', safe: 0.865, fy: 0.55 },
    '14-DRMdYJ4kvUA-1.jpg': { r: '4x5', safe: 0.875, fy: 0.6 },
    '08-DXEOGhHkvlQ-2.jpg': { r: '3x2', safe: 0.905, fy: 0.5 },
    '39-DCmVBdkyUWw-3.jpg': { r: '1x1', safe: 0.895, fy: 0.5 },
    '33-DC_NEhjSHyb-1.jpg': { r: '1x1', safe: 0.85, fy: 0.5 },
    '38-DCopZuoSgdY-1.jpg': { r: '16x9', safe: 0.88, fy: 0.5 },
  };

  /* Desktop column spans per role, by frame ratio, so plates of different shapes carry
     similar weight (a big portrait takes five columns, a big landscape seven). */
  const SPAN = {
    lead: { '4x5': 5, '1x1': 6, '3x2': 7, '16x9': 7 },
    aside: { '4x5': 3, '1x1': 4, '3x2': 4, '16x9': 4 },
    solo: { '4x5': 6, '1x1': 6, '3x2': 8, '16x9': 10 },
  };

  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const num = (n) => +n.toFixed(2);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = (c) => String(c || '').trim().toLowerCase();

  // Numbers follow the catalogue order, so a project keeps its number under every filter.
  const items = data
    .map((p, i) => ({ p, no: pad(i + 1), cover: p && p.images && p.images[0] }))
    .filter((it) => it.p && it.p.slug && it.cover);

  const artFor = (img) => {
    const a = ART[img.f] || {};
    const shape = img.w / img.h;
    return {
      r: a.r || (shape > 1.2 ? '3x2' : shape < 0.9 ? '4x5' : '1x1'),
      safe: a.safe || 1,
      fx: a.fx == null ? 0.5 : a.fx,
      fy: a.fy == null ? 0.5 : a.fy,
    };
  };

  /* Largest window of the frame's ratio that sits above `safe`, centred on the focus point,
     expressed as the img box's size and offset in % of the frame (object-fit then has nothing
     left to crop). */
  const cropStyle = (img, a) => {
    const ai = img.w / img.h;
    const ac = RATIO[a.r];
    const vh = Math.min(a.safe, ai / ac);
    const uw = (vh * ac) / ai;
    const u0 = clamp(a.fx - uw / 2, 0, 1 - uw);
    const v0 = clamp(a.fy - vh / 2, 0, a.safe - vh);
    return {
      zoom: 1 / uw,
      css: `--cw:${num(100 / uw)}%;--ch:${num(100 / vh)}%;--cx:${num((-100 * u0) / uw)}%;--cy:${num((-100 * v0) / vh)}%;--ox:${num((u0 + uw / 2) * 100)}%;--oy:${num((v0 + vh / 2) * 100)}%`,
    };
  };

  /* Rows cycle: a big plate left with a small one dropped to its baseline, a small plate
     inset from the margin with a big one on the right, then a single plate on its own. */
  const compose = (list) => {
    const rows = [];
    for (let i = 0, k = 0; i < list.length; k += 1) {
      const type = ['a', 'b', 'c'][k % 3];
      const solo = type === 'c' || i === list.length - 1;
      rows.push({ type: solo ? 'c' : type, cycle: Math.floor(k / 3), items: list.slice(i, i + (solo ? 1 : 2)) });
      i += solo ? 1 : 2;
    }
    return rows;
  };

  // Column placement for each plate of a row, alternating the indents from cycle to cycle.
  const place = (row) => {
    const arts = row.items.map((it) => artFor(it.cover));
    const odd = row.cycle % 2 === 1;
    if (row.type === 'c') {
      const r = arts[0].r;
      const span = SPAN.solo[r];
      return [{ role: 'solo', art: arts[0], start: Math.floor((12 - span) / 2) + 1, span, narrow: r === '4x5' }];
    }
    const leadAt = row.type === 'a' ? 0 : 1;
    const lead = { role: 'lead', art: arts[leadAt], span: SPAN.lead[arts[leadAt].r] };
    const aside = { role: 'aside', art: arts[1 - leadAt], span: SPAN.aside[arts[1 - leadAt].r] };
    if (row.type === 'a') {
      lead.start = odd ? 2 : 1;
      if (lead.start + lead.span + aside.span > 12) lead.start = 1; // keep one empty column between
      aside.span = Math.min(aside.span, 12 - lead.span - lead.start);
      aside.start = 13 - aside.span;
      return [lead, aside];
    }
    aside.start = odd ? 1 : 2;
    let end = odd ? 11 : 12;
    if (aside.start + aside.span + lead.span > end) { aside.start = 1; end = 12; }
    lead.span = Math.min(lead.span, end - aside.span - aside.start);
    lead.start = end - lead.span + 1;
    return [aside, lead];
  };

  const card = (it, slot, n) => {
    const { p, no, cover } = it;
    const dm = GA.dims(cover, 'm');
    const crop = cropStyle(cover, slot.art);
    const span = slot.narrow ? slot.span * (5 / 6) : slot.span;
    // Rendered width of the img box (frame × zoom), so retina screens pull the full-size file
    const vw = Math.ceil((span / 12) * 92 * crop.zoom);
    const srcset = cover.w > dm.w
      ? ` srcset="${GA.src(cover, 'm')} ${dm.w}w, ${GA.src(cover, 'l')} ${cover.w}w" sizes="(min-width: 900px) ${vw}vw, ${Math.ceil(92 * crop.zoom)}vw"`
      : '';
    const cls = `project-card pj-card pj-card--${slot.role}${slot.narrow ? ' pj-card--narrow' : ''}${span < 6 ? ' pj-card--stack' : ''}`;
    return `<a class="${cls}" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="View" style="--col:${slot.start} / span ${slot.span}">`
      + `<div class="media pj-crop zoom ratio-${slot.art.r}" data-reveal="img" style="${crop.css}">`
      + `<img src="${GA.src(cover, 'm')}"${srcset} width="${dm.w}" height="${dm.h}" alt="${esc(cover.alt || p.name)}" decoding="async"${n > 1 ? ' loading="lazy"' : ''}>`
      + '</div>'
      + '<div class="project-card__meta">'
      + `<span class="label project-card__index">${no}</span>`
      + `<h3 class="project-card__title">${esc(p.name)}</h3>`
      + `<span class="label project-card__info">${esc(GA.meta(p))}</span>`
      + '</div></a>';
  };

  const gridHtml = (list) => {
    let n = 0;
    return compose(list).map((row) => {
      const slots = place(row); // same order as row.items
      return `<div class="pj-row pj-row--${row.type}">${slots.map((slot, j) => card(row.items[j], slot, n++)).join('')}</div>`;
    }).join('');
  };

  const indexHtml = (list) => {
    if (!list.length) return '';
    const rows = list.map((it, i) => {
      const { p, no, cover } = it;
      const crop = cropStyle(cover, Object.assign(artFor(cover), { r: '4x5' })).css; // the preview frame is 4:5
      return `<li><a class="pj-line" href="project.html?p=${encodeURIComponent(p.slug)}" data-preview="${GA.src(cover, 'm')}" data-crop="${crop}" data-reveal style="--d:${num(Math.min(i, 8) * 0.04)}s">`
        + `<span class="label pj-line__no">${no}</span>`
        + `<span class="pj-line__name">${esc(p.name)}</span>`
        + `<span class="pj-line__loc">${esc(p.location || '—')}</span>`
        + `<span class="pj-line__cat">${esc(p.category)}</span>`
        + `<span class="pj-line__year num">${esc(p.year)}</span>`
        + '</a></li>';
    }).join('');
    return '<div class="pj-index__head label" aria-hidden="true"><span>No.</span><span>Name</span><span>Location</span><span>Category</span><span>Year</span></div>'
      + `<ul class="pj-index__list">${rows}</ul>`;
  };

  /* ---------- State, controls and URL ---------- */
  const filterBtns = Array.from(document.querySelectorAll('[data-filter]'));
  const viewBtns = Array.from(document.querySelectorAll('[data-view]'));
  const status = document.querySelector('[data-pj-status]');

  const counts = { all: items.length };
  CATEGORIES.forEach((c) => { counts[key(c)] = items.filter((it) => it.p.category === c).length; });
  filterBtns.forEach((b) => {
    const n = counts[b.dataset.filter] || 0;
    const c = b.querySelector('.pj-filter__count');
    if (c) c.textContent = n;
    b.hidden = n === 0;
  });
  document.querySelectorAll('[data-pj-total]').forEach((el) => { el.textContent = items.length; });

  const params = new URLSearchParams(window.location.search);
  let filter = key(params.get('c'));
  if (!(counts[filter] > 0)) filter = 'all';
  let view = key(params.get('v')) === 'index' ? 'index' : 'grid';

  const visible = () => (filter === 'all' ? items : items.filter((it) => key(it.p.category) === filter));

  const render = () => {
    const list = visible();
    grid.innerHTML = gridHtml(list);
    index.innerHTML = indexHtml(list);
    return list;
  };

  const sync = () => {
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    grid.hidden = view !== 'grid';
    index.hidden = view !== 'index';
  };

  const writeUrl = () => {
    const q = new URLSearchParams(window.location.search);
    if (filter === 'all') q.delete('c'); else q.set('c', filter);
    if (view === 'grid') q.delete('v'); else q.set('v', view);
    const s = q.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash);
  };

  const refresh = (el) => { if (window.GAUI) window.GAUI.refresh(el); };

  // main.js owns the floating preview; hand it the hovered row's crop so the logo stays out of frame
  index.addEventListener('pointerover', (e) => {
    const row = e.target.closest('.pj-line');
    const pv = document.querySelector('.preview');
    if (!row || !pv) return;
    row.dataset.crop.split(';').forEach((d) => { const [k, v] = d.split(':'); pv.style.setProperty(k, v); });
  });

  let timer = 0;
  filterBtns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.filter === filter) return;
    filter = b.dataset.filter;
    sync();
    writeUrl();
    const swap = () => {
      const list = render();
      grid.classList.remove('is-fading');
      index.classList.remove('is-fading');
      refresh(grid);
      refresh(index);
      if (status) status.textContent = `${list.length} ${list.length === 1 ? 'project' : 'projects'}`;
    };
    clearTimeout(timer);
    if (reduce) { swap(); return; }
    grid.classList.add('is-fading');
    index.classList.add('is-fading');
    timer = setTimeout(swap, 280);
  }));

  viewBtns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.view === view) return;
    view = b.dataset.view;
    sync();
    writeUrl();
    const el = view === 'grid' ? grid : index;
    el.classList.remove('pj-enter');
    void el.offsetWidth; // restart the fade-in
    el.classList.add('pj-enter');
    refresh(el);
  }));

  sync();
  render();
  // Normalise links like ?c=Interior (or an unknown filter) to the canonical lowercase form
  const stale = (name, value) => (params.get(name) || null) !== value;
  if (stale('c', filter === 'all' ? null : filter) || stale('v', view === 'grid' ? null : view)) writeUrl();
})();
