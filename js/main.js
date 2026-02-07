// Main App Logic (Global Scope)

// =========================================
// Data & Configuration Engine
// =========================================
const DEFAULT_PACKAGES = [
    { id: 1, title: "لَمّة طمأنينة", desc: "سلة غذائية أساسية مع رسالة حب مخصصة", price: 25, image: "assets/img/basket_safe.webp", category: "food" },
    { id: 2, title: "لَمّة إفطار صائم", desc: "وجبة إفطار جاهزة + تمر + خبز طازج", price: 35, image: "assets/img/meal_ramadan.webp", category: "food" },
    { id: 3, title: "لَمّة حنين", desc: "باقة ورد طبيعي + عطر فاخر + بطاقة رسالة", price: 30, image: "assets/img/flower_gift.webp", category: "gifts" },
    { id: 4, title: "لَمّة البيت عامر", desc: "سلة غذائية متوسطة تكفي عائلة", price: 45, image: "assets/img/basket_medium.webp", category: "food" },
    { id: 5, title: "لَمّة راحة بال", desc: "سلة كبيرة + مفاجأة + توثيق التسليم", price: 60, image: "assets/img/basket_large.webp", category: "food" },
    { id: 6, title: "لَمّة حسب الطلب", desc: "محتوى يحدده العميل بالكامل", price: "حسب الطلب", image: "assets/img/custom_gift.webp", category: "custom" }
];

const DEFAULT_SETTINGS = {
    heroTitle: "بعيد عنهم؟<br><span>خلّي هديتك توصلهم</span>",
    heroDesc: "نوصّل محبتك لأهلك في حلب بسلال غذائية، وجبات، وهدايا مميزة.<br>مع توثيق لحظة الاستلام ودعم مباشر.",
    whatsapp: "963953644710",
    primaryColor: "#f97316",
    paymentMethods: {
        mtn: { name: "MTN Cash", account: "963944751485", icon: "M", color: "#eab308" },
        syriatel: { name: "Syriatel Cash", account: "093XXXXXXX", icon: "S", color: "#ef4444" },
        usdt: { name: "USDT (TRC20)", account: "TXXXXXXXXXXXXX", icon: "U", color: "#10b981" }
    }
};

const CATEGORIES = [
    { id: 'food', title: "السلل الغذائية والوجبات", icon: "🍱", image: "assets/img/basket_medium.webp", desc: "سلال غذائية ووجبات إفطار صائم" },
    { id: 'gifts', title: "الورود والعطور", icon: "💐", image: "assets/img/flower_gift.webp", desc: "باقات ورد وهدايا مميزة" },
    { id: 'custom', title: "الطلبات الخاصة", icon: "✨", image: "assets/img/custom_gift.webp", desc: "أي شيء تحتاجه من حلب" }
];

// Global State
let packages = DEFAULT_PACKAGES;
let settings = DEFAULT_SETTINGS;
let cart = JSON.parse(localStorage.getItem('lamma_cart')) || [];
let currentPackage = null;

// =========================================
// DOM Elements
// =========================================
// DOM Elements
// =========================================
const packagesWrapper = document.getElementById('packages-wrapper');
const categoriesView = document.getElementById('categories-view');
const packagesView = document.getElementById('packages-view');
const backToCategoriesBtn = document.getElementById('back-to-categories');
const sectionTitle = document.querySelector('.section-title');
const sectionDesc = document.querySelector('.section-desc');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const modal = document.getElementById('product-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const addToCartBtn = document.getElementById('add-to-cart-btn');

// =========================================
// Initialize
// =========================================
async function init() {
    // Track Visitor
    db.trackVisit();

    // Fetch from DB if available, else use defaults
    packages = await db.getPackages();
    const dbSettings = await db.getSettings();
    settings = { ...DEFAULT_SETTINGS, ...dbSettings };

    applySettings();
    renderCategories();
    // renderPackages(packages); // Now called on click
    // setupFilters(); // Disabled as we use sections now
    updateCartUI();
    bindEvents();
}

function applySettings() {
    const s = settings;

    // Text Content
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-desc');
    if (heroTitle) heroTitle.innerHTML = s.heroTitle;
    if (heroDesc) heroDesc.innerHTML = s.heroDesc;

    // Links
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    waLinks.forEach(link => {
        link.href = `https://wa.me/${s.whatsapp}`;
    });

    // Theme Color
    document.documentElement.style.setProperty('--orange-500', s.primaryColor);
    document.documentElement.style.setProperty('--orange-600', s.primaryColor + 'cc'); // Approximate darker
}

// =========================================
// Render Packages
// =========================================
// =========================================
// Render Packages
// =========================================
// =========================================
// Category & Packages Logic
// =========================================

function renderCategories() {
    categoriesView.innerHTML = CATEGORIES.map(cat => `
        <article class="package-card category-card" data-category="${cat.id}">
            <div class="category-img-wrapper" style="height: 200px; overflow: hidden;">
                <img src="${cat.image}" alt="${cat.title}" class="package-img" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="package-body" style="text-align: center;">
                <div class="category-icon" style="font-size: 3rem; margin-bottom: 1rem;">${cat.icon}</div>
                <h3 class="package-title">${cat.title}</h3>
                <p class="package-desc">${cat.desc}</p>
                <button class="btn btn-primary btn-sm btn-block" style="margin-top: 1rem;">تصفح الباقات</button>
            </div>
        </article>
    `).join('');

    // Bind click events
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.dataset.category;
            openCategory(categoryId);
        });
    });
}

