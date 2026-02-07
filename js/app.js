// Product Data
const products = [
    {
        id: 1,
        title: "لَمّة طمأنينة",
        category: "food",
        price: 25,
        description: "سلة غذائية أساسية تحتوي على الاحتياجات الضرورية (أرز، عدس، زيت، سكر) بالإضافة إلى رسالة حب مخصصة لأهلك.",
        image: "assets/img/basket_safe.webp"
    },
    {
        id: 2,
        title: "لَمّة إفطار صائم",
        category: "food",
        price: 35,
        description: "وجبة إفطار حلبية جاهزة للعائلة + تمر + خبز طازج. تصل ساخنة في موعد الإفطار.",
        image: "assets/img/meal_ramadan.webp"
    },
    {
        id: 3,
        title: "لَمّة حنين",
        category: "gifts",
        price: 30,
        description: "باقة ورد طبيعي منسقة بعناية + عطر فاخر + بطاقة رسالة بخط اليد. لمسة دافئة تعبر عن شوقك.",
        image: "assets/img/flower_gift.webp"
    },
    {
        id: 4,
        title: "لَمّة البيت عامر",
        category: "food",
        price: 45,
        description: "سلة غذائية متوسطة تكفي عائلة لمدة أطول، تحتوي على تشكيلة هامة من المواد الأساسية والمعلبات.",
        image: "assets/img/basket_medium.webp"
    },
    {
        id: 5,
        title: "لَمّة راحة بال",
        category: "food",
        price: 60,
        description: "سلة غذائية كبيرة وشاملة + مفاجأة خاصة + توثيق كامل لعملية التسليم بصورة وفيديو.",
        image: "assets/img/basket_large.webp"
    },
    {
        id: 6,
        title: "لَمّة حسب الطلب",
        category: "custom",
        price: "حسب الطلب",
        description: "أنت تحدد المحتوى (أدوية، هدايا خاصة، طلبات معينة) ونحن نقوم بالتنفيذ وتحديد السعر بعد المراجعة.",
        image: "assets/img/custom_gift.webp"
    }
];

// Cart State
let cart = JSON.parse(localStorage.getItem('lamma_cart')) || [];
let currentProduct = null;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const modal = document.getElementById('product-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const addToCartBtn = document.getElementById('add-to-cart-btn');

// Initialize Store
function initStore() {
    renderProducts(products);
    setupFilters();
    updateCartUI();
    checkAuth();

    addToCartBtn.onclick = () => {
        if (currentProduct) {
            addToCart(currentProduct);
            closeModal();
            toggleCart(true);
        }
    };
}

// Render Products
function renderProducts(items) {
    productGrid.innerHTML = '';
    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card animate-fade-in';
        card.onclick = () => openModal(product);

        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${product.title}</h3>
                <div class="flex justify-between items-center">
                    <span class="text-orange-500 font-bold">${product.price}${typeof product.price === 'number' ? '$' : ''}</span>
                    <span class="text-sm text-gray-500">${getCategoryLabel(product.category)}</span>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

function getCategoryLabel(cat) {
    const labels = {
        food: 'سلة غذائية',
        gifts: 'هدايا',
        custom: 'باقة خاصة'
    };
    return labels[cat] || cat;
}

// Filters
function setupFilters() {
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            const filtered = category === 'all' ? products : products.filter(p => p.category === category);
            renderProducts(filtered);
        };
    });
}

// Modal Logic
function openModal(product) {
    currentProduct = product;
    modalTitle.textContent = product.title;
    modalPrice.textContent = `${product.price}${typeof product.price === 'number' ? '$' : ''}`;
    modalDesc.textContent = product.description;
    modalImg.src = product.image;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentProduct = null;
}

// Cart Logic
function toggleCart(forceOpen = false) {
    if (forceOpen) {
        cartSidebar.style.transform = 'translateX(0)';
    } else {
        const isClosed = cartSidebar.style.transform === 'translateX(-100%)' || cartSidebar.style.transform === '';
        cartSidebar.style.transform = isClosed ? 'translateX(0)' : 'translateX(-100%)';
    }
}

function addToCart(product) {
    const message = document.getElementById('order-message').value;
    const item = {
        ...product,
        orderMessage: message,
        cartId: Date.now()
    };
    cart.push(item);
    saveCart();
    updateCartUI();
    document.getElementById('order-message').value = ''; // Reset
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('lamma_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update count
    cartCount.textContent = cart.length;

    // Update items list
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-black/50 p-4 rounded-xl border border-white/5 flex gap-4 items-center';
        div.innerHTML = `
            <img src="${item.image}" class="w-16 h-16 rounded-lg object-cover">
            <div class="flex-grow">
                <div class="font-bold text-sm">${item.title}</div>
                <div class="text-orange-500 text-sm">${item.price}${typeof item.price === 'number' ? '$' : ''}</div>
                ${item.orderMessage ? `<div class="text-[10px] text-gray-500 mt-1">💌 ${item.orderMessage}</div>` : ''}
            </div>
            <button onclick="removeFromCart(${item.cartId})" class="text-gray-500 hover:text-red-500">&times;</button>
        `;
        cartItemsContainer.appendChild(div);

        if (typeof item.price === 'number') {
            total += item.price;
        }
    });

    cartTotal.textContent = `${total}$`;
}

function checkAuth() {
    const authLink = document.getElementById('auth-link');
    if (localStorage.getItem('isLoggedIn') === 'true') {
        authLink.textContent = 'حسابي';
        authLink.href = '#'; // Could link to a profile or orders page
        authLink.onclick = (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                localStorage.removeItem('isLoggedIn');
                location.reload();
            }
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStore);
