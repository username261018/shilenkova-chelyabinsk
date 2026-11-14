/* Шиленкова · motion for the visit board (vanilla) */
(function () {
  'use strict';
  var d = document, root = d.documentElement, win = window;
  var motion = root.classList.contains('m-on');

  /* strip + header height -> --top-h */
  var top = d.querySelector('[data-top]');
  var syncTop = function () { if (top) root.style.setProperty('--top-h', top.getBoundingClientRect().height + 'px'); };
  syncTop();
  if (top && win.ResizeObserver) new ResizeObserver(syncTop).observe(top);

  /* menu disclosure */
  var burger = d.querySelector('[data-burger]');
  if (burger) {
    var nav = d.getElementById(burger.getAttribute('aria-controls'));
    var setOpen = function (v) { burger.setAttribute('aria-expanded', String(v)); root.classList.toggle('menu-open', v); };
    burger.addEventListener('click', function () { setOpen(burger.getAttribute('aria-expanded') !== 'true'); });
    nav && nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setOpen(false); burger.focus(); } });
    win.matchMedia('(min-width: 1000px)').addEventListener('change', function () { setOpen(false); });
  }

  /* map on click */
  [].forEach.call(d.querySelectorAll('[data-map]'), function (box) {
    var btn = box.querySelector('button');
    btn && btn.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = box.dataset.map; f.title = box.dataset.title || 'Карта'; f.loading = 'lazy'; f.allowFullscreen = true;
      box.replaceChildren(f);
    });
  });

  if (!motion) return;
  root.classList.add('m-ready');

  /* words under a mask */
  [].forEach.call(d.querySelectorAll('[data-rv="w"]'), function (el) {
    var step = el.tagName === 'H1' ? 70 : 60, n = 0, list = [], node;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while ((node = tw.nextNode())) list.push(node);
    list.forEach(function (t) {
      var frag = d.createDocumentFragment();
      t.nodeValue.split(/([ \t\r\n]+)/).forEach(function (part) {
        if (!part) return;
        if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
        var w = d.createElement('span'), i = d.createElement('span');
        w.className = 'w'; i.className = 'wi'; w.setAttribute('aria-hidden', 'true');
        i.textContent = part; i.style.transitionDelay = (n++ * step) + 'ms';
        w.appendChild(i); frag.appendChild(w);
      });
      t.parentNode.replaceChild(frag, t);
    });
  });

  /* stagger index */
  [].forEach.call(d.querySelectorAll('[data-stagger]'), function (g) {
    [].forEach.call(g.querySelectorAll('[data-rv]'), function (c, i) { c.style.setProperty('--i', i); });
  });

  /* curtains release their clip when done */
  [].forEach.call(d.querySelectorAll('[data-rv="cur"]'), function (el) {
    el.addEventListener('transitionend', function (e) { if (e.target === el && e.propertyName === 'clip-path') el.classList.add('done'); });
  });

  /* entrance reveals: once, by rect (sweep) */
  var waiting = [].slice.call(d.querySelectorAll('[data-rv]:not([data-hero])'));
  function sweep(all) {
    var lim = win.innerHeight;
    waiting = waiting.filter(function (el) {
      if (all || el.getBoundingClientRect().top < lim) { el.classList.add('in'); return false; }
      return true;
    });
  }

  /* one paragraph lights up with scroll */
  var lit = [].slice.call(d.querySelectorAll('[data-light]'));
  lit.forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="lw">' + w + '</span>'; }).join(' ');
    p._w = [].slice.call(p.querySelectorAll('.lw'));
  });

  var panels = [].slice.call(d.querySelectorAll('[data-panel]'));
  var lanes = [].slice.call(d.querySelectorAll('[data-lane]'));
  var wide = win.matchMedia('(min-width: 900px)');
  var cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* stacked cards share one height so a shorter card never shows the one under it */
  var equal = [].slice.call(d.querySelectorAll('[data-equal]'));
  function equalize() {
    equal.forEach(function (g) {
      var kids = [].slice.call(g.children), max = 0;
      kids.forEach(function (k) { k.style.minHeight = ''; });
      kids.forEach(function (k) { max = Math.max(max, k.getBoundingClientRect().height); });
      kids.forEach(function (k) { k.style.minHeight = Math.ceil(max) + 'px'; });
    });
  }

  function layout() {
    equalize();
    lanes.forEach(function (s) {
      var view = s.querySelector('.lane__view'), track = s.querySelector('.lane__track'), pin = s.querySelector('.lane__pin');
      track.style.transform = '';
      if (!wide.matches) { s.classList.remove('lane-on'); s.style.height = ''; s._run = 0; return; }
      s.classList.add('lane-on');
      var run = Math.max(0, track.scrollWidth - view.clientWidth);
      s._run = run;
      s._scroll = Math.min(run, (+s.dataset.lane || 1.3) * win.innerHeight);
      s.style.height = (pin.offsetHeight + s._scroll) + 'px';
    });
  }

  function frame() {
    var vh = win.innerHeight;
    lit.forEach(function (p) {
      var r = p.getBoundingClientRect(), k = cl((vh * 0.9 - r.top) / (vh * 0.45)) * (p._w.length + 3);
      p._w.forEach(function (w, i) { w.style.opacity = (0.25 + 0.75 * cl(k - i)).toFixed(3); });
    });
    panels.forEach(function (el) {
      var r = el.getBoundingClientRect(), k = cl((vh - r.top) / (vh * 0.6));
      var max = parseFloat(getComputedStyle(el).getPropertyValue('--fx-max')) || 48;
      el.style.setProperty('--fx', (max * (1 - k)).toFixed(1) + 'px');
    });
    lanes.forEach(function (s) {
      if (!s._run) return;
      var pin = s.querySelector('.lane__pin'), r = s.getBoundingClientRect();
      var span = r.height - pin.offsetHeight, k = span > 0 ? cl((parseFloat(getComputedStyle(pin).top) - r.top) / span) : 0;
      s.querySelector('.lane__track').style.transform = 'translate3d(' + (-k * s._run).toFixed(1) + 'px,0,0)';
      var bar = s.querySelector('.lane__bar i'); if (bar) bar.style.transform = 'scaleX(' + k.toFixed(4) + ')';
    });
  }

  var queued = false;
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; sweep(false); frame(); });
  }

  /* cursor: tilt the hero polaroid, move the light spot (fine pointer only) */
  if (win.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var glow = d.querySelector('.glow'), tilts = [].slice.call(d.querySelectorAll('[data-tilt]')), px = 0, py = 0, raf = 0;
    var paint = function () {
      raf = 0;
      if (glow) glow.style.transform = 'translate3d(' + (px - 320) + 'px,' + (py - 320) + 'px,0)';
      tilts.forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > win.innerHeight) return;
        var dx = (px - r.left - r.width / 2) / win.innerWidth, dy = (py - r.top - r.height / 2) / win.innerHeight;
        t.style.transform = 'perspective(1000px) rotateY(' + (dx * 9).toFixed(2) + 'deg) rotateX(' + (-dy * 7).toFixed(2) + 'deg)';
      });
    };
    win.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    glow && glow.classList.add('on');
  }

  function heroChain() {
    [].forEach.call(d.querySelectorAll('[data-hero]'), function (el) {
      setTimeout(function () { el.classList.add('in'); }, +el.dataset.hero || 0);
    });
  }
  function start() { layout(); sweep(false); frame(); setTimeout(heroChain, 300); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', function () { layout(); onScroll(); });
  win.addEventListener('load', function () { layout(); onScroll(); });
  win.addEventListener('hashchange', function () { setTimeout(function () { sweep(false); frame(); }, 80); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { layout(); onScroll(); });
  win.addEventListener('beforeprint', function () { sweep(true); });
  wide.addEventListener('change', function () { layout(); frame(); });
})();
