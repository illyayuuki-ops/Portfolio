/* ============================================================
   ✦ three-scenes.js — REAL interactive 3D (Three.js, vendored)
   Scene A: draggable glass CRYSTAL with inertia (home page)
   Scene B: draggable 3D PROJECT CAROUSEL (projects page)
   Both run only while their page is active.
============================================================ */
(() => {
  "use strict";
  if (!window.THREE) return; // graceful: pages still work without WebGL

  const SKY = 0x5ee3ff, DEEP = 0x2a6cff, INK = 0xeaf4ff;
  const active = { home: false, projects: false };
  window.__P3 = { setActive(name) { for (const k in active) active[k] = k === name; } };

  const isCoarse = matchMedia("(pointer:coarse)").matches;

  /* ============================================================
     SCENE A — HERO CRYSTAL (drag = rotate, inertia spin)
  ============================================================ */
  (() => {
    const canvas = document.getElementById("crystalCanvas");
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, isCoarse ? 1.6 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // ---- lighting (glassy rim feel) ----
    scene.add(new THREE.AmbientLight(0x8fb8ff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(SKY, 2.2);      rim.position.set(-4, -1, -3); scene.add(rim);
    const fillP = new THREE.PointLight(DEEP, 2.0, 30);     fillP.position.set(-3, 3, 3); scene.add(fillP);

    const group = new THREE.Group();
    scene.add(group);

    // ---- glass crystal ----
    const crystal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xbfefff, metalness: 0.05, roughness: 0.04,
        transmission: 0.92, thickness: 1.6, ior: 1.45,
        clearcoat: 1, clearcoatRoughness: 0.12,
        envMapIntensity: 1.4, flatShading: true, transparent: true, opacity: 0.96,
      })
    );
    group.add(crystal);
    // faint edge glow
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(crystal.geometry),
      new THREE.LineBasicMaterial({ color: SKY, transparent: true, opacity: 0.55 })
    );
    group.add(edges);

    // ---- inner core ----
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: SKY, wireframe: true, transparent: true, opacity: 0.75 })
    );
    group.add(core);

    // ---- orbit rings ----
    const ringMat = new THREE.MeshBasicMaterial({ color: SKY, transparent: true, opacity: 0.35 });
    const rings = [];
    [[1.95, 0.0045, 0.35, 0.2], [2.35, 0.003, -0.5, 1.1]].forEach(([r, t, rx, rz]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 160), ringMat);
      ring.rotation.set(rx, 0, rz);
      group.add(ring); rings.push(ring);
    });

    // ---- particles ----
    const N = isCoarse ? 140 : 260;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 2.6 + Math.random() * 2.4, a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(b) * Math.cos(a);
      pos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a);
      pos[i * 3 + 2] = r * Math.cos(b);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: INK, size: 0.022, transparent: true, opacity: 0.5 }));
    scene.add(points);

    // ---- interaction: drag with inertia ----
    let velX = 0, velY = 0, dragging = false, px = 0, py = 0;
    let tiltX = 0, tiltY = 0, tTX = 0, tTY = 0;
    const hint = document.getElementById("dragHint");

    canvas.addEventListener("pointerdown", e => {
      dragging = true; px = e.clientX; py = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      if (hint) hint.style.opacity = 0;
    });
    addEventListener("pointerup", () => { dragging = false; canvas.style.cursor = ""; });
    canvas.addEventListener("pointermove", e => {
      if (dragging) {
        velY = (e.clientX - px) * 0.006;
        velX = (e.clientY - py) * 0.006;
        px = e.clientX; py = e.clientY;
      } else {
        // subtle scene tilt following the pointer
        const r = canvas.getBoundingClientRect();
        tTX = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
        tTY = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
      }
    });

    // ---- layout (crystal sits right of the text) ----
    const fit = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w > 900;
      group.position.x = wide ? w / h * 0.85 : 0;
      group.position.y = wide ? 0 : 0.9;
      group.scale.setScalar(wide ? 1 : 0.72);
    };
    fit();
    addEventListener("resize", fit);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!active.home) return;
      const t = clock.getElapsedTime();

      if (!dragging) {
        velX *= 0.95; velY *= 0.95;                 // inertia decay
        group.rotation.y += 0.0022;                  // idle auto-spin
      }
      group.rotation.x += velX; group.rotation.y += velY;
      tiltX += (tTX - tiltX) * 0.05; tiltY += (tTY - tiltY) * 0.05;
      group.rotation.x += tiltX * 0.02; group.rotation.z = tiltY * -0.06;

      group.position.y += Math.sin(t * 0.9) * 0.0016; // gentle hover bob
      core.rotation.x = t * 0.6; core.rotation.y = t * 0.8;
      rings[0].rotation.y = t * 0.35; rings[1].rotation.y = -t * 0.22;
      points.rotation.y = t * 0.03;

      renderer.render(scene, camera);
    })();
    window.__fitCrystal = fit;
  })();

  /* ============================================================
     SCENE C — NAV GEM — a tiny live 3D diamond as the menu core
     Spins idle, flashes + bursts of spin when the menu opens.
     Falls back to the ◈ glyph if WebGL is unavailable.
  ============================================================ */
  (() => {
    const cv = document.getElementById("gemCanvas");
    const core = document.getElementById("radialBtn");
    if (!cv || !core) return;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
      renderer.setSize(72, 72, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
      cam.position.z = 3.2;

      const gem = new THREE.Group();
      const geo = new THREE.OctahedronGeometry(0.95, 0);                 // a real diamond = octahedron
      const solidMat = new THREE.MeshPhongMaterial({ color: 0x0d2c3e, emissive: 0x0b3b52, transparent: true, opacity: 0.55, shininess: 90 });
      const wireMat  = new THREE.LineBasicMaterial({ color: SKY, transparent: true });
      const solid = new THREE.Mesh(geo, solidMat);
      const wire  = new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat);
      gem.add(solid); gem.add(wire); scene.add(gem);

      scene.add(new THREE.AmbientLight(0x9fd9ff, 0.9));
      const l1 = new THREE.DirectionalLight(0xffffff, 1.1); l1.position.set(2, 3, 4); scene.add(l1);
      const l2 = new THREE.DirectionalLight(SKY, 0.8);      l2.position.set(-3, -2, -2); scene.add(l2);

      let energy = 0, t0 = performance.now();
      window.__gemShine = () => { energy = 1; };           // main.js calls this when the menu opens
      core.classList.add("gl");                            // swap ◈ glyph for live WebGL

      function frame(t) {
        const dt = Math.min((t - t0) / 1000, 0.05); t0 = t;
        energy *= 1 - dt * 1.7; if (energy < 0.001) energy = 0;
        const pop = 1 + energy * 0.22 * Math.sin(Math.min(energy, 1) * Math.PI);
        gem.rotation.y += dt * (0.7 + energy * 6.5);
        gem.rotation.x = 0.38 + Math.sin(t / 1500) * 0.08;  // gentle float
        gem.position.y = Math.sin(t / 1100) * 0.05;
        gem.scale.setScalar(pop);
        wireMat.opacity = 0.85 + energy * 0.15;
        solidMat.emissive.setRGB(0.04 + energy * 0.15, 0.23 + energy * 0.3, 0.32 + energy * 0.35);
        renderer.render(scene, cam);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(f => { t0 = f; frame(f); });
    } catch (e) { /* WebGL missing — the ◈ glyph remains */ }
  })();