function openCategory(categoryId) {
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    // Filter packages
    const categoryPackages = packages.filter(p => p.category === categoryId);

    // Update UI
    categoriesView.style.display = 'none';
    packagesView.style.display = 'block';

    // Update Header
    sectionTitle.textContent = category.title;
    sectionDesc.textContent = category.desc;

    // Render Packages Grid
    packagesWrapper.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'packages-grid';
    grid.innerHTML = categoryPackages.map(pkg => `
        <article class="package-card" data-id="${pkg.id}">
            <img src="${pkg.image}" alt="${pkg.title}" class="package-img">
            <div class="package-body">
                <h3 class="package-title">${pkg.title}</h3>
                <p class="package-desc">${pkg.desc}</p>
                <div class="package-price">${typeof pkg.price === 'number' ? pkg.price + '$' : pkg.price}</div>
            </div>
        </article>
    `).join('');
    packagesWrapper.appendChild(grid);

    // Re-bind package click events
    document.querySelectorAll('.package-card[data-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            openModal(packages.find(p => p.id === id));
        });
    });

    // Scroll to top of section
    document.getElementById('packages').scrollIntoView({ behavior: 'smooth' });
}

function showCategories() {
    categoriesView.style.display = 'grid';
    packagesView.style.display = 'none';

    // Reset Header
    sectionTitle.textContent = 'باقاتنا';
    sectionDesc.textContent = 'اختر القسم المناسب لأحبابك';
}

function renderPackages(data) {
    // Legacy support
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic
            const category = btn.dataset.category;
            const filtered = category === 'all'
                ? packages
                : packages.filter(p => p.category === category);

            renderPackages(filtered);
        });
    });
}

// =========================================
// Modal
// =========================================
function openModal(pkg) {
    currentPackage = pkg;
    modalImg.src = pkg.image;
    modalTitle.textContent = pkg.title;
    modalPrice.textContent = typeof pkg.price === 'number' ? pkg.price + '$' : pkg.price;
    modalDesc.textContent = pkg.desc;

    // Reset fields
    document.getElementById('order-message').value = '';
    document.getElementById('custom-request').value = '';
    document.getElementById('custom-price').value = '';

    // Toggle custom fields
    const isCustom = pkg.category === 'custom';
    document.getElementById('custom-request-group').style.display = isCustom ? 'block' : 'none';
    document.getElementById('custom-price-group').style.display = isCustom ? 'block' : 'none';

    modal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentPackage = null;
}

// =========================================
// Cart
// =========================================
function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(pkg) {
    const message = document.getElementById('order-message').value;
    const isCustom = pkg.category === 'custom';
    const customRequest = isCustom ? document.getElementById('custom-request').value : null;
    const customPrice = isCustom ? parseFloat(document.getElementById('custom-price').value) : null;

    if (isCustom && (!customRequest || isNaN(customPrice))) {
        alert('يرجى إدخال تفاصيل الطلب والمبلغ');
        return false;
    }

    cart.push({
        ...pkg,
        title: isCustom ? 'طلب خاص: ' + pkg.title : pkg.title,
        price: isCustom ? customPrice : pkg.price,
        orderMessage: message,
        customDetails: customRequest,
        cartId: Date.now()
    });
    saveCart();
    updateCartUI();
    return true;
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    updateCartUI();
}
window.removeFromCart = removeFromCart;

function saveCart() {
    localStorage.setItem('lamma_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update count
    cartCount.textContent = cart.length;

    // Update items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center;color:#737373;padding:2rem;">السلة فارغة</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${typeof item.price === 'number' ? item.price + '$' : item.price}</div>
                    ${item.customDetails ? `<div class="text-[10px] text-gray-500 mt-1">📝 ${item.customDetails}</div>` : ''}
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.cartId})">&times;</button>
            </div>
        `).join('');
    }

    // Update total
    const total = cart.reduce((sum, item) => {
        return sum + (typeof item.price === 'number' ? item.price : 0);
    }, 0);
    cartTotal.textContent = total + '$';
}

// =========================================
// Event Bindings
// =========================================
function bindEvents() {
    // Cart
    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Category Navigation
    backToCategoriesBtn.addEventListener('click', showCategories);

    // Modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    addToCartBtn.addEventListener('click', () => {
        if (currentPackage) {
            if (addToCart(currentPackage)) {
                closeModal();
                openCart();
            }
        }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeModal();
        }
    });
}

// =========================================
// Start
// =========================================
document.addEventListener('DOMContentLoaded', init);
