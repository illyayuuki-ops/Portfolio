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
  const ORDER = ["home","intro","about","skills","projects","certificates","videos","resume","contact"];
  const links = $$("[data-fnav]");
  const idxEl = $("#pageIdx");
  let current = null;

  const reveals = id => {
    const page = document.getElementById(id);
    $$(".reveal", page).forEach((el, i) => {
      el.classList.remove("in");
      setTimeout(() => el.classList.add("in"), 100 + i * 80);
    });
  };

  const scanEl = $("#scan");
  function scanSweep() {
    if (!scanEl) return;
    scanEl.classList.remove("on"); void scanEl.offsetWidth;
    scanEl.classList.add("on");
    setTimeout(() => scanEl.classList.remove("on"), 800);
  }
  function showPage(id, silent = false) {
    if (!ORDER.includes(id) || id === current) return;
    if (current === "videos") $$("#videos video").forEach(v => v.pause());   // stop playback when leaving
    if (current) { scanSweep(); document.getElementById(current).classList.remove("page-active"); }
    current = id;
    const page = document.getElementById(id);
    page.classList.add("page-active");
    page.scrollTop = 0;
    links.forEach(l => l.classList.toggle("act", l.dataset.fnav === id));
    document.body.classList.toggle("deck", id !== "home");
    if (idxEl) idxEl.textContent = String(ORDER.indexOf(id) + 1).padStart(2, "0") + " / " + String(ORDER.length).padStart(2, "0");
    edgeSync(ORDER.indexOf(id));
    history.replaceState(null, "", "#" + id);
    if (!silent) blip(680 + ORDER.indexOf(id) * 50, .06);
    window.__P3 && window.__P3.setActive(id);       // activate its 3D scene
    window.__fitCrystal && window.__fitCrystal();
    window.__fitCarousel && window.__fitCarousel();
    reveals(id);
    if (id === "intro") startTyped();
  }

  const DECK = ORDER.slice(1);                                    // deck pages only (home stays on the crystal)
  const step = d => {
    if (current === "home") { if (d > 0) window.__enterDeck(); return; }
    showPage(DECK[(DECK.indexOf(current) + d + DECK.length) % DECK.length]);
  };
  const pp = $("#prevPage"), pn = $("#nextPage");
  pp && pp.addEventListener("click", () => step(-1));
  pn && pn.addEventListener("click", () => step(1));
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    showPage(a.getAttribute("href").slice(1));
  }));
  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* ------- edge facets — candy-wrap rails ------- */
  const NAV_NAMES = {home:"HOME",intro:"INTRO",about:"PROFILE",skills:"SKILLS",projects:"PROJECTS",certificates:"CERTIFICATES",videos:"VIDEOS",resume:"RÉSUMÉ",contact:"CONTACT"};
  const edgePrev = $("#edgePrev"), edgeNext = $("#edgeNext");
  const tagPrev = $("#tagPrev"), tagNext = $("#tagNext");
  edgePrev && edgePrev.addEventListener("click", () => step(-1));
  edgeNext && edgeNext.addEventListener("click", () => step(1));
  function edgeSync(idx) {
    if (!edgePrev || !edgeNext) return;
    if (idx < 1) return;                                            // home: rails stay hidden
    const deck = ORDER.slice(1), di = deck.indexOf(ORDER[idx]);
    if (tagPrev) tagPrev.textContent = "PREV · " + NAV_NAMES[deck[(di - 1 + deck.length) % deck.length]];
    if (tagNext) tagNext.textContent = "NEXT · " + NAV_NAMES[deck[(di + 1) % deck.length]];
    const lit = Math.min(4, Math.ceil((di + 1) * 4 / deck.length)); // pages fill the rails as you climb
    edgePrev.querySelectorAll(".ef").forEach((f, i) => f.classList.toggle("lit", 3 - i < lit));
    edgeNext.querySelectorAll(".ef").forEach((f, i) => f.classList.toggle("lit", 3 - i < lit));
  }
  edgeSync(0);

  /* ------- ENTER the command deck (crystal shatter) ------- */
  window.__enterDeck = () => {
    if (window.__deckEntered) return;                         // one shatter per visit-home
    window.__deckEntered = true; setTimeout(() => window.__deckEntered = false, 900);
    blip(880, .09); setTimeout(() => blip(1200, .07), 140);
    window.__shatterCrystal && window.__shatterCrystal();
    setTimeout(() => showPage("intro"), 680);
  };
  const enterBtn = $("#enterBtn");
  enterBtn && enterBtn.addEventListener("click", window.__enterDeck);

  /* ------- space particles (stars + drifting hexagons) ------- */
  (() => {
    const c = $("#spaceCanvas"); if (!c) return;
    const ctx = c.getContext("2d");
    let W, H; const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    size(); addEventListener("resize", size);
    const stars = [], hexes = [];
    for (let i = 0; i < 130; i++) stars.push({x:Math.random(),y:Math.random(),r:Math.random()*1.5+0.4,tw:Math.random()*6.28,sp:Math.random()*0.25+0.08});
    for (let i = 0; i < 15; i++) hexes.push({x:Math.random(),y:Math.random(),s:Math.random()*15+8,rot:Math.random()*6.28,vr:(Math.random()-.5)*0.0024,vx:(Math.random()-.5)*0.00009,vy:(Math.random()-.5)*0.00009,col:Math.random()<.6?"94,227,255":"170,220,255"});
    let t = 0;
    const hex = s => { ctx.beginPath(); for(let k=0;k<6;k++){const a=s.rot+k*1.047;ctx[k?"lineTo":"moveTo"](Math.cos(a)*s.s,Math.sin(a)*s.s);} ctx.closePath(); ctx.stroke(); };
    (function loop(){ t++;
      ctx.clearRect(0,0,W,H);
      for (const s of hexes){ s.x=(s.x+1+s.vx)%1; s.y=(s.y+1+s.vy)%1; s.rot+=s.vr;
        ctx.save(); ctx.translate(s.x*W,s.y*H); ctx.strokeStyle=`rgba(${s.col},.13)`; ctx.lineWidth=1; hex(s); ctx.restore(); }
      for (const s of stars){ const a=.22+.6*Math.abs(Math.sin(t/58*s.sp+s.tw)); ctx.fillStyle=`rgba(214,240,255,${a.toFixed(3)})`; ctx.fillRect(s.x*W,s.y*H,s.r,s.r); }
      requestAnimationFrame(loop);
    })();
  })();

  /* ------- facet shards nav ------- */
  $$("[data-fnav]").forEach(l => l.addEventListener("click", () => { blip(700, .05); showPage(l.dataset.fnav); }));

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
        showPage("home", true);   // always boot in space at the crystal — page 01
        history.replaceState(null, "", location.pathname);
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
    if (!typedEl || typedOn) return; typedOn = true;
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

  /* ------- videos: diamond play, one-at-a-time, fallback ------- */
  const vids = $$("#videos video");
  vids.forEach(v => {
    const card = v.closest(".vid"), btn = card && card.querySelector(".vid__play");
    v.controls = false;                                         // clean thumbnail until first play (HTML keeps controls for no-JS)
    const start = () => { v.controls = true; v.play().catch(() => {}); };
    btn && btn.addEventListener("click", start);
    v.addEventListener("click", () => { if (!card.classList.contains("is-started")) start(); });
    v.addEventListener("play", () => {
      vids.forEach(o => { if (o !== v) o.pause(); });          // only one plays at a time
      v.controls = true;
      card && card.classList.add("is-started", "is-playing");
    });
    v.addEventListener("pause", () => card && card.classList.remove("is-playing"));
    v.addEventListener("error", () => missing(v), true);
    const s = v.querySelector("source");
    if (s) s.addEventListener("error", () => missing(v));
  });
  function missing(v) {
    if (v.closest(".missing-host")) return;
    const host = v.parentElement, src = v.querySelector("source");
    const path = (src ? src.getAttribute("src") : v.getAttribute("src") || "assets/videos/demo.mp4").split("#")[0];
    host.classList.add("missing-host");
    host.innerHTML = `<div class="video-missing"><div class="pm">▶</div>
      <b>MEDIA SLOT READY</b><code>${path}</code></div>`;
  }

  /* ------- magnetic UI ------- */
  if (fine) {
    $$(".btn, .radial__core, .r-item, .r-soc, .snd, .gchip, .pagenav button").forEach(el => {
      el.classList.add("magnetic");
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.classList.add("on");
        el.style.translate = (dx * .28) + "px " + (dy * .28) + "px";
      });
      el.addEventListener("pointerleave", () => { el.classList.remove("on"); el.style.translate = ""; });
    });
  }

  /* ------- live git chip (public GitHub API, read-only) ------- */
  (() => {
    const gc = $("#gitChip"); if (!gc) return;
    const dot = '<i class="gchip__dot"></i>';
    const ago = d => {
      const s = (Date.now() - d) / 1000;
      if (s < 3600) return Math.max(1, Math.floor(s / 60)) + "m ago";
      if (s < 86400) return Math.floor(s / 3600) + "h ago";
      return Math.floor(s / 86400) + "d ago";
    };
    fetch("https://api.github.com/repos/illyayuuki-ops/Portfolio/commits?per_page=1")
      .then(r => r.json())
      .then(a => {
        const c = a && a[0];
        if (!c || !c.sha) throw 0;
        gc.innerHTML = dot + "GIT · " + c.sha.slice(0, 7).toUpperCase() + " · " + ago(new Date(c.commit.committer.date));
      })
      .catch(() => { gc.innerHTML = dot + "GIT · MAIN BRANCH"; });
  })();

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
