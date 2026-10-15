/* Graha Adhistana — project page (project.html?p=<slug>).
   Builds the whole page from GA_PROJECTS. Load it after projects.js and before main.js:
   main.js wires up reveals, split headings and parallax once, at load, so the markup must exist by then. */
(() => {
  'use strict';

  const list = window.GA_PROJECTS || [];
  const GA = window.GA;
  const main = document.getElementById('main');
  if (!list.length || !GA || !main) return;

  /* Per image file: [keep, focus x, focus y].
     keep: share of the height above the studio watermark at the bottom of most files (1 = clean).
     focus: the point held in frame when an image is cropped (0–1, from the top left). */
  const CROP = {
    '00-DeUDSS1kj_y-1': [0.81, 0.5, 0.45], '00-DeUDSS1kj_y-2': [0.81, 0.5, 0.45], '00-DeUDSS1kj_y-3': [0.81, 0.5, 0.45],
    '01-DZpcQDjSgkV-1': [0.8, 0.5, 0.47],
    '02-DZDKEcTyScP-1': [0.88, 0.5, 0.56],
    '03-DYmWxNFylYu-1': [0.88, 0.5, 0.45],
    '04-DYjpWESyKVP-1': [0.88, 0.5, 0.62],
    '05-DYjm9Etyiq9-1': [0.88, 0.5, 0.6],
    '06-DYZF-QCEkty-1': [0.91, 0.5, 0.72], '06-DYZF-QCEkty-2': [0.85, 0.5, 0.5], '06-DYZF-QCEkty-3': [0.85, 0.5, 0.5],
    '07-DX185WpEp13-1': [0.87, 0.5, 0.63], '07-DX185WpEp13-2': [1, 0.62, 0.55], '07-DX185WpEp13-3': [1, 0.38, 0.55],
    '08-DXEOGhHkvlQ-1': [1, 0.6, 0.5], '08-DXEOGhHkvlQ-2': [0.9, 0.5, 0.42],
    '09-DXEI-lMklvt-1': [0.9, 0.5, 0.5], '09-DXEI-lMklvt-2': [0.89, 0.5, 0.45],
    '12-DRl40TEEoLi-1': [1, 0.5, 0.56],
    '13-DRl4enzEtC0-1': [1, 0.5, 0.4], '13-DRl4enzEtC0-2': [1, 0.5, 0.42], '13-DRl4enzEtC0-3': [1, 0.5, 0.45],
    '13-DRl4enzEtC0-5': [1, 0.5, 0.48], '13-DRl4enzEtC0-8': [1, 0.5, 0.4], '13-DRl4enzEtC0-12': [1, 0.5, 0.5],
    '14-DRMdYJ4kvUA-1': [0.88, 0.5, 0.6],
    '15-DMjrisZStGu-1': [0.91, 0.5, 0.7], '15-DMjrisZStGu-2': [0.87, 0.5, 0.5], '15-DMjrisZStGu-3': [0.88, 0.5, 0.5],
    '18-DL7EZlEyJn2-1': [0.92, 0.5, 0.5], '18-DL7EZlEyJn2-2': [1, 0.5, 0.45],
    '21-DHSSq5xyUiE-1': [0.83, 0.5, 0.45], '21-DHSSq5xyUiE-2': [1, 0.5, 0.5],
    '25-DFuVs-mzNap-1': [0.86, 0.5, 0.5], '25-DFuVs-mzNap-2': [1, 0.5, 0.42],
    '27-DECYS40SCCG-1': [0.92, 0.5, 0.5], '27-DECYS40SCCG-2': [1, 0.5, 0.5], '27-DECYS40SCCG-3': [0.92, 0.5, 0.5],
    '31-DDFVGn8ypYG-1': [0.86, 0.5, 0.45], '31-DDFVGn8ypYG-3': [0.89, 0.5, 0.5],
    '32-DDFU9dMS-hu-1': [0.85, 0.5, 0.5], '32-DDFU9dMS-hu-2': [0.85, 0.5, 0.5], '32-DDFU9dMS-hu-3': [1, 0.5, 0.5],
    '33-DC_NEhjSHyb-1': [0.86, 0.5, 0.46], '33-DC_NEhjSHyb-2': [0.85, 0.5, 0.5], '33-DC_NEhjSHyb-3': [0.86, 0.5, 0.5],
    '36-DCopm1_SFLb-1': [0.83, 0.5, 0.5], '37-DCopf8_SidW-1': [0.84, 0.5, 0.5], '38-DCopZuoSgdY-1': [0.86, 0.5, 0.45],
    '39-DCmVBdkyUWw-1': [1, 0.5, 0.5], '39-DCmVBdkyUWw-2': [1, 0.5, 0.5], '39-DCmVBdkyUWw-3': [0.89, 0.5, 0.52],
  };
  const CROP_DEFAULT = [0.86, 0.5, 0.5]; // a file not listed yet: assume it carries the watermark

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const stem = (img) => img.f.replace(/\.\w+$/, '');
  const cropOf = (img) => CROP[stem(img)] || CROP_DEFAULT;
  const orient = (img) => { const a = img.w / img.h; return a >= 1.2 ? 'l' : a >= 0.9 ? 's' : 'p'; };

  /* ---------- Which project ---------- */
  const url = new URL(window.location.href);
  let p = GA.find(url.searchParams.get('p') || '');
  if (!p) {
    p = list[0];
    url.searchParams.set('p', p.slug);
    try { window.history.replaceState(window.history.state, '', url); } catch (e) { /* sandboxed or srcdoc frame: keep the URL */ }
  }
  const next = list[(list.indexOf(p) + 1) % list.length];
  const imgs = Array.isArray(p.images) ? p.images : [];
  const img0 = imgs[0];
  const summary = String(p.summary || '').trim();

  document.title = `${p.name} — Graha Adhistana`;
  const setMeta = (sel, val) => { const el = document.head.querySelector(sel); if (el && val) el.setAttribute('content', val); };
  // Most projects have no summary: describe the page by its facts rather than the generic default
  const description = summary || [p.name, p.scope, p.location, p.year].filter(Boolean).join(' · ');
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', document.title);
  setMeta('meta[property="og:description"]', description);
  if (img0) setMeta('meta[property="og:image"]', GA.src(img0, 'l'));

  /* ---------- Cropping ----------
     The window of an image that fills a frame of aspect F (width / height), as shares of the image:
     object-fit: cover around the focus point, never reaching into the watermark band.
     slack leaves room for data-parallax, which shifts the image by that share of its own height. */
  function fit(img, F, slack = 0) {
    const [keep, fx, fy] = cropOf(img);
    const A = img.w / img.h;
    let vw = Math.min(1, F / A);
    let vh = Math.min(1, A / F);
    const z = Math.max(1, vh / (keep - 2 * slack));
    vw /= z;
    vh /= z;
    const x = clamp(fx - vw / 2, 0, 1 - vw);
    const y = clamp(fy - vh / 2, slack, keep - slack - vh);
    return { vw, vh, x, y };
  }
  // The <img> box becomes the whole picture, placed so that window fills the frame.
  const pct = (n) => +(n * 100).toFixed(3) + '%';
  const cropCss = (c) => `width:${pct(1 / c.vw)};height:${pct(1 / c.vh)};left:${pct(-c.x / c.vw)};top:${pct(-c.y / c.vh)};transform-origin:${pct(c.x + c.vw / 2)} ${pct(c.y + c.vh / 2)}`;

  /* frac: the frame's share of the viewport width on desktop, so sizes asks for the right file. */
  function picture(img, c, o) {
    const m = GA.dims(img, 'm');
    const set = m.w < img.w
      ? ` srcset="${GA.src(img, 'm')} ${m.w}w, ${GA.src(img, 'l')} ${img.w}w" sizes="(min-width: 900px) ${Math.ceil(((o.frac || 1) * 100) / c.vw)}vw, ${Math.ceil(100 / c.vw)}vw"`
      : '';
    const alt = o.alt != null ? o.alt : esc(img.alt);
    return `<img src="${GA.src(img, 'm')}"${set} width="${m.w}" height="${m.h}" alt="${alt}" loading="lazy" decoding="async" style="${cropCss(c)}">`;
  }

  /* --maxw keeps a frame from growing past the pixels its file actually has. */
  function frame(img, o) {
    const [rw, rh] = o.ratio;
    const c = fit(img, rw / rh, (o.parallax || 0) / 100);
    return `<div class="pp-fig ${o.cls || ''}" style="--maxw:${Math.floor(c.vw * img.w)}px">`
      + `<div class="media pp-crop" data-reveal="img"${o.parallax ? ` data-parallax="${o.parallax}"` : ''} style="aspect-ratio:${rw} / ${rh}">${picture(img, c, o)}</div></div>`;
  }

  /* ---------- Gallery rhythm ----------
     Cycle full bleed → pair → offset single. A portrait never goes full bleed: it pairs with the
     next image, or stands alone as an offset single when it is the last one. */
  function plan(items) {
    const rows = [];
    const cycle = ['full', 'pair', 'single'];
    for (let i = 0, step = 0; i < items.length; step++) {
      const a = items[i], b = items[i + 1];
      let kind = cycle[step % 3];
      if (kind === 'full' && orient(a) === 'p') { kind = b ? 'pair' : 'single'; step++; }
      else if (kind === 'pair' && !b) kind = 'single';
      rows.push({ kind, items: kind === 'pair' ? [a, b] : [a] });
      i += kind === 'pair' ? 2 : 1;
    }
    return rows;
  }

  const RATIO = {
    full: [16, 9],
    big: { l: [3, 2], s: [1, 1], p: [4, 5] },
    small: { l: [4, 3], s: [4, 5], p: [4, 5] },
    single: { l: [3, 2], s: [4, 5], p: [4, 5] },
  };

  const fullRow = (img) => frame(img, { ratio: RATIO.full, cls: 'pp-row pp-full', frac: 1, parallax: 3 });

  function pairRow(a, b, flip) {
    const big = flip ? b : a; // the mirrored pair leads with the small frame, so the images still read in order
    const small = flip ? a : b;
    const tall = orient(big) === 'p'; // a portrait gets one column less, so it stays within the screen height
    const bigFig = frame(big, { ratio: RATIO.big[orient(big)], cls: 'pp-fig--big', frac: tall ? 0.46 : 0.54 });
    const smallFig = frame(small, { ratio: RATIO.small[orient(small)], cls: 'pp-fig--small', frac: 0.3 });
    const cls = `grid pp-pair${flip ? ' pp-pair--flip' : ''}${tall ? ' pp-pair--tall' : ''}`;
    return `<div class="wrap pp-row"><div class="${cls}">${flip ? smallFig + bigFig : bigFig + smallFig}</div></div>`;
  }

  function singleRow(img, left) {
    const o = orient(img);
    const cls = `grid pp-single${left ? ' pp-single--left' : ''}${o === 'l' ? ' pp-single--wide' : ''}`;
    return `<div class="wrap pp-row"><div class="${cls}">${frame(img, { ratio: RATIO.single[o], frac: o === 'l' ? 0.6 : 0.4 })}</div></div>`;
  }

  /* ---------- Sections ---------- */
  const meta = [p.location, p.year].filter(Boolean).join(' · ');
  const hero = `<section class="page-hero pp-hero">`
    + (img0 ? `<div class="media pp-crop" data-parallax="4"><img src="${GA.src(img0, 'l')}" width="${img0.w}" height="${img0.h}" alt="${esc(img0.alt)}" fetchpriority="high" decoding="async"></div>` : '')
    + `<div class="wrap page-hero__content pp-hero__content" data-stagger="0.12">`
    + `<div class="pp-hero__row"><h1 class="h1 pp-hero__title" data-split>${esc(p.name)}</h1>`
    + (meta ? `<p class="label pp-hero__meta num" data-reveal>${esc(meta)}</p>` : '')
    + `</div></div></section>`;

  const specs = [['Location', p.location], ['Year', p.year], ['Scope', p.scope], ['Category', p.category]]
    .concat(Array.isArray(p.credits) ? p.credits : [])
    .filter((r) => Array.isArray(r) && r[1] != null && String(r[1]).trim() !== '');
  const details = `<section class="section pp-details"><h2 class="sr-only">Details</h2><div class="wrap"><div class="grid pp-details__grid">`
    + `<dl class="pp-spec" data-stagger="0.07">`
    + specs.map(([k, v]) => `<div class="pp-spec__row" data-reveal><dt class="label">${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join('')
    + `</dl>`
    + (summary ? `<p class="lead pp-summary" data-reveal>${esc(summary)}</p>` : '')
    + `</div></div></section>`;

  let pairs = 0, singles = 0;
  const rows = plan(imgs.slice(1)).map((r) => {
    const [a, b] = r.items;
    if (r.kind === 'full') return fullRow(a);
    if (r.kind === 'pair') return pairRow(a, b, pairs++ % 2 === 1);
    return singleRow(a, singles++ % 2 === 1);
  }).join('');
  const gallery = rows ? `<section class="pp-gallery"><h2 class="sr-only">Gallery</h2>${rows}</section>` : '';

  const nImg = next.images && next.images[0];
  const nextSection = `<section class="section pp-next" aria-labelledby="pp-next-label"><div class="wrap">`
    + `<div class="section-head" data-reveal><span class="label" id="pp-next-label">Next</span>`
    + `<a class="label link section-head__end" href="projects.html">All projects</a></div>`
    + `<a class="pp-next__link" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="Next">`
    + (nImg ? `<div class="media pp-crop zoom pp-next__media" data-reveal="img" style="aspect-ratio:3 / 2">${picture(nImg, fit(nImg, 3 / 2), { frac: 0.55, alt: '' })}</div>` : '')
    + `<h2 class="h2 pp-next__title" data-split>${esc(next.name)}</h2></a>`
    + `</div></section>`;

  main.innerHTML = hero + details + gallery + nextSection;

  /* ---------- Hero: crop to the live viewport, then settle in once the file has loaded ---------- */
  const heroEl = main.querySelector('.pp-hero');
  const heroMedia = heroEl.querySelector('.media');
  if (!heroMedia) return;
  const heroImg = heroMedia.querySelector('img');
  const fitHero = () => {
    const w = heroMedia.clientWidth, h = heroMedia.clientHeight;
    if (w && h) heroImg.style.cssText = cropCss(fit(img0, w / h, 0.04));
  };
  fitHero();
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fitHero); });
  const ready = () => requestAnimationFrame(() => heroEl.classList.add('is-ready'));
  if (heroImg.complete && heroImg.naturalWidth) requestAnimationFrame(ready);
  else {
    heroImg.addEventListener('load', ready, { once: true });
    heroImg.addEventListener('error', ready, { once: true });
  }
})();
