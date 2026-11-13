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
  var lane = document.getElementById("gal-lane");
  var laneWrap = lane && lane.parentElement;
  var laneProg = document.getElementById("gal-progress");

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
      if (Math.abs(tx - sx) > 0.4 || Math.abs(ty - sy) > 0.4) {
        raf = requestAnimationFrame(tickSpot);
      } else {
        raf = 0;
      }
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
        el.style.transform = "rotate(" + (x * 6) + "deg) translateY(" + (y * -6) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !html.classList.contains("m-on")) return;

  html.classList.add("m-ready");

  function inSweep(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight;
  }

  function reveal(el) {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.hasAttribute("data-curtain")) {
      var done = function (ev) {
        if (ev.propertyName && ev.propertyName.indexOf("clip") === -1) return;
        el.classList.add("done");
        el.removeEventListener("transitionend", done);
      };
      el.addEventListener("transitionend", done);
    }
  }

  var observed = document.querySelectorAll("[data-rv], [data-pin], [data-line], [data-light], [data-curtain]");
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
  var heroNote = document.querySelector(".hero .note");
  var heroPin = document.querySelector(".hero [data-pin]");
  var heroLight = document.querySelector(".hero [data-light]");

  function startHero() {
    if (heroH1) reveal(heroH1);
    if (heroPin) {
      setTimeout(function () { reveal(heroPin); }, 200);
    }
    if (heroNote) {
      setTimeout(function () { reveal(heroNote); }, 500);
    }
    if (heroLight) {
      setTimeout(function () { reveal(heroLight); }, 500);
    }
    observed.forEach(function (el) {
      if (el === heroH1 || el === heroNote || el === heroPin || el === heroLight) return;
      if (el.closest && el.closest(".hero") && inSweep(el)) {
        setTimeout(function () { reveal(el); }, 600);
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
      if (laneProg) laneProg.style.setProperty("--p", 0);
      return;
    }
    var extra = Math.max(0, lane.scrollWidth - laneWrap.clientWidth);
    var viewH = window.innerHeight;
    var travel = extra;
    laneWrap.style.height = (laneWrap.clientWidth ? (lane.offsetHeight + travel) : "") + "px";
    if (!extra) {
      lane.style.transform = "";
      return;
    }
    var wrapR = laneWrap.getBoundingClientRect();
    var topH = parseFloat(getComputedStyle(html).getPropertyValue("--top-h")) || 0;
    var start = wrapR.top - topH;
    var scrolled = clamp(-start, 0, travel);
    var p = travel ? scrolled / travel : 0;
    lane.style.transform = "translateX(" + (-scrolled) + "px)";
    if (laneProg) {
      laneProg.classList.add("is-on");
      laneProg.style.setProperty("--p", String(p));
    }
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
