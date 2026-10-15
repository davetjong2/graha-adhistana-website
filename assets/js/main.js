/* Graha Adhistana — shared behaviour. Vanilla JS, no build step.
   Everything degrades: without JS (or with reduced motion) content is static and visible. */
(() => {
  'use strict';
  window.__ga = true; // tells the inline head guard that main.js is alive

  const doc = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const session = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ---------- Smooth scroll (Lenis, optional) ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.3, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  };
  const skip = $('.skip-link');
  const mainEl = $('#main');
  if (skip && mainEl) skip.addEventListener('click', (e) => {
    e.preventDefault();
    mainEl.setAttribute('tabindex', '-1');
    mainEl.focus({ preventScroll: true });
    scrollToTarget(mainEl);
  });
  $$('[data-top]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); scrollToTarget(0); }));
  $$('a[href^="#"]:not([href="#"])').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (t) { e.preventDefault(); scrollToTarget(t); }
  }));

  /* ---------- Active nav ---------- */
  const page = body.dataset.page;
  $$('[data-nav]').forEach((a) => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); });

  /* ---------- Header: solid after scroll, hides on the way down ---------- */
  const header = $('.site-header');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-solid', y > 40);
      const goingDown = y > lastY + 2 && y > 480;
      const goingUp = y < lastY - 2;
      if (goingDown && !doc.classList.contains('menu-open')) header.classList.add('is-hidden');
      else if (goingUp || y < 480) header.classList.remove('is-hidden');
    }
    lastY = y;
    updateParallax();
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Menu overlay ---------- */
  const menu = $('#menu');
  const toggle = $('.menu-toggle');
  const setMenu = (open) => {
    if (!menu || !toggle) return;
    doc.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    const label = $('.menu-toggle__label', toggle);
    if (label) label.textContent = open ? 'Close' : 'Menu';
    menu.setAttribute('aria-hidden', String(!open));
    if (open) { menu.removeAttribute('inert'); if (lenis) lenis.stop(); }
    else { menu.setAttribute('inert', ''); if (lenis) lenis.start(); }
  };
  if (menu && toggle) {
    menu.setAttribute('inert', '');
    toggle.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); toggle.focus(); } });
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  }

  /* ---------- Split headings into masked words ---------- */
  const split = (el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const s = document.createElement('span');
            s.textContent = part;
            s.style.setProperty('--i', i++);
            w.appendChild(s);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  };
  if (!reduce) $$('[data-split]').forEach(split);

  /* ---------- Stagger groups ---------- */
  const stagger = (root) => $$('[data-stagger]', root).concat(root !== document && root.matches && root.matches('[data-stagger]') ? [root] : []).forEach((group) => {
    const step = parseFloat(group.dataset.stagger) || 0.09;
    $$('[data-reveal], [data-split]', group).forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * step).toFixed(2) + 's');
    });
  });
  stagger(document);

  /* ---------- Reveal on scroll ---------- */
  let io = null;
  const observe = (root) => {
    const targets = $$('[data-reveal]:not(.is-in), [data-split]:not(.is-in)', root);
    if (root !== document && root.matches && root.matches('[data-reveal], [data-split]')) targets.push(root);
    if (!io) { targets.forEach((el) => el.classList.add('is-in')); return; }
    targets.forEach((el) => io.observe(el));
  };
  const startReveal = () => {
    if (!reduce && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0 });
    }
    observe(document);
  };

  /* ---------- Lazy image fade-in ---------- */
  const lazyFade = (root) => $$('.media img[loading="lazy"]:not(.is-loaded)', root).forEach((img) => {
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else {
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
    }
  });
  lazyFade(document);

  /* ---------- Parallax (images inside [data-parallax]) ---------- */
  const parallaxEls = reduce ? [] : $$('[data-parallax]');
  function updateParallax() {
    if (!parallaxEls.length) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 … 1
      const amount = parseFloat(el.dataset.parallax) || 7;
      el.style.setProperty('--py', (progress * amount).toFixed(2) + '%');
    });
  }
  updateParallax();
  window.addEventListener('resize', updateParallax);

  /* ---------- Cursor label for [data-cursor] (e.g. "View") ---------- */
  if (finePointer && !reduce) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor__dot"></span>';
    body.appendChild(cursor);
    const dot = cursor.firstChild;
    let x = -200, y = -200, tx = -200, ty = -200;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (!t) return;
      dot.textContent = t.dataset.cursor || 'View';
      cursor.classList.toggle('is-dark', t.hasAttribute('data-cursor-dark'));
      cursor.classList.add('is-active');
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cursor.classList.remove('is-active');
    });
  }

  /* ---------- Floating image preview for [data-preview="img/url.jpg"] ---------- */
  let bindPreview = () => {};
  if (finePointer && !reduce) {
    const pv = document.createElement('div');
    pv.className = 'preview';
    pv.setAttribute('aria-hidden', 'true');
    pv.innerHTML = '<img alt="">';
    body.appendChild(pv);
    const pvImg = pv.firstChild;
    let px = 0, py = 0, cx = 0, cy = 0, running = false;
    const follow = () => {
      cx += (px - cx) * 0.12; cy += (py - cy) * 0.12;
      pv.style.transform = `translate3d(${(cx + 28).toFixed(1)}px, ${(cy - pv.offsetHeight / 2).toFixed(1)}px, 0)`;
      if (running) requestAnimationFrame(follow);
    };
    bindPreview = (root) => $$('[data-preview]:not([data-preview-bound])', root).forEach((el) => {
      el.setAttribute('data-preview-bound', '');
      const img = new Image();
      img.src = el.dataset.preview; // warm the cache
      el.addEventListener('pointerenter', (e) => {
        pvImg.src = el.dataset.preview;
        px = cx = e.clientX; py = cy = e.clientY;
        pv.classList.add('is-on');
        if (!running) { running = true; follow(); }
      });
      el.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; });
      el.addEventListener('pointerleave', () => { pv.classList.remove('is-on'); running = false; });
    });
    bindPreview(document);
  }

  /* ---------- Drag to scroll for .h-scroll ---------- */
  $$('.h-scroll').forEach((el) => {
    let down = false, startX = 0, startLeft = 0, moved = false;
    el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; el.classList.add('is-dragging'); }
      el.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => { if (!down) return; down = false; el.classList.remove('is-dragging'); });
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  /* ---------- Home hero slideshow ([data-hero]) ---------- */
  const hero = $('[data-hero]');
  const startHero = () => {
    if (!hero) return;
    const slides = $$('.hero__slide', hero);
    if (slides.length < 2) return;
    const ms = parseInt(hero.dataset.interval, 10) || 6500;
    hero.style.setProperty('--hero-ms', ms + 'ms');
    const count = $('[data-hero-index]', hero);
    const caption = $('[data-hero-caption]', hero);
    const bar = $('[data-hero-progress]', hero);
    const pauseBtn = $('[data-hero-pause]', hero);
    let idx = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
    let timer = null;
    let playing = !reduce;
    const runBar = () => {
      if (!bar) return;
      bar.classList.remove('is-running');
      void bar.offsetWidth; // restart the CSS transition
      if (playing) bar.classList.add('is-running');
    };
    const go = (n) => {
      slides[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (count) count.textContent = String(idx + 1).padStart(2, '0');
      if (caption) caption.textContent = slides[idx].dataset.caption || '';
      runBar();
    };
    const schedule = () => { clearInterval(timer); if (playing) timer = setInterval(() => go(idx + 1), ms); };
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        playing = !playing;
        pauseBtn.setAttribute('aria-pressed', String(!playing));
        pauseBtn.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
        pauseBtn.innerHTML = playing
          ? '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8M8 1v8" stroke="currentColor" stroke-width="1.2"/></svg>'
          : '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>';
        runBar();
        schedule();
      });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(timer); else schedule(); });
    runBar();
    schedule();
  };

  /* ---------- Public hook: call GAUI.refresh(node) after inserting content ---------- */
  window.GAUI = {
    lenis,
    scrollTo(target, immediate = true) { if (lenis) lenis.scrollTo(target, { immediate }); else window.scrollTo(0, typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY); },
    refresh(root = document) {
      if (!reduce) $$('[data-split]:not(.split)', root).forEach(split);
      stagger(root);
      lazyFade(root);
      bindPreview(root);
      observe(root);
    },
  };

  /* ---------- Small helpers ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Intro preloader (home, once per session) ---------- */
  const begin = () => { startReveal(); startHero(); onScroll(); };
  if (body.hasAttribute('data-preloader') && !reduce && !session.get('ga-intro')) {
    session.set('ga-intro', '1');
    const pl = document.createElement('div');
    pl.className = 'preloader';
    pl.setAttribute('aria-hidden', 'true');
    pl.innerHTML = '<div class="preloader__inner"><span class="brand__mark"></span><span class="preloader__word">Graha Adhistana</span><span class="preloader__line"></span><span class="label preloader__sub">Design &amp; Build &middot; Since 2002</span></div>';
    body.appendChild(pl);
    doc.classList.add('is-loading');
    if (lenis) lenis.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => pl.classList.add('is-run')));
    setTimeout(() => {
      pl.classList.add('is-done');
      doc.classList.remove('is-loading');
      if (lenis) lenis.start();
      setTimeout(begin, 350);
      setTimeout(() => pl.remove(), 1400);
    }, 2100);
  } else {
    begin();
  }
})();
