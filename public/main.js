/* Tension Masters — site interactions */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ---------- Header + mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var mobileCta = document.querySelector('.mobile-cta');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (mobileCta) {
      var nearForm = false;
      ['book', 'site-footer'].forEach(function (id) {
        var el = document.getElementById(id) || document.querySelector('.' + id);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) nearForm = true;
      });
      mobileCta.classList.toggle('show', y > 480 && !nearForm);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .meter');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Click-to-load maps (no third-party cookies until asked) ---------- */
  document.querySelectorAll('[data-load-map]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var frame = btn.parentNode.querySelector('iframe[data-src]');
      frame.src = frame.getAttribute('data-src');
      frame.hidden = false;
      btn.remove();
    });
  });

  /* ---------- Booking form ---------- */
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  var TM = window.TM;
  var LABELS = {
    BG65: 'Yonex BG65 Titanium',
    BG80: 'Yonex BG80 Premium',
    Other: 'Own strings (labour only)'
  };

  var rackets = form.querySelector('#rackets');
  var minus = form.querySelector('[data-step="-1"]');
  var plus = form.querySelector('[data-step="1"]');
  var sumString = document.getElementById('sum-string');
  var sumQty = document.getElementById('sum-qty');
  var sumLoc = document.getElementById('sum-loc');
  var sumTotal = document.getElementById('sum-total');
  var status = document.getElementById('form-status');
  var statusText = status ? status.querySelector('.status-text') : null;
  var submitBtn = form.querySelector('button[type="submit"]');
  var sumExtras = document.getElementById('sum-extras');
  var invoiceTotal = form.querySelector('input[name="Invoice total"]');
  var invoiceLines = form.querySelector('input[name="Invoice breakdown"]');

  // Pricing card buttons pre-select their string in the form
  document.querySelectorAll('[data-pick]').forEach(function (link) {
    link.addEventListener('click', function () {
      var input = form.querySelector('input[name="strings"][value="' + link.getAttribute('data-pick') + '"]');
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  function clampQty() {
    var n = parseInt(rackets.value, 10);
    if (isNaN(n)) n = 1;
    n = Math.max(1, Math.min(10, n));
    return n;
  }

  /* Works out the order and the invoice Isaac sends.
     Returns { lines: [{label, amount}], total, quote } */
  function quote() {
    var s = form.querySelector('input[name="strings"]:checked');
    var key = s ? s.value : 'BG65';
    var qty = clampQty();
    var lines = [];
    var total = 0;
    var needsQuote = false;
    var label = LABELS[key] || key;
    var custom = null;

    function add(text, unit) {
      var amount = Math.round(unit * qty * 100) / 100;
      lines.push({ label: qty + ' × ' + text + ' @ ' + TM.fmt2(unit), amount: amount });
      total += amount;
    }

    if (key === 'Other') {
      var labour = TM.ownStringsLabour();
      if (labour !== null) add('Labour only (own strings)', labour);
      else { needsQuote = true; lines.push({ label: 'Labour only (own strings) — price to agree', amount: null }); }
    } else {
      var id = key;
      if (key === 'Custom' && window.TMDesigner) {
        custom = window.TMDesigner.current();
        id = custom.id;
        label = custom.label + ' — ' + custom.colours;
      }
      var u = TM.unit(id);
      add(label + (u.onSale ? ' (sale, was ' + TM.fmt2(u.base) + ')' : ''), u.price);
      if (custom) {
        if (custom.knots === 4) add('4-knot stringing (two-piece)', TM.fourKnotFee());
        else lines.push({ label: '2-knot stringing (one-piece) — free', amount: 0 });
      }
    }
    lines.push({ label: 'Drop-off & collection — free', amount: 0 });
    total = Math.round(total * 100) / 100;
    return { lines: lines, total: total, quote: needsQuote, label: label, custom: custom };
  }

  function update() {
    var d = form.querySelector('input[name="delivery"]:checked');
    var qty = clampQty();
    var q = quote();

    minus.disabled = qty <= 1;
    plus.disabled = qty >= 10;

    sumString.textContent = q.label;
    sumQty.textContent = qty + (qty === 1 ? ' racket' : ' rackets');
    sumLoc.textContent = d ? d.getAttribute('data-short') : '—';

    // Extra summary rows: knots + sale savings
    sumExtras.replaceChildren();
    function row(a, b) {
      var div = document.createElement('div');
      div.className = 'summary-row';
      var x = document.createElement('span'); x.textContent = a;
      var y = document.createElement('span'); y.textContent = b;
      div.append(x, y);
      sumExtras.appendChild(div);
    }
    if (q.custom) {
      row('Stringing', q.custom.knots === 4 ? '4 knots +' + TM.fmt(TM.fourKnotFee()) + ' each' : '2 knots (free)');
    }
    var sale = TM.sale();
    var key = (form.querySelector('input[name="strings"]:checked') || {}).value;
    var saleId = q.custom ? q.custom.id : key;
    var u = saleId && saleId !== 'Other' ? TM.unit(saleId) : null;
    if (sale && u && u.onSale) {
      row('Sale saving', '−' + TM.fmt2(Math.round((u.base - u.price) * qty * 100) / 100));
    }

    var text = q.quote ? 'Quote' : TM.fmt(q.total);
    if (sumTotal.textContent !== text) {
      sumTotal.textContent = text;
      sumTotal.classList.remove('bump');
      void sumTotal.offsetWidth;
      sumTotal.classList.add('bump');
      setTimeout(function () { sumTotal.classList.remove('bump'); }, 250);
    }

    // Invoice fields for the Formspree email
    invoiceTotal.value = q.quote ? 'QUOTE NEEDED — labour price not set' : TM.fmt2(q.total);
    invoiceLines.value = q.lines.map(function (l) {
      return l.label + (l.amount ? ' = ' + TM.fmt2(l.amount) : '');
    }).join(' | ') + ' | TOTAL TO INVOICE: ' + (q.quote ? 'to agree' : TM.fmt2(q.total));
  }

  [minus, plus].forEach(function (btn) {
    btn.addEventListener('click', function () {
      rackets.value = clampQty() + parseInt(btn.getAttribute('data-step'), 10);
      rackets.value = clampQty();
      update();
    });
  });
  rackets.addEventListener('change', function () { rackets.value = clampQty(); update(); });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  TM.onChange(update);
  update();

  function showStatus(type, title, detail) {
    status.className = 'form-status show ' + type;
    status.querySelector('.icon-ok').style.display = type === 'success' ? '' : 'none';
    status.querySelector('.icon-err').style.display = type === 'error' ? '' : 'none';
    var strong = document.createElement('strong');
    strong.textContent = title;
    statusText.replaceChildren(strong, document.createTextNode(' ' + detail));
    status.focus();
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.querySelector('.btn-label').textContent = 'Sending…';

    try {
      var response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        form.reset();
        update();
        showStatus('success', 'Booking request sent!', 'Isaac will be in touch shortly to confirm your drop-off time.');
      } else {
        var data = {};
        try { data = await response.json(); } catch (e) { /* ignore */ }
        var msg = data && data.errors ? data.errors.map(function (e) { return e.message; }).join(', ') : 'Something went wrong.';
        showStatus('error', msg, 'Please try again, or call 07359 265035.');
      }
    } catch (error) {
      showStatus('error', 'We couldn’t send your request.', 'Please check your connection and try again.');
    } finally {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.querySelector('.btn-label').textContent = 'Send booking request';
    }
  });
})();
