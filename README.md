# 🛍️ Product Shop UI

A responsive, accessible storefront UI built with vanilla HTML/CSS/JS. Includes a 🌞/🌙 Light/Dark theme toggle, product grid, and sticky cart panel.

> 📝 Note: The sample `index.html` uses the document title “Product Shop” and the visible brand label “Product Shop.” You can update either to match your preferred branding.

---

## ✨ Features

- 📱 Responsive layout: products grid + sticky cart sidebar  
- 🎨 Light/Dark theme toggle:  
  - 🧭 Follows system preference by default  
  - 💾 Manual override persisted in localStorage  
  - ⚡ No-flash-on-load setup (inline init script)  
- 🧵 Clean blue/teal palette with soft background gradients  
- ♿ Accessible semantics: ARIA landmarks, keyboard-friendly controls, focus-visible styles  
- 🧱 Zero framework dependencies (static site)  

---

## 🖼️ Demo

![image](https://github.com/Mdsaif4363/Product-Shop/blob/82282ebb866a68d67d89a6b45a72a4cd5de4a917/Screenshot%202025-08-26%20121356.png)

---

## 📁 Project Structure

- 🧾 `index.html` — Page markup and inline early theme init  
- 🎨 `style.css` — Main styles (variables, layout, components, themes)  
- 🧠 `assets/js/theme-toggle.js` — Theme toggle logic  
- 🛒 `script.js` — Placeholder for your product/cart behavior  

📦 You can place images and icons under `assets/` as needed.

---

## 🚀 Quick Start

🔓 Open directly  
- 🖱️ Double-click `index.html` to open in your browser.

🖥️ Run a local static server (optional)  
- 🟦 Node: `npx serve .`  
- 🐍 Python: `python3 -m http.server 5173`  
- 🍞 Bun: `bunx serve .`  
- 🔗 Then visit the printed URL (e.g., http://localhost:5173)

---

## 🎭 Theming

🛠️ How it works  
- 🧭 Follows OS setting via `prefers-color-scheme` if no theme is saved  
- 💾 Saves user toggle in `localStorage('theme')` as `light` or `dark`  
- ⚡ Inline script in `<head>` applies stored theme early to avoid flash

🖱️ Theme toggle button  
- Defined in header as `button#theme-toggle` with class `icon-btn`  
- Toggles `data-theme="light|dark"` on `<html>` and updates button state

🎨 Key CSS variables (`style.css`)  
- Surfaces/text: `--bg`, `--card-bg`, `--text`, `--muted`, `--border`  
- Accent palette: `--accent`, `--accent-hover`, `--accent-2`, `--accent-contrast`, `--accent-soft`  
- Layout/FX: `--shadow-sm`, `--shadow-md`, `--radius`  
- Background tints: `--bg-tint-1`, `--bg-tint-2`  
- Header/footer: `--header-bg`, `--footer-bg`

🎨 Change brand colors  
- Edit `--accent`, `--accent-hover` under `:root` and `:root[data-theme="dark"]`  
- Tweak `--accent-2` for gradient secondary hue

🌫️ Soften/remove gradients  
- In `body { background: ... }`, replace radial-gradient with solid `var(--bg)` or lower-alpha tints

---

## ♿ Accessibility

- ⌨️ Keyboard: All controls reachable; `:focus-visible` styles are prominent  
- 🧭 ARIA: Landmarks (`header`, `nav`, `main`, `aside`, `footer`), labels, and `aria-live` on cart  
- 🌀 Reduced motion: Honors `prefers-reduced-motion: reduce`  
- 🎯 Contrast: Palette targets good text contrast (re-check after customizing)

---

## 🛠️ Customization

- 🏷️ Brand name and title:  
  - Title: `<title>…</title>` in `<head>`  
  - Header label: `.brand > span` text in header  
- 🧮 Grid density: Adjust `#product-list` `minmax(240px, 1fr)` and `gap`  
- 🧊 Card style: Change `--radius`, `--shadow-sm`, `--shadow-md`  
- 📌 Sticky cart offset: `.cart-panel { top: calc(66px + 16px); }`  
- 🔘 Buttons: Shared styles for `.add-btn`, `.icon-btn`, `.ghost`

---

## 🌐 Browser Support

- ✅ Modern evergreen browsers  
- 🎨 `color-mix()` and OKLab used for subtle tints  
  - 🧪 Replace with static colors for wider support

---

## 📦 Deployment

This is a static site and can be hosted on:  
- 🌍 GitHub Pages  
- 🚀 Netlify  
- ⚡ Vercel  
- ☁️ S3  

📌 Ensure asset paths are correct (e.g., `assets/js/theme-toggle.js`)

---

## 🧩 Next Steps (Optional)

- 🛒 Implement cart logic in `script.js`: quantity, remove, totals, promo codes  
- 🔗 Hook product grid to data source or CMS  
- 🎛️ Add 3-way theme switch (System/Light/Dark)

---

## 📜 License

🆓 MIT License — Free to use, modify, and distribute.  
📄 Add a LICENSE file for clarity in your repo.
