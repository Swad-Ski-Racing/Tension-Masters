/* Tension Masters — shared pricing
   Defaults come from this file + strings.js. Live prices, sales and
   popular picks set in the admin panel are loaded from /api/settings
   and override the defaults. If the API is unreachable the site keeps
   working on the defaults. */
(function () {
  'use strict';

  var DEFAULTS = {
    prices: { BG65: 15, BG80: 20 },
    fees: { fourKnot: 4.23, ownStrings: null },
    hidden: [],
    popular: null, // null = use `popular: true` flags in strings.js
    sale: { active: false, label: '', percent: 0, scope: 'all', items: [], endsAt: '' }
  };

  var STANDARD = [
    { id: 'BG65', brand: 'Yonex', name: 'BG65 Titanium', standard: true },
    { id: 'BG80', brand: 'Yonex', name: 'BG80 Premium', standard: true }
  ];

  var settings = clone(DEFAULTS);
  var listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function num(n) { return typeof n === 'number' && isFinite(n) ? n : null; }

  function strings() { return window.TM_STRINGS || []; }

  function find(id) {
    for (var i = 0; i < STANDARD.length; i++) if (STANDARD[i].id === id) return STANDARD[i];
    var s = strings();
    for (var j = 0; j < s.length; j++) if (s[j].id === id) return s[j];
    return null;
  }

  function basePrice(id) {
    var o = num(settings.prices[id]);
    if (o !== null) return o;
    var item = find(id);
    return item && num(item.price) !== null ? item.price : null;
  }

  function saleActive() {
    var s = settings.sale;
    if (!s || !s.active || !(s.percent > 0)) return false;
    if (s.endsAt) {
      var end = new Date(s.endsAt + 'T23:59:59');
      if (!isNaN(end) && end < new Date()) return false;
    }
    return true;
  }

  function saleApplies(id) {
    if (!saleActive()) return false;
    var scope = settings.sale.scope;
    var isStandard = id === 'BG65' || id === 'BG80';
    if (scope === 'standard') return isStandard;
    if (scope === 'custom') return !isStandard;
    if (scope === 'selected') return (settings.sale.items || []).indexOf(id) !== -1;
    return true;
  }

  var TM = {
    STANDARD: STANDARD,

    fmt: function (n) {
      if (n === null || n === undefined) return '—';
      return '£' + (n % 1 ? n.toFixed(2) : String(n));
    },
    fmt2: function (n) { return '£' + n.toFixed(2); },

    unit: function (id) {
      var base = basePrice(id);
      if (base === null) return null;
      var onSale = saleApplies(id);
      return {
        base: base,
        price: onSale ? round2(base * (1 - settings.sale.percent / 100)) : base,
        onSale: onSale
      };
    },

    /* Hybrid strings can only be strung 4-knot, so the fee is unavoidable
       and must be included in the advertised price (DMCC Act 2024). */
    isHybrid: function (id) {
      var s = find(id);
      return !!(s && s.colours && s.colours[0] && s.colours[0].mains);
    },
    headline: function (id) {
      var u = TM.unit(id);
      if (!u) return null;
      return round2(u.price + (TM.isHybrid(id) ? TM.fourKnotFee() : 0));
    },

    fourKnotFee: function () { return num(settings.fees.fourKnot) !== null ? settings.fees.fourKnot : DEFAULTS.fees.fourKnot; },
    ownStringsLabour: function () { return num(settings.fees.ownStrings); },

    sale: function () { return saleActive() ? settings.sale : null; },

    isPopular: function (id) {
      if (Array.isArray(settings.popular)) return settings.popular.indexOf(id) !== -1;
      var s = find(id);
      return !!(s && s.popular);
    },

    /* Strings available in "Build your own" (hidden ones removed) */
    customStrings: function () {
      return strings().filter(function (s) {
        return settings.hidden.indexOf(s.id) === -1 && basePrice(s.id) !== null;
      });
    },

    customFrom: function () {
      var list = TM.customStrings();
      if (!list.length) return null;
      return Math.min.apply(null, list.map(function (s) { return TM.headline(s.id); }));
    },

    lowestFrom: function () {
      var a = [TM.unit('BG65'), TM.unit('BG80')].filter(Boolean).map(function (u) { return u.price; });
      var c = TM.customFrom();
      if (c !== null) a.push(c);
      return Math.min.apply(null, a);
    },

    settings: function () { return clone(settings); },
    defaults: function () { return clone(DEFAULTS); },

    onChange: function (fn) { listeners.push(fn); },

    apply: function (remote) {
      settings = clone(DEFAULTS);
      if (remote && typeof remote === 'object') {
        if (remote.prices) for (var k in remote.prices) settings.prices[k] = remote.prices[k];
        if (remote.fees) for (var f in remote.fees) settings.fees[f] = remote.fees[f];
        if (Array.isArray(remote.hidden)) settings.hidden = remote.hidden;
        if (Array.isArray(remote.popular)) settings.popular = remote.popular;
        if (remote.sale) settings.sale = remote.sale;
      }
      paintLabels();
      listeners.forEach(function (fn) { fn(); });
    }
  };

  /* ---------- Price labels in the page ----------
     data-price="BG65"     → that item's price (with sale strike-through)
     data-price-from       → lowest price overall ("from £x")
     data-custom-from      → "from £x" for Build your own
     data-custom-count     → number of strings available
     data-sale-banner      → shown while a sale is running */
  function paintLabels() {
    document.querySelectorAll('[data-price]').forEach(function (el) {
      var u = TM.unit(el.getAttribute('data-price'));
      if (!u) return;
      el.replaceChildren();
      if (u.onSale) {
        var was = document.createElement('s');
        was.className = 'was-price';
        was.textContent = TM.fmt(u.base);
        el.append(was, ' ');
      }
      el.append(TM.fmt(u.price));
    });
    var from = TM.lowestFrom();
    document.querySelectorAll('[data-price-from]').forEach(function (el) { el.textContent = TM.fmt(from); });
    var cf = TM.customFrom();
    document.querySelectorAll('[data-custom-from]').forEach(function (el) {
      el.textContent = cf === null ? 'Custom' : 'from ' + TM.fmt(cf);
    });
    document.querySelectorAll('[data-custom-count]').forEach(function (el) {
      el.textContent = TM.customStrings().length;
    });
    document.querySelectorAll('[data-fee="fourKnot"]').forEach(function (el) { el.textContent = TM.fmt(TM.fourKnotFee()); });
    var labour = TM.ownStringsLabour();
    document.querySelectorAll('[data-own-strings]').forEach(function (el) { el.textContent = labour === null ? 'Quote' : TM.fmt(labour); });
    var sale = TM.sale();
    document.documentElement.classList.toggle('has-sale', !!sale && !!document.querySelector('[data-sale-banner]'));
    document.querySelectorAll('[data-sale-banner]').forEach(function (el) {
      el.hidden = !sale;
      if (!sale) return;
      var text = el.querySelector('[data-sale-text]');
      var scopeText = { all: 'all restrings', standard: 'BG65 & BG80 restrings', custom: 'Build your own strings', selected: 'selected strings' }[sale.scope] || 'restrings';
      text.textContent = (sale.label ? sale.label + ' — ' : '') + sale.percent + '% off ' + scopeText +
        (sale.endsAt ? ' until ' + new Date(sale.endsAt + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : '') + '.';
    });
  }

  window.TM = TM;

  // Paint defaults straight away, then load live settings
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintLabels);
  else paintLabels();

  TM.ready = fetch('/api/settings', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data && data.settings) TM.apply(data.settings); })
    .catch(function () { /* offline / not configured — keep defaults */ });
})();
