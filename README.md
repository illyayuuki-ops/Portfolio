# ✦ IT Student Portfolio — Formal Copy · Game UI Design

A blue / sky-blue / white **glassmorphism** portfolio in a sleek sci-fi HUD design — with **formal, professional wording** throughout (employer & instructor friendly). Features a loading screen, crosshair cursor, HUD progress bar, **profile card** with soft-skill ratings, skills with segmented progress bars, project cards with roles & scope, certification cards with lightbox, gallery, video showcase, a dialog-style contact panel, a retro grid floor + real-time **3D torus knot**, glitch text, scanlines, and subtle **UI sound effects** — built with **pure HTML, CSS & vanilla JavaScript** (zero dependencies, zero build step). Perfect for **GitHub Pages**.

🎧 Sound effects: toggle in the top-right HUD.

---

## 📁 Folder structure

```
portfolio/
├── index.html ← the whole site (edit your content here)
├── css/style.css
├── js/scene3d.js ← the custom 3D engine
├── js/main.js ← animations & interactions
└── assets/
    ├── images/ ← profile.svg + photo-1..4.svg (REPLACE with your pics)
    ├── certificates/ ← cert-1..4.svg (REPLACE with your certificates)
    └── videos/ ← drop your demo-1.mp4, demo-2.mp4 here
```

## ✎ How to customize (5 minutes)

1. **Your name / bio / school** → open `index.html`, search for `✎ EDIT` comments.
2. **Profile photo** → put your picture in `assets/images/` (e.g. `profile.jpg`), then in `index.html` change `src="assets/images/profile.svg"` → `profile.jpg`.
3. **Gallery pictures** → add `photo-1.jpg` … `photo-4.jpg` and update the `src` + `data-lightbox` attributes.
4. **Certificates** → add `cert-1.jpg` … `cert-4.jpg` in `assets/certificates/` and update the `<img src>` / `data-lightbox`.
5. **Videos** → drop `.mp4` files into `assets/videos/` named `demo-1.mp4`, `demo-2.mp4`. Until you do, a stylish "Video slot ready" placeholder appears automatically.
6. **Social links & email** → search for `github.com/yourusername`, `your.email@example.com` in `index.html` (and the `ME` variable at the bottom of `js/main.js`).
7. **Roles typing effect** → edit the `roles` array in `js/main.js`.
8. **Skill percentages** → edit `data-percent="90"` on each skill ring.
9. **Colors** → all theme colors live at the top of `css/style.css` under `:root`.

## 🚀 Deploy on GitHub Pages (free HTTPS domain)

1. Create a GitHub account → new repository named **`yourusername.github.io`** (this gives you the exact URL `https://yourusername.github.io`).
2. Upload everything inside the `portfolio/` folder to the repo root (drag & drop on github.com works fine), with `index.html` at the top level.
3. Commit. Done — your site is live at **https://yourusername.github.io** within ~1 minute.

> Project page instead? Name the repo anything (e.g. `portfolio`), then go to
> **Settings → Pages → Branch: main → Save**. Live at `https://yourusername.github.io/portfolio/`.

### 🖥️ Preview locally
Just open `index.html` in a browser, or run a tiny server:
```bash
cd portfolio
python3 -m http.server 8000   # → http://localhost:8000
```

## 💌 Optional: real contact form (no backend)
Sign up free at [formsubmit.co](https://formsubmit.co), then change the
`<form>` tag in `index.html` to:
```html
<form action="https://formsubmit.co/youremail@gmail.com" method="POST">
```
and add `name="name"`, `name="email"`, `name="message"` to the inputs.

---
✦ 100% static — works offline, no frameworks, loads fast, and looks premium everywhere.
