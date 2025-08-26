/**
 * Shop Demo - client-side interactions
 * - Product add to cart
 * - Cart quantity, remove, totals (subtotal, discount via promo, tax, grand total)
 * - Promo code: SAVE10 (10% off)
 * - Search (toolbar + header search synced), Sort (featured, price asc/desc, rating)
 * - Modal open/close with focus trapping and ESC
 * - Accessible updates (aria-live cart region)
 *
 * To use: include in index.html near the end of body:
 *   <script src="assets/app.js" defer></script>
 */
(function () {
  // -----------------------
  // Utilities
  // -----------------------
  const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const formatCurrency = (n) => currencyFmt.format(n || 0);
  const parseCurrency = (s) => {
    if (!s) return 0;
    const num = String(s).replace(/[^\d.-]+/g, '');
    return Number.parseFloat(num) || 0;
  };
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const slugify = (s) =>
    String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -----------------------
  // DOM references
  // -----------------------
  const productListEl = $('#product-list');
  const productCards = $$('.product-card', productListEl);

  const toolbarSearchInput = $('#toolbar-search');
  const headerSearchInput = $('#global-search');
  const sortSelect = $('#sort-select');
  const filterChips = $$('.filters .chip');

  const cartPanel = $('#cart');
  const cartItemsEl = $('#cart-items');
  const emptyCartEl = $('#empty-cart');
  const totalsGridEl = $('#cart-total .totals-grid');
  const checkoutBtn = $('#checkout-btn');

  const headerCartLink = document.querySelector('.nav-actions a[href="#cart"]');
  const headerBadge = headerCartLink ? headerCartLink.querySelector('.badge') : null;

  // Promo
  const promoForm = $('.promo');
  const promoInput = $('#promo-code');
  const promoApplyBtn = promoForm ? promoForm.querySelector('button[type="button"]') : null;
  const promoFeedback = $('.promo-feedback');

  // Modal
  const modal = $('#checkout-modal');
  const modalBackdrop = modal ? $('.modal-backdrop', modal) : null;
  const modalCloseBtn = modal ? $('.modal-header .icon-btn', modal) : null;
  const modalCancelBtn = modal ? $('.modal-footer .ghost', modal) : null;
  const modalConfirmBtn = modal ? $('.modal-footer .add-btn', modal) : null;

  // -----------------------
  // State
  // -----------------------
  const state = {
    // Build products from DOM to support sort/filter/add
    products: [],
    // Map<id, {id, name, price, qty, img}>
    cart: new Map(),
    // promo: { code: 'SAVE10', type: 'percent', value: 10 }
    promo: null,
    // tax rate (example ~8.3%)
    taxRate: 0.083,
    // current search query
    query: '',
    // 'featured' | 'price-asc' | 'price-desc' | 'rating-desc'
    sort: 'featured',
    // remember original DOM order for featured sorting
    featuredOrderIdx: new Map(),
    // focus handling for modal
    lastFocusedEl: null,
  };

  // -----------------------
  // Init: Build product data
  // -----------------------
  productCards.forEach((card, index) => {
    const name = card.querySelector('h3')?.textContent?.trim() || `product-${index + 1}`;
    const price = parseCurrency(card.querySelector('.price')?.textContent);
    const ratingText = card.querySelector('.meta span')?.textContent || '';
    const rating = (ratingText.match(/★/g) || []).length; // count filled stars
    const stockOut = !!card.querySelector('.stock.out');
    const img = card.querySelector('img')?.getAttribute('src') || '';
    const id = slugify(name) || `product-${index + 1}`;

    state.products.push({
      id,
      name,
      price,
      rating,
      stockOut,
      img,
      el: card,
      featuredIdx: index,
    });

    state.featuredOrderIdx.set(card, index);

    // Add-to-cart button
    const addBtn = card.querySelector('.add-btn');
    if (addBtn && !addBtn.disabled) {
      addBtn.addEventListener('click', () => {
        addToCart(id, 1);
        // Scroll to cart on small screens optionally
        // cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  // -----------------------
  // Cart: initialize from existing DOM (if any)
  // -----------------------
  function initCartFromDOM() {
    const items = $$('.cart-item', cartItemsEl);
    if (!items.length) return;

    items.forEach((item) => {
      const name = item.querySelector('.details .name')?.textContent?.trim() || '';
      const id = slugify(name) || `item-${Math.random().toString(36).slice(2, 7)}`;
      const unitPrice = parseCurrency(item.querySelector('.details .unit')?.textContent);
      const qty = parseInt(item.querySelector('.qty-input')?.value || '1', 10);
      const img = item.querySelector('img')?.getAttribute('src') || '';

      // If product exists, prefer its price/img; else keep parsed
      const product = state.products.find((p) => slugify(p.name) === slugify(name));
      const price = product ? product.price : unitPrice;
      const image = product ? product.img : img;

      state.cart.set(id, {
        id,
        name,
        price,
        qty: clamp(qty || 1, 1, 999),
        img: image,
      });
    });

    // Re-render controlled cart UI
    renderCart();
  }

  // -----------------------
  // Cart operations
  // -----------------------
  function addToCart(productId, qty = 1) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stockOut) return;

    const existing = state.cart.get(productId);
    const nextQty = clamp((existing?.qty || 0) + qty, 1, 999);

    state.cart.set(productId, {
      id: productId,
      name: product.name,
      price: product.price,
      qty: nextQty,
      img: product.img,
    });

    renderCart();
  }

  function updateQty(id, qty) {
    const item = state.cart.get(id);
    if (!item) return;
    const nextQty = clamp(parseInt(qty, 10) || 1, 1, 999);
    item.qty = nextQty;
    state.cart.set(id, item);
    renderCart();
  }

  function removeFromCart(id) {
    state.cart.delete(id);
    renderCart();
  }

  // -----------------------
  // Renderers
  // -----------------------
  function renderCart() {
    // Empty state
    const itemList = Array.from(state.cart.values());
    if (itemList.length === 0) {
      emptyCartEl?.classList.remove('hidden');
      cartItemsEl.querySelectorAll('.cart-item').forEach((el) => el.remove());
    } else {
      emptyCartEl?.classList.add('hidden');

      // Render items
      // We rebuild list to keep markup consistent
      const frag = document.createDocumentFragment();
      itemList.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.setAttribute('data-id', item.id);

        row.innerHTML = [
          `<img src="${item.img}" alt="${escapeHtml(item.name)} thumbnail" />`,
          `<div class="details">`,
          `  <div class="name">${escapeHtml(item.name)}</div>`,
          `  <div class="unit">${formatCurrency(item.price)} each</div>`,
          `</div>`,
          `<div class="qty" aria-label="Quantity controls">`,
          `  <button class="icon-btn" type="button" aria-label="Decrease quantity">−</button>`,
          `  <input class="qty-input" type="number" inputmode="numeric" min="1" value="${item.qty}" aria-label="Quantity" />`,
          `  <button class="icon-btn" type="button" aria-label="Increase quantity">+</button>`,
          `</div>`,
          `<div class="line-total">${formatCurrency(item.qty * item.price)}</div>`,
          `<button class="icon-btn remove" type="button" aria-label="Remove item">✕</button>`,
        ].join('');

        frag.appendChild(row);
      });

      // Clear existing non-empty-state nodes
      cartItemsEl.querySelectorAll('.cart-item').forEach((el) => el.remove());
      cartItemsEl.appendChild(frag);
    }

    // Update header badge and totals
    updateHeaderBadge();
    renderTotals();
  }

  function updateHeaderBadge() {
    if (!headerBadge) return;
    const totalQty = Array.from(state.cart.values()).reduce((sum, it) => sum + it.qty, 0);
    headerBadge.textContent = String(totalQty);
    headerBadge.setAttribute('aria-label', `items in cart: ${totalQty}`);
  }

  function renderTotals() {
    const subtotal = Array.from(state.cart.values()).reduce((sum, it) => sum + it.price * it.qty, 0);
    const discount = computeDiscount(subtotal);
    const taxable = Math.max(0, subtotal - discount);
    const tax = round2(taxable * state.taxRate);
    const grand = round2(taxable + tax);

    // Rebuild totals grid content to ensure consistency
    totalsGridEl.innerHTML = [
      `<div>Subtotal</div><div>${formatCurrency(round2(subtotal))}</div>`,
      `<div>Discount</div><div>${discount > 0 ? '− ' : ''}${formatCurrency(discount)}</div>`,
      `<div>Tax</div><div>${formatCurrency(tax)}</div>`,
      `<div class="grand">Grand Total</div><div class="grand">${formatCurrency(grand)}</div>`,
    ].join('');
  }

  // -----------------------
  // Promo codes
  // -----------------------
  function computeDiscount(subtotal) {
    if (!state.promo) return 0;
    if (state.promo.type === 'percent') {
      return round2((state.promo.value / 100) * subtotal);
    }
    if (state.promo.type === 'fixed') {
      return round2(Math.min(state.promo.value, subtotal));
    }
    return 0;
  }

  function applyPromo(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      state.promo = null;
      setPromoFeedback('No promo applied.');
      renderTotals();
      return;
    }

    switch (normalized) {
      case 'SAVE10':
        state.promo = { code: 'SAVE10', type: 'percent', value: 10 };
        setPromoFeedback('Applied: SAVE10 (10% off).');
        break;
      case 'FREESHIP':
        // No shipping line in totals, so just acknowledge.
        state.promo = { code: 'FREESHIP', type: 'fixed', value: 0 };
        setPromoFeedback('Applied: FREESHIP (free shipping at fulfillment).');
        break;
      default:
        state.promo = null;
        setPromoFeedback('Sorry, that code is not valid.');
        break;
    }
    renderTotals();
  }

  function setPromoFeedback(msg) {
    if (promoFeedback) promoFeedback.textContent = msg;
  }

  // -----------------------
  // Search + Sort + Filters
  // -----------------------
  function setQuery(q) {
    state.query = (q || '').toLowerCase().trim();

    // sync inputs
    if (toolbarSearchInput && toolbarSearchInput !== document.activeElement) {
      toolbarSearchInput.value = q;
    }
    if (headerSearchInput && headerSearchInput !== document.activeElement) {
      headerSearchInput.value = q;
    }

    applyFilterAndSort();
  }

  function setSort(value) {
    state.sort = value || 'featured';
    applyFilterAndSort();
  }

  function applyFilterAndSort() {
    // Filter: by name (and alt text)
    const q = state.query;
    const matches = (p) => {
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const alt = p.el.querySelector('img')?.getAttribute('alt') || '';
      const inAlt = alt.toLowerCase().includes(q);
      return inName || inAlt;
    };

    // First, filter visibility
    state.products.forEach((p) => {
      p.el.style.display = matches(p) ? '' : 'none';
    });

    // Then sort visible ones by chosen criteria by re-append
    const visible = state.products.filter((p) => p.el.style.display !== 'none');
    let sorted = [...visible];

    switch (state.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        sorted.sort((a, b) => a.featuredIdx - b.featuredIdx);
        break;
    }

    // Re-append in new order (only visible items are moved)
    sorted.forEach((p) => productListEl.appendChild(p.el));
  }

  // Filter chips: toggle active state (no categories in markup yet)
  function wireFilterChips() {
    if (!filterChips.length) return;
    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        filterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        // If you later add data-category on product cards,
        // implement category filtering here. For now we only change visual state.
        applyFilterAndSort();
      });
    });
  }

  // -----------------------
  // Modal: open/close + focus trap
  // -----------------------
  function openModal() {
    if (!modal) return;
    state.lastFocusedEl = document.activeElement;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus first field
    const firstInput = $('#name', modal) || modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstInput) firstInput.focus();

    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === 'function') {
      state.lastFocusedEl.focus();
    }
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function trapFocus(e) {
    const focusables = getFocusable(modal);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (active === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  function getFocusable(root) {
    if (!root) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return $$(selectors.join(','), root).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  // -----------------------
  // Event wiring
  // -----------------------
  function wireEvents() {
    // Search synced
    if (toolbarSearchInput) {
      toolbarSearchInput.addEventListener('input', (e) => setQuery(e.target.value));
    }
    if (headerSearchInput) {
      headerSearchInput.addEventListener('input', (e) => setQuery(e.target.value));
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => setSort(e.target.value));
    }

    // Filter chips
    wireFilterChips();

    // Cart item interactions (event delegation)
    cartItemsEl.addEventListener('click', (e) => {
      const target = e.target;
      const row = target.closest('.cart-item');
      if (!row) return;
      const id = row.getAttribute('data-id');

      if (target.classList.contains('remove')) {
        removeFromCart(id);
        return;
      }

      if (target.classList.contains('icon-btn')) {
        const label = target.getAttribute('aria-label') || '';
        const input = row.querySelector('.qty-input');
        const current = parseInt(input.value || '1', 10);

        if (/Decrease/i.test(label)) {
          const next = Math.max(1, current - 1);
          input.value = String(next);
          updateQty(id, next);
        } else if (/Increase/i.test(label)) {
          const next = Math.min(999, current + 1);
          input.value = String(next);
          updateQty(id, next);
        }
      }
    });

    cartItemsEl.addEventListener('change', (e) => {
      const input = e.target;
      if (!input.classList.contains('qty-input')) return;
      const row = input.closest('.cart-item');
      const id = row?.getAttribute('data-id');
      if (!id) return;
      updateQty(id, input.value);
    });

    // Promo
    if (promoApplyBtn) {
      promoApplyBtn.addEventListener('click', () => applyPromo(promoInput?.value));
    }
    if (promoInput) {
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyPromo(promoInput.value);
        }
      });
    }

    // Checkout modal open
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', openModal);
    }

    // Modal close
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener('click', () => {
        // In a real app, validate and submit order here
        closeModal();
        alert('Order confirmed! (demo)');
      });
    }
  }

  // -----------------------
  // Helpers
  // -----------------------
  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -----------------------
  // Bootstrap
  // -----------------------
  function init() {
    // Sync displayed query/sort with default state
    if (toolbarSearchInput) toolbarSearchInput.value = '';
    if (headerSearchInput) headerSearchInput.value = '';
    if (sortSelect) sortSelect.value = 'featured';

    // Build state.cart from existing markup, then take over rendering
    initCartFromDOM();

    // If no pre-rendered cart existed, still ensure UI is consistent
    if (state.cart.size === 0) {
      renderCart();
    }

    // Apply default filter/sort on products
    applyFilterAndSort();

    // Wire up listeners
    wireEvents();
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  /**
 * Theme toggle:
 * - Explicit 'light' or 'dark' stored in localStorage('theme')
 * - If none stored, the site follows system preference (no data-theme on <html>)
 * - Button reflects current effective mode and toggles on click
 */
(function () {
  const storageKey = 'theme'; // 'light' | 'dark'
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function getStoredTheme() {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  }
  function setStoredTheme(value) {
    try { localStorage.setItem(storageKey, value); } catch {}
  }
  function clearStoredTheme() {
    try { localStorage.removeItem(storageKey); } catch {}
  }

  function effectiveMode() {
    // If explicitly set on html, respect it; else follow system
    const explicit = root.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') return explicit;
    return mq.matches ? 'dark' : 'light';
  }

  function applyTheme(mode) {
    if (mode === 'light' || mode === 'dark') {
      root.setAttribute('data-theme', mode);
      setStoredTheme(mode);
    } else {
      // Reset to system
      root.removeAttribute('data-theme');
      clearStoredTheme();
    }
    updateButton();
  }

  function updateButton() {
    if (!btn) return;
    const mode = effectiveMode();
    const isDark = mode === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    // Simple emoji icon; replace with SVG if desired
    btn.textContent = isDark ? '🌙' : '🌞';
  }

  function toggle() {
    const mode = effectiveMode();
    applyTheme(mode === 'dark' ? 'light' : 'dark');
  }

  // Initialize from storage (if any); otherwise leave unset to follow system
  const saved = getStoredTheme();
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  } else {
    root.removeAttribute('data-theme');
  }

  updateButton();

  if (btn) btn.addEventListener('click', toggle);

  // If following system (no stored theme), reflect OS changes in the button UI
  mq.addEventListener('change', () => {
    if (!getStoredTheme()) updateButton();
  });
})();
})();