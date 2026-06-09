/* ============================================================
   Mateo Pirela Pulido — interactions
   Starfield · parallax · scroll reveals · count-up · constellation
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav + scroll progress ---------- */
  var nav = document.getElementById("nav");
  var bar = document.getElementById("progress-bar");
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- count-up ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = target + suffix; return; }
    var dur = 1500, start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- starfield ---------- */
  var canvas = document.getElementById("starfield");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, stars = [], shooting = [], scrollY = 0, mx = 0, my = 0;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(260, Math.round((W * H) / 6500));
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: z,
        r: z * 1.5 + 0.25,
        base: 0.25 + z * 0.7,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.4,
        warm: Math.random() > 0.82
      });
    }
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", function () {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }, { passive: true });
  if (!reduced) {
    window.addEventListener("pointermove", function (e) {
      mx = (e.clientX / W - 0.5); my = (e.clientY / H - 0.5);
    }, { passive: true });
  }

  function spawnShooting() {
    var fromLeft = Math.random() > 0.5;
    shooting.push({
      x: fromLeft ? -50 : W + 50,
      y: Math.random() * H * 0.5,
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 4),
      vy: 2 + Math.random() * 2,
      life: 0, max: 60 + Math.random() * 30
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var px = s.x + mx * s.z * 26;
      var py = s.y - (scrollY * s.z * 0.08) + my * s.z * 26;
      py = ((py % H) + H) % H;
      var tw = reduced ? s.base : s.base * (0.6 + 0.4 * Math.sin(t * 0.001 * s.sp + s.tw));
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.warm
        ? "rgba(243,201,105," + tw + ")"
        : "rgba(223,233,255," + tw + ")";
      ctx.fill();
    }
    for (var j = shooting.length - 1; j >= 0; j--) {
      var sh = shooting[j];
      sh.x += sh.vx; sh.y += sh.vy; sh.life++;
      var a = Math.max(0, 1 - sh.life / sh.max);
      var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 6, sh.y - sh.vy * 6);
      grad.addColorStop(0, "rgba(95,230,214," + a + ")");
      grad.addColorStop(1, "rgba(95,230,214,0)");
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6); ctx.stroke();
      if (sh.life > sh.max) shooting.splice(j, 1);
    }
    raf = requestAnimationFrame(draw);
  }

  var raf;
  if (reduced) {
    draw(0); // single static frame
  } else {
    raf = requestAnimationFrame(draw);
    setInterval(function () { if (Math.random() > 0.55 && shooting.length < 2) spawnShooting(); }, 4200);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(draw); }
    });
  }
})();