/* ============================================================
     SCENE B — PROJECT CAROUSEL (drag the ring, snap to card)
  ============================================================ */
  (() => {
    const canvas = document.getElementById("carouselCanvas");
    if (!canvas) return;

    const PROJECTS = [
      { t: "Ingredient Tracking System", d: "Built end-to-end: PHP backend, PostgreSQL/MySQL schemas, secure auth, real-time stock tracking & smart dish recommendations.", tags: ["PHP", "MySQL", "PostgreSQL"], role: "FULL-STACK" },
      { t: "Aether LMS — LCCTlibTrack", d: "Deployed at LCC Tanauan: client-server workstation monitoring with session logging & institutional usage reporting.", tags: ["Networking", "SysAdmin", "Desktop"], role: "DEVELOPER" },
      { t: "2.5D Tactical Strategy Game", d: "Turn-based auto-battler — Flutter/Dart + JS mechanics, Blender-modeled 3D assets, custom pixel-art sprites & physics.", tags: ["Flutter", "Dart", "JS", "Blender"], role: "GAME DEV" },
    ];

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.15, 5.4);

    // ---- build card textures on a 2D canvas ----
    const makeTex = (p, i) => {
      const c = document.createElement("canvas"); c.width = 1024; c.height = 640;
      const x = c.getContext("2d");
      // glass card
      x.fillStyle = "rgba(255,255,255,0.045)"; 
      roundRect(x, 6, 6, 1012, 628, 40); x.fill();
      x.strokeStyle = "rgba(94,227,255,0.55)"; x.lineWidth = 3;
      roundRect(x, 6, 6, 1012, 628, 40); x.stroke();
      // number
      x.font = "500 60px 'IBM Plex Mono', monospace"; x.fillStyle = "rgba(94,227,255,0.9)";
      x.fillText("0" + (i + 1), 56, 108);
      x.strokeStyle = "rgba(130,190,255,0.25)"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(56, 138); x.lineTo(968, 138); x.stroke();
      // title
      x.font = "600 62px 'Space Grotesk', sans-serif"; x.fillStyle = "#eaf4ff";
      wrapText(x, p.t, 56, 230, 912, 72);
      // desc
      x.font = "400 36px 'Space Grotesk', sans-serif"; x.fillStyle = "rgba(127,147,177,1)";
      wrapText(x, p.d, 56, 340, 912, 50);
      // role tag
      x.font = "400 30px 'IBM Plex Mono', monospace"; x.fillStyle = "#5ee3ff";
      x.fillText("▸ " + p.role, 56, 565);
      x.textAlign = "right"; x.fillStyle = "rgba(127,147,177,1)";
      x.fillText(p.tags.join(" · "), 968, 565); x.textAlign = "left";
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      return tex;
    };
    function roundRect(x, a, b, w, h, r) {
      x.beginPath(); x.moveTo(a + r, b);
      x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
      x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
    }
    function wrapText(x, text, px, py, maxW, lh) {
      const words = text.split(" "); let line = "", yy = py;
      for (const w of words) {
        const test = line + w + " ";
        if (x.measureText(test).width > maxW && line) { x.fillText(line, px, yy); line = w + " "; yy += lh; }
        else line = test;
      }
      x.fillText(line, px, yy);
    }

    const group = new THREE.Group();
    scene.add(group);
    const N = PROJECTS.length, radius = 2.05, step = (Math.PI * 2) / N;
    const cards = PROJECTS.map((p, i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(3.3, 2.05),
        new THREE.MeshBasicMaterial({ map: makeTex(p, i), transparent: true, side: THREE.DoubleSide })
      );
      const a = i * step;
      m.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
      m.rotation.y = a;
      group.add(m);
      return m;
    });
    // ground reflection glow
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 48),
      new THREE.MeshBasicMaterial({ color: SKY, transparent: true, opacity: 0.05 })
    );
    glow.rotation.x = -Math.PI / 2; glow.position.y = -1.45;
    scene.add(glow);

    // ---- drag with inertia + snap ----
    let vel = 0, dragging = false, px = 0, targetRot = 0, focused = 0;
    const speed = 0.0045;
    const hint = document.getElementById("carouselHint");

    const info = {
      idx: document.getElementById("carIdx"),
      role: document.getElementById("carRole"),
      title: document.getElementById("carTitle"),
      desc: document.getElementById("carDesc"),
      tags: document.getElementById("carTags"),
    };
    const updateInfo = () => {
      const p = PROJECTS[focused];
      info.idx.textContent = `${String(focused + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
      info.role.textContent = p.role;
      info.title.textContent = p.t;
      info.desc.textContent = p.d;
      info.tags.innerHTML = p.tags.map(t => `<span>${t}</span>`).join("");
    };

    // Front-facing card = where (i * step + rotation) ≈ 0  →  rotY = -focused * step
    const snap = () => {
      focused = ((-Math.round(group.rotation.y / step)) % N + N) % N;
      targetRot = -focused * step;
      updateInfo();
    };
    const spinTo = (dir) => {
      focused = ((focused + dir) % N + N) % N;   // button-driven: jump straight to target
      targetRot = -focused * step;
      vel = dir * 0.015;                          // small kick for momentum feel
      updateInfo();
    };
    document.getElementById("carPrev")?.addEventListener("click", () => spinTo(-1));
    document.getElementById("carNext")?.addEventListener("click", () => spinTo(1));

    canvas.addEventListener("pointerdown", e => {
      dragging = true; px = e.clientX; vel = 0;
      canvas.setPointerCapture(e.pointerId); canvas.classList.add("grabbing");
      if (hint) hint.style.opacity = 0;
    });
    addEventListener("pointerup", () => { if (dragging) { dragging = false; canvas.classList.remove("grabbing"); snap(); } });
    canvas.addEventListener("pointermove", e => {
      if (dragging) { vel = (e.clientX - px) * speed; group.rotation.y += vel; px = e.clientX; }
    });

    const fit = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      camera.position.z = w < 700 ? 6.6 : 5.4;
    };
    fit();
    addEventListener("resize", fit);
    window.__fitCarousel = fit;

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!active.projects) return;
      const t = clock.getElapsedTime();
      if (!dragging) {
        vel *= 0.94;
        group.rotation.y += vel;
        // ease toward snapped target
        group.rotation.y += (targetRot - group.rotation.y) * 0.06;
      }
      cards.forEach((m, i) => {
        // face-forward emphasis + gentle float
        const behind = Math.cos((i * step) + group.rotation.y);
        m.position.y = Math.sin(t * 1.2 + i) * 0.05;
        m.material.opacity = 0.35 + Math.max(0, behind) * 0.65;
      });
      glow.material.opacity = 0.04 + Math.sin(t * 2) * 0.015;
      renderer.render(scene, camera);
    })();
    updateInfo();
  })();
})();
