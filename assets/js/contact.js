/* Graha Adhistana — contact page: the enquiry form composes a WhatsApp message.
   Nothing is stored or posted anywhere: the text is built in the browser and handed to wa.me in a new tab. */
(() => {
  'use strict';

  const WA = 'https://wa.me/628881010688';
  const $ = (id) => document.getElementById(id);
  const form = $('enquiry-form');
  if (!form) return;

  const done = $('enquiry-done');
  const doneTitle = $('enquiry-done-title');
  const doneLead = $('enquiry-done-lead');
  const doneNote = $('enquiry-done-note');
  const again = $('enquiry-again');
  const key = $('enquiry-key');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  form.noValidate = true; // our own messages sit next to each field instead of browser bubbles

  const clean = (s) => s.trim().replace(/\s+/g, ' ');

  /* Each rule returns a message, or '' when the value is acceptable. */
  const rules = {
    'f-name': (el) => (clean(el.value) ? '' : 'Please enter your name.'),
    'f-phone': (el) => {
      const v = clean(el.value);
      if (!v) return 'Please enter your WhatsApp number.';
      const n = v.replace(/[\s().\/-]/g, '');
      // Indonesian 08… / +62… / 62… (mobile or landline), a bare 8… mobile, or any international +number
      const ok = /^(?:\+?62|0)\d{8,12}$/.test(n) || /^8\d{8,11}$/.test(n) || /^\+[1-9]\d{7,14}$/.test(n);
      return ok ? '' : 'Please check the number, e.g. 0812… or +62…';
    },
    'f-email': (el) => {
      const v = el.value.trim();
      return !v || /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(v) ? '' : 'Please check the email address.';
    },
    'f-plot': (el) => {
      if (el.validity.badInput) return 'Please use numbers only.';
      const v = el.value.trim();
      if (!v) return '';
      const n = Number(v);
      if (n <= 0) return 'Please enter a size above zero.';
      return n <= 1000000 ? '' : 'Please check the size.';
    },
  };
  const checked = Array.from(form.elements).filter((el) => rules[el.id]); // DOM order, so "first invalid" is the top one

  const setError = (el, msg) => {
    const err = $(el.id + '-error');
    el.closest('.field').classList.toggle('is-invalid', Boolean(msg));
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    if (err && err.textContent !== msg) err.textContent = msg;
  };
  const validate = (el) => {
    const msg = rules[el.id](el);
    setError(el, msg);
    return !msg;
  };

  // Scroll only when the target is hidden under the header or below the fold. Lenis (main.js) overwrites
  // native scrolling while its own wheel animation runs, so wait for that to settle; if the visitor is
  // still scrolling after a moment, leave the page where they put it.
  const root = document.documentElement;
  const bringIntoView = (el) => {
    let frames = 0;
    const go = () => {
      if (root.classList.contains('lenis-smooth')) {
        if (frames++ < 90) requestAnimationFrame(go);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.top < 110 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    };
    go();
  };

  let attempted = false;
  checked.forEach((el) => {
    let edited = false;
    el.addEventListener('input', () => {
      edited = true;
      // Clear a message as soon as the value is fixed, but never add one mid-typing.
      if (el.getAttribute('aria-invalid') === 'true' && !rules[el.id](el)) setError(el, '');
    });
    // A field the visitor merely tabbed through stays quiet until they try to send.
    el.addEventListener('blur', () => { if (edited || attempted || el.value) validate(el); });
  });

  const text = (id) => clean($(id).value);
  const choice = (id) => {
    const s = $(id);
    return s.value ? clean(s.options[s.selectedIndex].text) : '';
  };
  const compose = () => {
    const plot = $('f-plot').value.trim();
    const rows = [
      ['Name', text('f-name')],
      ['WhatsApp', text('f-phone')],
      ['Email', text('f-email')],
      ['Project', choice('f-project')],
      ['Location', text('f-location')],
      ['Plot size', plot && plot + ' m²'],
      ['Timeline', choice('f-timeline')],
    ].filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]);
    const note = $('f-message').value
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return ['Hello Graha Adhistana,', 'I would like to arrange a complimentary consultation.', '']
      .concat(rows, note ? ['', note] : [])
      .join('\n');
  };

  const showDone = (opened) => {
    doneLead.textContent = opened ? 'WhatsApp is opening with your message.' : 'WhatsApp did not open.';
    doneNote.textContent = opened ? 'Press send there to reach us.' : 'Your browser may have blocked the new tab. Use the link below.';
    form.hidden = true;
    if (key) key.hidden = true;
    done.hidden = false;
    doneTitle.focus({ preventScroll: true });
    bringIntoView(done);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    attempted = true;
    const invalid = checked.filter((el) => !validate(el));
    if (invalid.length) {
      invalid[0].focus({ preventScroll: true });
      bringIntoView(invalid[0].closest('.field'));
      return;
    }
    const url = WA + '?text=' + encodeURIComponent(compose());
    again.href = url;
    const win = window.open(url, '_blank');
    if (win) {
      try { win.opener = null; } catch (err) { /* already cross-origin */ }
    }
    showDone(Boolean(win));
  });

  $('enquiry-edit').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    if (key) key.hidden = false;
    const first = $('f-name');
    first.focus({ preventScroll: true });
    bringIntoView(first.closest('.field'));
  });
})();
