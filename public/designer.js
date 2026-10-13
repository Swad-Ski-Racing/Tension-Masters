/* Tension Masters — "Build your own" racket designer
   String data lives in strings.js; live prices/popular picks in pricing.js (window.TM). */
(function () {
  'use strict';

  var TM = window.TM;
  var form = document.getElementById('inquiry-form');
  var panel = document.getElementById('designer');
  if (!form || !panel || !TM || !TM.customStrings().length) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FRAMES = [
    { name: 'Black', hex: '#16181f' },
    { name: 'White', hex: '#eef0f5' },
    { name: 'Navy', hex: '#1b2c7a' },
    { name: 'Red', hex: '#d7263d' },
    { name: 'Orange', hex: '#ff7a1a' },
    { name: 'Green', hex: '#14a76c' },
    { name: 'Purple', hex: '#7b3fe4' },
    { name: 'Silver', hex: '#a9b0bf' }
  ];

  var stringSelect = panel.querySelector('#custom-string');
  var stringInfo = panel.querySelector('#string-info');
  var mainsWrap = panel.querySelector('#mains-swatches');
  var crossWrap = panel.querySelector('#cross-swatches');
  var crossField = panel.querySelector('#cross-field');
  var twoTone = panel.querySelector('#two-tone');
  var frameWrap = panel.querySelector('#frame-swatches');
  var caption = panel.querySelector('#preview-caption');
  var priceOut = panel.querySelector('#designer-price');
  var svg = panel.querySelector('#racket-svg');
  var customRadio = form.querySelector('input[name="strings"][value="Custom"]');
  var knot2 = panel.querySelector('input[name="knots"][value^="2"]');
  var knot4 = panel.querySelector('input[name="knots"][value^="4"]');
  var knotHint = panel.querySelector('#knot-hint');
  var knotLegend = panel.querySelector('#knot-legend');
  var mainsLabel = panel.querySelector('#mains-label');
  var hiddenString = panel.querySelector('input[name="custom_string"]');
  var priceNote = panel.querySelector('#designer-price-note');
  var picks = panel.querySelector('#popular-picks');

  var state = { string: TM.customStrings()[0], mains: null, cross: null, frame: FRAMES[0] };

  /* ---------- Build the racket SVG ---------- */
  var CX = 150, CY = 190, RX = 100, RY = 132;
  var mainsGroup, crossGroup, knotsGroup, frameEls = [];

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG_NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildRacket() {
    var defs = el('defs', {}, svg);
    var clip = el('clipPath', { id: 'head-clip' }, defs);
    el('ellipse', { cx: CX, cy: CY, rx: RX - 7, ry: RY - 7 }, clip);

    var shine = el('linearGradient', { id: 'frame-shine', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.45' }, shine);
    el('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0' }, shine);
    el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0.25' }, shine);

    var arrow = el('marker', { id: 'knot-arrow', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#d7ff3a' }, arrow);

    var wrapClip = el('clipPath', { id: 'grip-clip' }, defs);
    el('rect', { x: 134, y: 500, width: 32, height: 124, rx: 9 }, wrapClip);

    // Throat + shaft
    var throat = el('path', {
      d: 'M108 300 Q138 350 145 410 L155 410 Q162 350 192 300',
      fill: 'none', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, svg);
    var shaft = el('rect', { x: 145.5, y: 405, width: 9, height: 100, rx: 3 }, svg);
    frameEls.push({ node: throat, attr: 'stroke' }, { node: shaft, attr: 'fill' });

    // Handle
    var grip = el('rect', { x: 134, y: 500, width: 32, height: 124, rx: 9, fill: '#1d2030' }, svg);
    var wraps = el('g', { 'clip-path': 'url(#grip-clip)', stroke: 'rgba(255,255,255,0.12)', 'stroke-width': 2 }, svg);
    for (var y = 492; y < 640; y += 11) el('line', { x1: 130, y1: y + 14, x2: 170, y2: y }, wraps);
    var cap = el('rect', { x: 131, y: 618, width: 38, height: 14, rx: 6 }, svg);
    frameEls.push({ node: cap, attr: 'fill' });
    el('rect', { x: 134, y: 500, width: 32, height: 6, rx: 3, fill: 'rgba(0,0,0,0.35)' }, svg);
    void grip;

    // String bed
    var bed = el('g', { 'clip-path': 'url(#head-clip)' }, svg);
    el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'rgba(255,255,255,0.03)' }, bed);
    crossGroup = el('g', { 'stroke-width': 2.1, 'stroke-linecap': 'round' }, bed);
    mainsGroup = el('g', { 'stroke-width': 2.4, 'stroke-linecap': 'round' }, bed);

    var i = 0;
    for (var cy = CY - RY + 14; cy <= CY + RY - 10; cy += 10.5) {
      el('line', { x1: CX - RX, y1: cy, x2: CX + RX, y2: cy, pathLength: 1, style: '--i:' + (i++) }, crossGroup);
    }
    i = 0;
    for (var cx = CX - 85.5; cx <= CX + 86; cx += 9) {
      el('line', { x1: cx, y1: CY - RY, x2: cx, y2: CY + RY, pathLength: 1, style: '--i:' + (i++) }, mainsGroup);
    }

    // Frame
    var frame = el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', 'stroke-width': 13 }, svg);
    el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', 'stroke-width': 13, stroke: 'url(#frame-shine)' }, svg);
    el('ellipse', { cx: CX, cy: CY, rx: RX - 6.5, ry: RY - 6.5, fill: 'none', 'stroke-width': 1.2, stroke: 'rgba(0,0,0,0.35)' }, svg);
    frameEls.push({ node: frame, attr: 'stroke' });

    // Stencil
    var stencil = el('text', {
      x: CX, y: CY + 8, 'text-anchor': 'middle', 'font-family': 'Sora, sans-serif',
      'font-weight': 800, 'font-size': 26, fill: 'rgba(5,11,46,0.16)', 'letter-spacing': 2
    }, svg);
    stencil.textContent = 'TM';

    knotsGroup = el('g', { class: 'knots' }, svg);
  }

  /* ---------- Knots ----------
     2 knots (one-piece): mains strung from the centre out. The short side
     ties off at the throat (knot 1); the long side carries on over the top
     into the crosses, which weave down and tie off at the bottom (knot 2).
     4 knots (two-piece): mains and crosses are separate lengths, two knots
     each — needed for two-tone colours and hybrid strings. */
  var KNOT_COLOURS = { mains: '#d7ff3a', cross: '#2fd6ff' };
  var KNOT_LAYOUTS = {
    2: [
      { t: 64, type: 'mains', title: 'Knot 1 — mains tie-off at the throat' },
      { t: 116, type: 'cross', title: 'Knot 2 — last cross tie-off' }
    ],
    4: [
      { t: 66, type: 'mains', title: 'Knot 1 — mains tie-off (right)' },
      { t: 114, type: 'mains', title: 'Knot 2 — mains tie-off (left)' },
      { t: 236, type: 'cross', title: 'Knot 3 — crosses start at the top' },
      { t: 96, type: 'cross', title: 'Knot 4 — crosses tie-off at the bottom' }
    ]
  };

  function onFrame(deg, grow) {
    var r = deg * Math.PI / 180;
    return { x: CX + (RX + (grow || 0)) * Math.cos(r), y: CY + (RY + (grow || 0)) * Math.sin(r) };
  }

  function arcPath(from, to, grow) {
    var d = '';
    var step = from < to ? 2 : -2;
    for (var a = from; step > 0 ? a <= to : a >= to; a += step) {
      var p = onFrame(a, grow);
      d += (d ? ' L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
    }
    return d;
  }

  function drawKnots(count) {
    knotsGroup.replaceChildren();

    if (count === 2) {
      // One-piece: long-side main runs over the top into the first cross
      var flow = el('path', {
        d: arcPath(250, 274, 15), class: 'knot-flow', fill: 'none',
        stroke: KNOT_COLOURS.mains, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'marker-end': 'url(#knot-arrow)'
      }, knotsGroup);
      el('title', {}, flow).textContent = 'One piece: the last main carries straight on into the crosses';
    }

    KNOT_LAYOUTS[count].forEach(function (k, i) {
      var p = onFrame(k.t, 0);
      var g = el('g', { class: 'knot', style: '--k:' + i, transform: 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')' }, knotsGroup);
      el('title', {}, g).textContent = k.title;
      el('circle', { r: 9, class: 'knot-pulse', fill: KNOT_COLOURS[k.type] }, g);
      el('circle', { r: 8.5, fill: KNOT_COLOURS[k.type], stroke: '#050b2e', 'stroke-width': 2 }, g);
      var n = el('text', {
        y: 3.6, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif',
        'font-weight': 800, 'font-size': 10, fill: '#050b2e'
      }, g);
      n.textContent = i + 1;
    });

    knotLegend.replaceChildren();
    var note = document.createElement('p');
    note.textContent = count === 2
      ? 'One continuous string: the mains finish and carry straight on into the crosses, so there are only 2 knots.'
      : 'Mains and crosses are strung as two separate pieces, with 2 knots each.';
    var keys = document.createElement('div');
    keys.className = 'knot-keys';
    [['mains', 'Mains knot'], ['cross', 'Crosses knot']].forEach(function (k) {
      var span = document.createElement('span');
      var dot = document.createElement('i');
      dot.style.background = KNOT_COLOURS[k[0]];
      span.append(dot, document.createTextNode(k[1]));
      keys.appendChild(span);
    });
    knotLegend.append(keys, note);
  }

  function knotCount() {
    var forced = twoTone.checked || !!state.mains.mains;
    knot2.disabled = forced || !customRadio.checked;
    if (forced) knot4.checked = true;
    knotHint.hidden = !forced;
    knotHint.textContent = state.mains.mains
      ? 'Hybrid strings use two different gauges, so they’re always strung with 4 knots.'
      : 'Two-tone needs separate mains and crosses, so it’s strung with 4 knots.';
    return knot2.checked ? 2 : 4;
  }

  /* ---------- Helpers ---------- */
  var money = TM.fmt;

  function swatch(groupName, colour, checked, submit) {
    var label = document.createElement('label');
    label.className = 'swatch';
    label.title = colour.name;
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = groupName;
    input.value = colour.name;
    input.checked = checked;
    input.defaultChecked = checked;
    if (!submit) input.setAttribute('form', 'designer-preview-only');
    var dot = document.createElement('span');
    dot.className = 'swatch-dot';
    dot.style.setProperty('--c', colour.mains
      ? 'linear-gradient(135deg, ' + colour.mains + ' 50%, ' + colour.hex + ' 50%)'
      : colour.hex);
    var txt = document.createElement('span');
    txt.className = 'sr-only';
    txt.textContent = colour.name;
    label.append(input, dot, txt);
    input.addEventListener('change', function () {
      if (groupName === 'mains_colour') state.mains = colour;
      else if (groupName === 'crosses_colour') state.cross = colour;
      else state.frame = colour;
      render(groupName !== 'frame');
    });
    return label;
  }

  function fillSwatches(wrap, name, colours, current, submit) {
    wrap.replaceChildren();
    colours.forEach(function (c) {
      wrap.appendChild(swatch(name, c, current && c.name === current.name, submit));
    });
  }

  function pickColour(colours, current, fallbackIndex) {
    if (current) {
      for (var i = 0; i < colours.length; i++) if (colours[i].name === current.name) return colours[i];
    }
    return colours[Math.min(fallbackIndex, colours.length - 1)];
  }

  function restringAnimation() {
    [mainsGroup, crossGroup].forEach(function (g) {
      g.classList.remove('restring');
      void g.getBoundingClientRect();
      g.classList.add('restring');
    });
  }

  /* ---------- Render ---------- */
  function render(animate) {
    var s = state.string;
    var hybrid = !!state.mains.mains;
    var cross = twoTone.checked && !hybrid ? state.cross : state.mains;

    mainsGroup.setAttribute('stroke', hybrid ? state.mains.mains : state.mains.hex);
    crossGroup.setAttribute('stroke', cross.hex);
    frameEls.forEach(function (f) { f.node.setAttribute(f.attr, state.frame.hex); });

    var u = TM.unit(s.id);
    var fee = knot2.checked ? 0 : TM.fourKnotFee();

    stringInfo.replaceChildren();
    [['Gauge', s.gauge], ['Feel', s.character], ['String & labour', money(u.price)]].forEach(function (row) {
      var div = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = row[0];
      var dd = document.createElement('dd'); dd.textContent = row[1];
      div.append(dt, dd);
      stringInfo.appendChild(div);
    });

    caption.textContent = s.brand + ' ' + s.name + ' · ' + state.mains.name +
      (twoTone.checked && cross.name !== state.mains.name ? ' / ' + cross.name : '');
    hiddenString.value = s.brand + ' ' + s.name + ' (' + s.gauge + ')';

    crossField.hidden = !twoTone.checked;
    crossWrap.querySelectorAll('input').forEach(function (i) { i.disabled = !twoTone.checked; });

    mainsLabel.textContent = hybrid ? 'Colour combination (mains / crosses)' : 'Main strings colour';
    drawKnots(knotCount());

    // Per-racket price: string & labour (+ sale) + 4-knot fee
    fee = knot2.checked ? 0 : TM.fourKnotFee();
    priceOut.replaceChildren();
    if (u.onSale) {
      var was = document.createElement('s');
      was.className = 'was-price';
      was.textContent = money(round2(u.base + fee));
      priceOut.append(was, ' ');
    }
    priceOut.append(money(round2(u.price + fee)));
    priceNote.textContent = 'Per racket: string & labour ' + money(u.price) +
      (fee ? ' + 4-knot ' + money(fee) : ' · 2-knot included free') +
      (u.onSale ? ' · sale price' : '');
    picks.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === s.id));
    });

    if (animate) restringAnimation();
    form.dispatchEvent(new Event('change'));
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function selectString(id, animate) {
    var list = TM.customStrings();
    state.string = list[0];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) state.string = list[i];
    stringSelect.value = state.string.id;
    var colours = state.string.colours;
    state.mains = pickColour(colours, state.mains, 0);
    state.cross = pickColour(colours, state.cross, 1);
    fillSwatches(mainsWrap, 'mains_colour', colours, state.mains, true);
    fillSwatches(crossWrap, 'crosses_colour', colours, state.cross, true);
    var noTwoTone = colours.length < 2 || !!colours[0].mains;
    twoTone.disabled = noTwoTone;
    if (noTwoTone) twoTone.checked = false;
    render(animate);
  }

  /* ---------- Init ---------- */
  buildRacket();

  function optionLabel(s) {
    var u = TM.unit(s.id);
    return s.name + ' — ' + money(TM.headline(s.id)) + (TM.isHybrid(s.id) ? ' incl. 4-knot' : '') + (u.onSale ? ' (sale)' : '');
  }

  /* String dropdown (popular first, then by brand) + popular quick picks */
  function buildOptions() {
    var list = TM.customStrings();
    var popular = list.filter(function (s) { return TM.isPopular(s.id); });
    stringSelect.replaceChildren();

    function group(label, items, prefixBrand) {
      if (!items.length) return;
      var g = document.createElement('optgroup');
      g.label = label;
      items.forEach(function (s) {
        var opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = (prefixBrand ? s.brand + ' ' : '') + optionLabel(s);
        g.appendChild(opt);
      });
      stringSelect.appendChild(g);
    }
    group('★ Popular', popular, true);
    var brands = {};
    list.forEach(function (s) { (brands[s.brand] = brands[s.brand] || []).push(s); });
    Object.keys(brands).forEach(function (b) { group(b, brands[b], false); });

    picks.replaceChildren();
    picks.hidden = !popular.length;
    popular.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick-chip';
      b.setAttribute('data-id', s.id);
      var name = document.createElement('span');
      name.textContent = s.brand + ' ' + s.name;
      var price = document.createElement('strong');
      price.textContent = money(TM.headline(s.id));
      b.append(name, price);
      b.addEventListener('click', function () { selectString(s.id, true); });
      picks.appendChild(b);
    });
  }
  buildOptions();

  fillSwatches(frameWrap, 'frame', FRAMES, state.frame, false);
  stringSelect.addEventListener('change', function () { selectString(stringSelect.value, true); });
  twoTone.addEventListener('change', function () { render(true); });
  [knot2, knot4].forEach(function (r) { r.addEventListener('change', function () { render(false); }); });

  // Live prices / popular picks arrived from the admin settings
  TM.onChange(function () {
    if (!TM.customStrings().length) return;
    var current = state.string.id;
    buildOptions();
    selectString(current, false);
    syncPanel();
  });

  function syncPanel() {
    var on = customRadio.checked;
    panel.hidden = !on;
    panel.querySelectorAll('select, input').forEach(function (i) {
      if (i.closest('#cross-swatches')) i.disabled = !on || !twoTone.checked;
      else i.disabled = !on;
    });
    if (on) { knotCount(); restringAnimation(); }
  }
  form.querySelectorAll('input[name="strings"]').forEach(function (r) {
    r.addEventListener('change', syncPanel);
  });
  form.addEventListener('reset', function () {
    setTimeout(function () {
      twoTone.checked = false;
      knot2.checked = true;
      selectString(stringSelect.value, false);
      syncPanel();
    }, 0);
  });

  // Public hook used by main.js for the order summary
  window.TMDesigner = {
    current: function () {
      var cross = twoTone.checked ? state.cross : state.mains;
      return {
        id: state.string.id,
        label: state.string.brand + ' ' + state.string.name,
        colours: state.mains.name + (cross.name !== state.mains.name ? ' / ' + cross.name : ''),
        knots: knot2.checked ? 2 : 4
      };
    },
    open: function () {
      customRadio.checked = true;
      syncPanel();
      form.dispatchEvent(new Event('change'));
    }
  };

  selectString(state.string.id, false);
  syncPanel();
})();
