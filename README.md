# Product Shop UI

A responsive, accessible storefront UI built with vanilla HTML/CSS/JS. Includes a Light/Dark theme toggle, product grid, and sticky cart panel.

Note: The sample index.html uses the document title “Product Shop” and the visible brand label “Product Shop.” You can update either to match your preferred branding.

## Features

- Responsive layout: products grid + sticky cart sidebar
- Light/Dark theme toggle:
  - Follows system preference by default
  - Manual override persisted in localStorage
  - No-flash-on-load setup (inline init script)
- Clean blue/teal palette with soft background gradients
- Accessible semantics: ARIA landmarks, keyboard-friendly controls, focus-visible styles
- Zero framework dependencies (static site)

## Demo


## Project structure

- index.html — Page markup and inline early theme init
- style.css — Main styles (variables, layout, components, themes)
- assets/js/theme-toggle.js — Theme toggle logic
- script.js — Placeholder for your product/cart behavior

You can place images and icons under assets/ as needed.

## Quick start

Open directly
- Double-click index.html to open in your browser.

Run a local static server (optional)
- Node: `npx serve .`
- Python: `python3 -m http.server 5173`
- Bun: `bunx serve .`
- Then visit the printed URL (e.g., http://localhost:5173).

## Theming

How it works
- If no explicit theme is saved, the site follows the OS setting via prefers-color-scheme.
- When the user toggles, the chosen mode is saved to localStorage('theme') as `light` or `dark`.
- An inline script in `<head>` applies the stored theme early to avoid a flash of the wrong theme.

Theme toggle button
- Defined in the header as `button#theme-toggle` with class `icon-btn`.
- The script in `assets/js/theme-toggle.js` toggles `data-theme="light|dark"` on `<html>` and updates the button state.

Key CSS variables (in style.css)
- Surfaces and text: `--bg`, `--card-bg`, `--text`, `--muted`, `--border`
- Accent palette: `--accent`, `--accent-hover`, `--accent-2`, `--accent-contrast`, `--accent-soft`
- Layout/FX: `--shadow-sm`, `--shadow-md`, `--radius`
- Background tints: `--bg-tint-1`, `--bg-tint-2`
- Header/footer: `--header-bg`, `--footer-bg`

Change brand colors
- Edit `--accent` and `--accent-hover` under `:root` (light) and `:root[data-theme="dark"]` (dark).
- Optionally tweak `--accent-2` to adjust gradient secondary hue.

Soften or remove page gradients
- In `body { background: ... }`, replace the radial-gradient layers with a solid `var(--bg)` or lower-alpha tints.

## Accessibility

- Keyboard: All interactive controls are reachable; `:focus-visible` styles are prominent.
- ARIA: Landmarks (`header`, `nav`, `main`, `aside`, `footer`), descriptive labels, and `aria-live` on the cart list.
- Reduced motion: Transitions/animations are minimized when `prefers-reduced-motion: reduce` is set.
- Contrast: The palette targets good text contrast; re-check after customizing brand colors.

## Customization

- Brand name and title:
  - Title: `<title>…</title>` in `<head>`.
  - Header label: `.brand > span` text in the header.
- Grid density: Adjust `#product-list` `minmax(240px, 1fr)` and `gap`.
- Card style: Change `--radius`, `--shadow-sm`, `--shadow-md`.
- Sticky cart offset: `.cart-panel { top: calc(66px + 16px); }`.
- Buttons: Shared styles for `.add-btn`, `.icon-btn`, `.ghost`.

## Browser support

- Modern evergreen browsers.
- `color-mix()` and OKLab are used for subtle tints; if you need wider support, replace `color-mix(...)` with static colors.

## Deployment

This is a static site and can be hosted on:
- GitHub Pages, Netlify, Vercel, S3, etc.

Ensure asset paths are correct (e.g., `assets/js/theme-toggle.js`).

## Next steps (optional)

- Implement cart interactivity in `script.js`: quantity updates, remove items, totals, promo codes.
- Hook the product grid to a data source or CMS.
- Add a 3-way theme switch (System/Light/Dark) if desired.

## License

-MIT License. You are free to use, modify, and distribute. Add a LICENSE file for clarity in your repo.
