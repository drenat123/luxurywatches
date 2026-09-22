/* =========================================================
   LUXURY WATCHES KS — FULL E-COMMERCE ENGINE
   Cart, Search, Checkout — All powered by localStorage
========================================================= */

// ─── CART STATE ───────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('lw_cart')) || [];

function saveCart() {
    localStorage.setItem('lw_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        el.textContent = total;
    });
}

function addToCart(name, price, image, brand) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price: parseFloat(price), image, brand, qty: 1 });
    }
    saveCart();
    showToast('Produkti u shtua në shportë!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    if (typeof renderCartPage === 'function') renderCartPage();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart();
    if (typeof renderCartPage === 'function') renderCartPage();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function clearCart() {
    cart = [];
    saveCart();
}

// ─── TOAST NOTIFICATION ──────────────────────────────────
function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = `<i data-lucide="check-circle" style="color:#4CAF50;"></i><span>${msg}</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── BIND "ADD TO CART" BUTTONS ──────────────────────────
function bindCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card');
            const name = card.querySelector('.product-title').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent.replace('€', '').trim();
            const image = card.querySelector('.product-image img')?.src || '';
            const brand = card.querySelector('.product-category')?.textContent.trim() || '';
            addToCart(name, priceText, image, brand);
        });
    });
}

// ─── SLIDESHOW ───────────────────────────────────────────
function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length < 2) return;
    let current = 0;
    function show(i) {
        slides.forEach(s => s.classList.remove('active-slide'));
        indicators.forEach(ind => ind.classList.remove('active'));
        slides[i].classList.add('active-slide');
        if (indicators[i]) indicators[i].classList.add('active');
    }
    setInterval(() => { current = (current + 1) % slides.length; show(current); }, 6000);
}

// ─── MOBILE DRAWER ───────────────────────────────────────
function initDrawer() {
    const openBtn = document.getElementById('mobile-menu-open');
    const closeBtn = document.getElementById('mobile-menu-close');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!openBtn || !drawer) return;

    function open() { drawer.classList.add('open'); overlay?.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { drawer.classList.remove('open'); overlay?.classList.remove('active'); document.body.style.overflow = ''; }

    openBtn.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
}

// ─── MOBILE FILTER TRAY (shop page) ─────────────────────
function initFilterTray() {
    const trigger = document.getElementById('mobile-filter-btn');
    const sidebar = document.getElementById('sidebar-filters');
    const close = document.getElementById('close-filters');
    if (!trigger || !sidebar) return;

    trigger.addEventListener('click', () => { sidebar.classList.add('mobile-open'); document.body.style.overflow = 'hidden'; });
    close?.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); document.body.style.overflow = ''; });
}

// ─── ACCORDION (Orlette Style) ──────────────────────────
function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = btn.parentElement;
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('i');
            const isActive = parent.classList.contains('active');
            if (isActive) { parent.classList.remove('active'); content.style.display = 'none'; if (icon) icon.setAttribute('data-lucide', 'chevron-down'); }
            else { parent.classList.add('active'); content.style.display = 'block'; if (icon) icon.setAttribute('data-lucide', 'chevron-up'); }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });
    document.querySelectorAll('.accordion-sub-header').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = btn.parentElement;
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('i');
            const isActive = parent.classList.contains('active');
            if (isActive) { parent.classList.remove('active'); content.style.display = 'none'; if (icon) icon.setAttribute('data-lucide', 'chevron-down'); }
            else { parent.classList.add('active'); content.style.display = 'block'; if (icon) icon.setAttribute('data-lucide', 'chevron-up'); }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });
}

// ─── SEARCH OVERLAY ─────────────────────────────────────
function initSearch() {
    const trigger = document.querySelector('.search-trigger');
    const overlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const input = document.getElementById('search-input');
    const resultsBox = document.getElementById('search-results');

    if (!trigger || !overlay) return;

    trigger.addEventListener('click', () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => input?.focus(), 300);
    });
    closeSearch?.addEventListener('click', () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Search through all product cards on the page and show matches
    if (input && resultsBox) {
        input.addEventListener('input', () => {
            const query = input.value.toLowerCase().trim();
            if (query.length < 2) { resultsBox.innerHTML = '<p style="color:#999; text-align:center;">Shkruani emrin e produktit...</p>'; return; }

            // Search all product cards present in the DOM
            const allCards = document.querySelectorAll('.product-card');
            let html = '';
            let count = 0;
            allCards.forEach(card => {
                const title = card.querySelector('.product-title')?.textContent || '';
                const brand = card.querySelector('.product-category')?.textContent || '';
                if ((title + ' ' + brand).toLowerCase().includes(query)) {
                    const img = card.querySelector('.product-image img')?.src || '';
                    const price = card.querySelector('.product-price')?.textContent || '';
                    html += `<a href="shop.html" class="search-result-item">
                        <img src="${img}" alt="">
                        <div><strong>${brand}</strong><br>${title}<br><span style="color:var(--accent); font-weight:600;">${price}</span></div>
                    </a>`;
                    count++;
                }
            });
            if (count === 0) html = '<p style="color:#999; text-align:center;">Nuk u gjet asnjë produkt.</p>';
            resultsBox.innerHTML = html;
        });
    }
}

// ─── COUNTDOWN TIMER ────────────────────────────────────
function initCountdown() {
    const boxes = document.querySelectorAll('.time-box');
    if (boxes.length < 3) return;
    setInterval(() => {
        let s = parseInt(boxes[2].childNodes[0].nodeValue) || 0;
        let m = parseInt(boxes[1].childNodes[0].nodeValue) || 0;
        let h = parseInt(boxes[0].childNodes[0].nodeValue) || 0;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 0; m = 0; s = 0; }
        boxes[0].childNodes[0].nodeValue = h.toString().padStart(2, '0');
        boxes[1].childNodes[0].nodeValue = m.toString().padStart(2, '0');
        boxes[2].childNodes[0].nodeValue = s.toString().padStart(2, '0');
    }, 1000);
}

// ─── INIT ON DOM READY ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    bindCartButtons();
    initSlideshow();
    initDrawer();
    initFilterTray();
    initAccordions();
    initSearch();
    initCountdown();
});
