/* Tension Masters — price manager */
(function () {
  'use strict';

  var TM = window.TM;
  var STRINGS = window.TM_STRINGS || [];
  var PW_KEY = 'tm-admin-pw';
  var $ = function (id) { return document.getElementById(id); };

  var state = null;     // working copy of the settings
  var dirty = false;
  var password = '';
  var COSTS = {};      // private cost prices, sent by the API after login

  /* ---------- Session ---------- */
  function getPw() { try { return sessionStorage.getItem(PW_KEY) || ''; } catch (e) { return ''; } }
  function setPw(v) { try { v ? sessionStorage.setItem(PW_KEY, v) : sessionStorage.removeItem(PW_KEY); } catch (e) { /* ignore */ } }

  function api(body) {
    return fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + password },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Request failed (' + r.status + ')');
        return data;
      });
    });
  }

  function login(pw) {
    password = pw;
    return api({ check: true }).then(function (data) {
      setPw(pw);
      COSTS = data.costs || {};
      $('login-view').hidden = true;
      $('panel-view').hidden = false;
      $('storage-notice').hidden = !!data.configured;
      return start();
    });
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button');
    btn.disabled = true;
    $('login-error').textContent = '';
    login($('password').value).catch(function (err) {
      $('login-error').textContent = err.message === 'Wrong password' ? 'That password isn’t right.' : err.message;
    }).finally(function () { btn.disabled = false; });
  });

  $('logout').addEventListener('click', function () {
    if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
    setPw('');
    location.reload();
  });

  /* ---------- Load ---------- */
  function start() {
    return Promise.resolve(TM.ready).then(function () {
      var st = TM.settings();
      state = {
        prices: {},
        fees: { fourKnot: TM.fourKnotFee(), ownStrings: TM.ownStringsLabour() },
        hidden: st.hidden.slice(),
        popular: STRINGS.filter(function (s) { return TM.isPopular(s.id); }).map(function (s) { return s.id; }),
        sale: st.sale
      };
      ['BG65', 'BG80'].concat(STRINGS.map(function (s) { return s.id; })).forEach(function (id) {
        state.prices[id] = TM.unit(id).base;
      });
      fillForm();
      renderRows();
      setDirty(false);
      return fetch('/api/settings').then(function (r) { return r.json(); }).then(function (d) {
        $('updated-at').textContent = d.updatedAt
          ? 'Last published ' + new Date(d.updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Showing the default prices — nothing has been published from here yet.';
      }).catch(function () {});
    });
  }

  /* ---------- Form <-> state ---------- */
  function n(v) { var x = parseFloat(v); return isFinite(x) ? Math.round(x * 100) / 100 : null; }

  function fillForm() {
    $('price-BG65').value = state.prices.BG65;
    $('price-BG80').value = state.prices.BG80;
    $('fee-fourKnot').value = state.fees.fourKnot;
    $('fee-ownStrings').value = state.fees.ownStrings === null ? '' : state.fees.ownStrings;
    $('sale-active').checked = !!state.sale.active;
    $('sale-label').value = state.sale.label || '';
    $('sale-percent').value = state.sale.percent || '';
    $('sale-scope').value = state.sale.scope || 'all';
    $('sale-ends').value = state.sale.endsAt || '';
    saleSummary();
  }

  function readTop() {
    ['BG65', 'BG80'].forEach(function (id) {
      var v = n($('price-' + id).value);
      if (v !== null) state.prices[id] = v;
    });
    var fk = n($('fee-fourKnot').value);
    state.fees.fourKnot = fk === null ? 0 : fk;
    state.fees.ownStrings = n($('fee-ownStrings').value);
    state.sale.active = $('sale-active').checked;
    state.sale.label = $('sale-label').value.trim();
    state.sale.percent = Math.min(90, Math.max(0, Math.round(n($('sale-percent').value) || 0)));
    state.sale.scope = $('sale-scope').value;
    state.sale.endsAt = $('sale-ends').value;
  }

  function saleApplies(id) {
    var s = state.sale;
    if (!s.active || !(s.percent > 0)) return false;
    var std = id === 'BG65' || id === 'BG80';
    if (s.scope === 'standard') return std;
    if (s.scope === 'custom') return !std;
    if (s.scope === 'selected') return s.items.indexOf(id) !== -1;
    return true;
  }

  function salePrice(id) {
    return Math.round(state.prices[id] * (1 - state.sale.percent / 100) * 100) / 100;
  }

  function saleSummary() {
    var s = state.sale;
    var scopes = { all: 'everything', standard: 'BG65 & BG80', custom: 'build-your-own strings', selected: s.items.length + ' ticked string' + (s.items.length === 1 ? '' : 's') };
    $('sale-summary').textContent = s.active && s.percent > 0
      ? s.percent + '% off ' + scopes[s.scope] + (s.endsAt ? ', ending ' + new Date(s.endsAt + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '') + '.'
      : 'No sale running.';
    document.querySelector('.admin-sale').classList.toggle('is-on', !!(s.active && s.percent > 0));
  }

  /* ---------- Strings table ---------- */
  function renderRows() {
    var tbody = $('string-rows');
    var q = $('filter').value.trim().toLowerCase();
    tbody.replaceChildren();

    STRINGS.forEach(function (s) {
      var label = s.brand + ' ' + s.name;
      if (q && label.toLowerCase().indexOf(q) === -1) return;

      var tr = document.createElement('tr');
      if (state.hidden.indexOf(s.id) !== -1) tr.className = 'is-hidden';

      // Show
      var show = document.createElement('input');
      show.type = 'checkbox';
      show.checked = state.hidden.indexOf(s.id) === -1;
      show.setAttribute('aria-label', 'Show ' + label + ' on the website');
      show.addEventListener('change', function () {
        toggleIn(state.hidden, s.id, !show.checked);
        tr.classList.toggle('is-hidden', !show.checked);
        setDirty(true);
      });

      // Popular
      var star = document.createElement('button');
      star.type = 'button';
      star.className = 'star';
      star.textContent = '★';
      star.setAttribute('aria-label', 'Mark ' + label + ' as popular');
      star.setAttribute('aria-pressed', String(state.popular.indexOf(s.id) !== -1));
      star.addEventListener('click', function () {
        var on = star.getAttribute('aria-pressed') !== 'true';
        star.setAttribute('aria-pressed', String(on));
        toggleIn(state.popular, s.id, on);
        setDirty(true);
      });

      // Name
      var name = document.createElement('div');
      name.className = 'string-name';
      var strong = document.createElement('strong');
      strong.textContent = label;
      var sub = document.createElement('span');
      sub.textContent = s.gauge + ' · ' + s.colours.map(function (c) { return c.name; }).join(', ');
      name.append(strong, sub);

      // Price + profit
      var wrap = document.createElement('div');
      wrap.className = 'money';
      var pound = document.createElement('span'); pound.textContent = '£';
      var price = document.createElement('input');
      price.type = 'number'; price.min = '0'; price.step = '0.01'; price.inputMode = 'decimal';
      price.value = state.prices[s.id];
      price.setAttribute('aria-label', label + ' price');
      wrap.append(pound, price);

      var profit = document.createElement('span');
      var saleCell = document.createElement('div');
      saleCell.className = 'sale-cell';

      function paintProfit() {
        var p = state.prices[s.id];
        var effective = saleApplies(s.id) ? salePrice(s.id) : p;
        var c = COSTS[s.id] ? COSTS[s.id].cost : null;
        var pr = c === null ? null : Math.round((effective - c) * 100) / 100;
        profit.textContent = pr === null ? '—' : TM.fmt2(pr);
        profit.className = 'profit ' + (pr === null ? '' : pr < 10 ? 'low' : pr < 15 ? 'mid' : 'ok');
        profit.title = saleApplies(s.id) ? 'Profit at the sale price' : 'Profit per racket';

        saleCell.replaceChildren();
        if (state.sale.active && state.sale.scope === 'selected') {
          var tick = document.createElement('input');
          tick.type = 'checkbox';
          tick.checked = state.sale.items.indexOf(s.id) !== -1;
          tick.setAttribute('aria-label', 'Put ' + label + ' on sale');
          tick.addEventListener('change', function () {
            toggleIn(state.sale.items, s.id, tick.checked);
            setDirty(true);
            saleSummary();
            paintProfit();
          });
          saleCell.appendChild(tick);
        }
        var sp = document.createElement('span');
        sp.textContent = saleApplies(s.id) ? TM.fmt2(salePrice(s.id)) : '—';
        saleCell.appendChild(sp);
      }
      price.addEventListener('input', function () {
        var v = n(price.value);
        if (v !== null) { state.prices[s.id] = v; setDirty(true); paintProfit(); }
      });
      paintProfit();

      var cost = document.createElement('span');
      cost.className = 'cost';
      cost.textContent = COSTS[s.id] ? TM.fmt2(COSTS[s.id].cost) : '—';
      if (COSTS[s.id]) cost.title = 'Cheapest UK price seen: ' + COSTS[s.id].source;

      [[show], [star], [name], [cost, 'num'], [wrap, 'num'], [profit, 'num'], [saleCell, 'num sale-col']].forEach(function (c) {
        var td = document.createElement('td');
        if (c[1]) td.className = c[1];
        td.appendChild(c[0]);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.querySelector('.admin-table').classList.toggle('show-sale', !!(state.sale.active && state.sale.percent > 0));
  }

  function toggleIn(list, id, on) {
    var i = list.indexOf(id);
    if (on && i === -1) list.push(id);
    if (!on && i !== -1) list.splice(i, 1);
  }

  /* ---------- Events ---------- */
  document.querySelectorAll('#panel-view .admin-grid input, #panel-view .admin-grid select').forEach(function (el) {
    el.addEventListener('input', function () { readTop(); setDirty(true); saleSummary(); renderRows(); });
    el.addEventListener('change', function () { readTop(); setDirty(true); saleSummary(); renderRows(); });
  });
  $('filter').addEventListener('input', renderRows);
  $('reset-prices').addEventListener('click', function () {
    if (!confirm('Reset every build-your-own string to its suggested price (cost + £15)?')) return;
    STRINGS.forEach(function (s) { state.prices[s.id] = s.price; });
    setDirty(true);
    renderRows();
  });

  function setDirty(v) {
    dirty = v;
    $('save-state').textContent = v ? 'Unsaved changes' : 'All changes saved';
    $('save-state').classList.toggle('dirty', v);
  }

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  $('save').addEventListener('click', function () {
    readTop();
    var btn = $('save');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    api({ settings: state }).then(function (doc) {
      setDirty(false);
      toast('Saved — the website updates within a minute.');
      $('updated-at').textContent = 'Last published ' + new Date(doc.updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    }).catch(function (err) {
      toast(err.message, true);
      if (/password/i.test(err.message)) { setPw(''); location.reload(); }
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Save & publish';
    });
  });

  var toastTimer;
  function toast(msg, isError) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 4000);
  }

  // Auto-login for this browser tab
  var saved = getPw();
  if (saved) login(saved).catch(function () { setPw(''); });
})();
