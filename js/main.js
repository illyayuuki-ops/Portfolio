/* ============================================================
   ✦ main.js — page router, HUD, sounds & micro-interactions
============================================================ */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ------- sound ------- */
  let actx = null, muted = false;
  const ensureAudio = () => {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === "suspended") actx.resume();
  };
  const blip = (f = 660, d = 0.05, type = "sine", v = 0.04) => {
    if (muted || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + d);
  };
  addEventListener("pointerdown", ensureAudio);
  const sndBtn = $("#soundBtn");
  sndBtn.addEventListener("click", () => {
    ensureAudio(); muted = !muted;
    sndBtn.classList.toggle("off", muted);
    $("#soundState").textContent = muted ? "OFF" : "ON";
    if (!muted) blip(880, .08);
  });
  $$("a,button,.cert").forEach(el => el.addEventListener("mouseenter", () => blip(600, .03, "sine", .02)));

  /* ------- clock ------- */
  const clockEl = $("#clock");
  setInterval(() => {
    if (!clockEl) return;
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString("en-GB") + " PH";
  }, 1000);

  /* ------- page router ------- */
  const ORDER = ["home","about","skills","projects","certificates","videos","resume","contact"];
  const links = $$(".r-item");
  const idxEl = $("#pageIdx");
  let current = null;

  const reveals = id => {
    const page = document.getElementById(id);
    $$(".reveal", page).forEach((el, i) => {
      el.classList.remove("in");
      setTimeout(() => el.classList.add("in"), 100 + i * 80);
    });
  };

  function showPage(id, silent = false) {
    if (!ORDER.includes(id) || id === current) return;
    if (current) document.getElementById(current).classList.remove("page-active");
    current = id;
    const page = document.getElementById(id);
    page.classList.add("page-active");
    page.scrollTop = 0;
    links.forEach(l => l.classList.toggle("active", l.dataset.rnav === id));
    idxEl.textContent = String(ORDER.indexOf(id) + 1).padStart(2, "0") + " / " + String(ORDER.length).padStart(2, "0");
    history.replaceState(null, "", "#" + id);
    if (!silent) blip(680 + ORDER.indexOf(id) * 50, .06);
    window.__P3 && window.__P3.setActive(id);       // activate its 3D scene
    window.__fitCrystal && window.__fitCrystal();
    window.__fitCarousel && window.__fitCarousel();
    reveals(id);
    if (id === "home") startTyped();
  }

  const step = d => showPage(ORDER[(ORDER.indexOf(current) + d + ORDER.length) % ORDER.length]);
  $("#prevPage").addEventListener("click", () => step(-1));
  $("#nextPage").addEventListener("click", () => step(1));
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    showPage(a.getAttribute("href").slice(1));
  }));
  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* ------- radial orbit menu ------- */
  const radial = $("#radial"), radialBtn = $("#radialBtn");
  const radialSet = open => {
    radial.classList.toggle("open", open);
    radialBtn.setAttribute("aria-expanded", open ? "true" : "false");
    blip(open ? 660 : 520, .06);
  };
  radialBtn.addEventListener("click", () => radialSet(!radial.classList.contains("open")));
  $(".radial__veil", radial).addEventListener("click", () => radialSet(false));
  document.addEventListener("pointerdown", e => {
    if (radial.classList.contains("open") && !radial.contains(e.target)) radialSet(false);
  });
  links.forEach(l => l.addEventListener("click", () => { radialSet(false); showPage(l.dataset.rnav); }));
  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === "Escape") radialSet(false);
    if (e.key === "m" || e.key === "M") radialSet(!radial.classList.contains("open"));
  });

  /* ------- loader ------- */
  const pre = $("#preloader"), preCount = $("#preCount"), preBar = $("#preBar");
  let n = 0, booted = false;
  const tick = () => {
    if (booted) return;
    n = Math.min(100, n + Math.random() * 10 + 5);
    preCount.textContent = String(Math.floor(n)).padStart(2, "0");
    preBar.style.width = n + "%";
    if (n < 100) setTimeout(tick, 60 + Math.random() * 70);
    else {
      booted = true;
      setTimeout(() => {
        pre.classList.add("done");
        const h = location.hash.slice(1);
        showPage(ORDER.includes(h) ? h : "home", true);
        setTimeout(() => pre.remove(), 800);
      }, 350);
    }
  };
  if (document.readyState === "complete") tick();
  else { window.addEventListener("load", tick); setTimeout(tick, 2000); }

  /* ------- typed roles ------- */
  const roles = ["FULL-STACK WEB", "NETWORKING", "GAME DEVELOPMENT", "SYSTEM BUILDING"];
  const typedEl = $("#typedRole");
  let ri = 0, ci = 0, del = false, typedOn = false;
  function startTyped() {
    if (typedOn) return; typedOn = true;
    const type = () => {
      const w = roles[ri];
      ci += del ? -1 : 1;
      typedEl.textContent = w.slice(0, ci);
      let d = del ? 32 : 72;
      if (!del && ci === w.length) { d = 1400; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; d = 300; }
      setTimeout(type, d);
    };
    type();
  }

  /* ------- cursor ------- */
  if (fine) {
    const dot = $("#cursorDot"), ring = $("#cursorRing");
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    $$("a,button,.cert,input,textarea,.skillrow,canvas").forEach(el => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovering"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovering"));
    });
  } else document.body.classList.add("no-cursorfx");

  /* ------- skill bars + counters (on visibility) ------- */
  const barIO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.style.width = en.target.dataset.level + "%";
    blip(520, .18, "sine", .025);
    barIO.unobserve(en.target);
  }), { threshold: .4 });
  $$(".skillrow .track b").forEach(b => barIO.observe(b));

  const numIO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, end = +el.dataset.count, t0 = performance.now();
    (function cnt(t) {
      const p = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(end * p);
      if (p < 1) requestAnimationFrame(cnt);
    })(t0);
    numIO.unobserve(el);
  }), { threshold: .6 });
  $$("[data-count]").forEach(el => numIO.observe(el));

  /* ------- lightbox ------- */
  const lb = $("#lightbox"), lbImg = $("#lbImg");
  $$("[data-lightbox]").forEach(f => f.addEventListener("click", () => {
    lbImg.src = f.dataset.lightbox; lb.classList.add("open"); blip(900, .08);
  }));
  const shut = () => lb.classList.remove("open");
  $("#lbClose").addEventListener("click", shut);
  lb.addEventListener("click", e => { if (e.target === lb) shut(); });
  addEventListener("keydown", e => { if (e.key === "Escape") shut(); });

  /* ------- video fallback ------- */
  $$("video").forEach(v => {
    v.addEventListener("error", () => missing(v), true);
    const s = v.querySelector("source");
    if (s) s.addEventListener("error", () => missing(v));
  });
  function missing(v) {
    if (v.closest(".missing-host")) return;
    const host = v.parentElement, src = v.querySelector("source");
    host.classList.add("missing-host");
    host.innerHTML = `<div class="video-missing"><div class="pm">▶</div>
      <b>MEDIA SLOT READY</b><code>${src ? src.getAttribute("src") : "assets/videos/demo.mp4"}</code></div>`;
  }

  /* ------- contact form ------- */
  const ME = "johnraphael030306@gmail.com";
  $("#contactForm").addEventListener("submit", e => {
    e.preventDefault();
    blip(700, .05); setTimeout(() => blip(950, .06), 90);
    const nm = $("#cName").value, em = $("#cEmail").value, ms = $("#cMsg").value;
    location.href = `mailto:${ME}?subject=Portfolio inquiry from ${encodeURIComponent(nm)}&body=${encodeURIComponent(ms + "\n\n— " + nm + " (" + em + ")")}`;
    const b = e.target.querySelector("button");
    b.textContent = "Opening email client…";
    setTimeout(() => (b.textContent = "Send →"), 3000);
  });
})();
