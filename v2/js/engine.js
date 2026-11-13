(function () {
  var html = document.documentElement;
  var chromeEl = document.getElementById("chrome");
  var spacer = document.getElementById("spacer");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  var spot = document.getElementById("spot");
  var mapBox = document.getElementById("map");
  var mapBtn = document.getElementById("map-btn");
  var contacts = document.getElementById("contacts");
  var lane = document.getElementById("rev-lane");
  var laneWrap = document.getElementById("rev-lane-wrap");
  var laneProg = document.getElementById("rev-progress");

  function setTop() {
    if (!chromeEl) return;
    var h = chromeEl.offsetHeight;
    html.style.setProperty("--top-h", h + "px");
    if (spacer) spacer.style.height = h + "px";
  }
  setTop();
  if (chromeEl && "ResizeObserver" in window) {
    new ResizeObserver(setTop).observe(chromeEl);
  }
  window.addEventListener("resize", setTop, { passive: true });

  function closeMenu() {
    if (!menu || !burger) return;
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      menu.hidden = open;
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  if (mapBtn && mapBox) {
    mapBtn.addEventListener("click", function () {
      var src = mapBox.getAttribute("data-src");
      if (!src) return;
      var fr = document.createElement("iframe");
      fr.src = src;
      fr.title = "Карта: Челябинск, ул. Маркса, 131";
      fr.loading = "lazy";
      fr.referrerPolicy = "no-referrer-when-downgrade";
      mapBox.innerHTML = "";
      mapBox.appendChild(fr);
    });
  }

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (spot && fine.matches) {
    var sx = 0, sy = 0, tx = 0, ty = 0, raf = 0;
    function tickSpot() {
      sx += (tx - sx) * 0.16;
      sy += (ty - sy) * 0.16;
      spot.style.transform = "translate(" + sx + "px," + sy + "px)";
      if (Math.abs(tx - sx) > 0.4 || Math.abs(ty - sy) > 0.4) raf = requestAnimationFrame(tickSpot);
      else raf = 0;
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tickSpot);
    }, { passive: true });
  }

  if (fine.matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "rotate(" + (x * 5 - 2) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !html.classList.contains("m-on")) return;

  html.classList.add("m-ready");

  var GLYPHS = "┼┴┬│─┐┌┘└·+";
  function marksOf(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      out += s.charAt(i) === " " ? " " : GLYPHS.charAt(i % GLYPHS.length);
    }
    return out;
  }
  function assemble(el) {
    if (el.querySelector(".w") || el.dataset.assembled) return;
    var real = el.textContent.trim();
    if (!real) return;
    el.dataset.assembled = "1";
    var hidden = document.createElement("span");
    hidden.className = "sr";
    hidden.textContent = real;
    var twin = document.createElement("span");
    twin.setAttribute("aria-hidden", "true");
    twin.textContent = marksOf(real);
    el.textContent = "";
    el.appendChild(hidden);
    el.appendChild(twin);
    var i = 0;
    var step = Math.max(28, Math.min(70, 900 / Math.max(1, real.length)));
    function next() {
      i += 1;
      twin.textContent = real.slice(0, i) + marksOf(real.slice(i));
      if (i < real.length) setTimeout(next, step);
      else twin.textContent = real;
    }
    setTimeout(next, 40);
  }

  function inSweep(el) {
    return el.getBoundingClientRect().top < window.innerHeight;
  }

  function reveal(el) {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.hasAttribute("data-assemble") || el.classList.contains("marks")) assemble(el);
    if (el.hasAttribute("data-curtain") || el.hasAttribute("data-frame")) {
      var done = function (ev) {
        if (ev.propertyName && ev.propertyName.indexOf("clip") === -1) return;
        el.classList.add("done");
        el.removeEventListener("transitionend", done);
      };
      el.addEventListener("transitionend", done);
    }
  }

  var observed = document.querySelectorAll("[data-rv], [data-curtain], [data-frame], [data-light], [data-assemble]");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) reveal(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  function sweep() {
    observed.forEach(function (el) {
      if (inSweep(el)) reveal(el);
    });
  }

  var heroH1 = document.querySelector(".hero [data-rv='h1']");
  var heroFrame = document.querySelector(".hero [data-curtain]");
  var heroLight = document.querySelector(".hero [data-light]");

  function startHero() {
    if (heroH1) reveal(heroH1);
    if (heroFrame) setTimeout(function () { reveal(heroFrame); }, 200);
    if (heroLight) setTimeout(function () { reveal(heroLight); }, 500);
    observed.forEach(function (el) {
      if (el === heroH1 || el === heroFrame || el === heroLight) return;
      if (el.closest && el.closest(".hero") && inSweep(el)) {
        setTimeout(function () { reveal(el); }, 400);
        return;
      }
      io.observe(el);
    });
    sweep();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(startHero, 300);
    });
  } else {
    setTimeout(startHero, 300);
  }

  window.addEventListener("scroll", sweep, { passive: true });
  window.addEventListener("load", sweep);
  window.addEventListener("hashchange", sweep);
  window.addEventListener("beforeprint", function () {
    observed.forEach(reveal);
    html.classList.remove("m-on");
  });

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function laneScroll() {
    if (!lane || !laneWrap) return;
    if (window.innerWidth < 900) {
      lane.style.transform = "";
      laneWrap.style.height = "";
      return;
    }
    var extra = Math.max(0, lane.scrollWidth - laneWrap.clientWidth);
    /* at most ~1.3 screens of scroll */
    var cap = Math.round(window.innerHeight * 1.3);
    var travel = Math.min(extra, cap);
    var base = lane.offsetHeight + 20;
    laneWrap.style.height = (base + travel) + "px";
    var topH = parseFloat(getComputedStyle(html).getPropertyValue("--top-h")) || 0;
    var start = laneWrap.getBoundingClientRect().top - topH;
    var scrolled = clamp(-start, 0, travel);
    var p = travel ? scrolled / travel : 0;
    var shift = extra ? scrolled / (travel || 1) * extra : 0;
    lane.style.transform = "translateX(" + (-shift) + "px)";
    if (laneProg) laneProg.style.setProperty("--p", String(p));
  }

  function contactsFx() {
    if (!contacts) return;
    var r = contacts.getBoundingClientRect();
    var y = window.innerHeight * 0.4;
    var t = r.top;
    var fx;
    if (t >= window.innerHeight) fx = 48;
    else if (t <= y) fx = 0;
    else fx = 48 * (t - y) / (window.innerHeight - y);
    contacts.style.setProperty("--fx", fx + "px");
  }

  var moving = false;
  function onScrollMove() {
    if (moving) return;
    moving = true;
    requestAnimationFrame(function () {
      laneScroll();
      contactsFx();
      moving = false;
    });
  }
  window.addEventListener("scroll", onScrollMove, { passive: true });
  window.addEventListener("resize", function () {
    setTop();
    laneScroll();
    contactsFx();
  }, { passive: true });
  laneScroll();
  contactsFx();
})();
