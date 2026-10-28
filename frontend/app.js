

/* ==========================================
   ShopEasy - Main JavaScript
   File: frontend/app.js
   ========================================== */

"use strict";

const API_URL = "http://localhost:3000/api";

const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "Wireless Headphones",
        description: "Enjoy clear sound and comfortable listening.",
        category: "Electronics",
        price: 1499,
        stock: 15,
        image: "https://placehold.co/400x300?text=Headphones"
    },
    {
        id: 2,
        name: "Smart Watch",
        description: "Track your daily activities and stay connected.",
        category: "Electronics",
        price: 2499,
        stock: 10,
        image: "https://placehold.co/400x300?text=Smart+Watch"
    },
    {
        id: 3,
        name: "Backpack",
        description: "A practical backpack for college and travel.",
        category: "Fashion",
        price: 899,
        stock: 20,
        image: "https://placehold.co/400x300?text=Backpack"
    },
    {
        id: 4,
        name: "Running Shoes",
        description: "Comfortable shoes for everyday activities.",
        category: "Fashion",
        price: 1799,
        stock: 12,
        image: "https://placehold.co/400x300?text=Shoes"
    },
    {
        id: 5,
        name: "Study Lamp",
        description: "A useful desk lamp for your study space.",
        category: "Home",
        price: 699,
        stock: 18,
        image: "https://placehold.co/400x300?text=Study+Lamp"
    },
    {
        id: 6,
        name: "Water Bottle",
        description: "A reusable bottle for everyday use.",
        category: "Home",
        price: 299,
        stock: 25,
        image: "https://placehold.co/400x300?text=Water+Bottle"
    }
];

const STORAGE_KEYS = {
    products: "shopeasy_products",
    cart: "shopeasy_cart",
    orders: "shopeasy_demo_orders"
};

// ---------- General helpers ----------

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Could not read saved data:", error);
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getProducts() {
    return readStorage(
        STORAGE_KEYS.products,
        DEFAULT_PRODUCTS
    );
}

function getCart() {
    return readStorage(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
    saveStorage(STORAGE_KEYS.cart, cart);
    updateCartCount();
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
    element.hidden = false;
}

function updateCartCount() {
    const count = getCart().reduce(
        (total, item) => total + item.quantity,
        0
    );

    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = count;
    });
}

function getCartTotals() {
    const products = getProducts();
    const cart = getCart();

    const subtotal = cart.reduce((total, item) => {
        const product = products.find(
            product => product.id === item.id
        );

        return total + (product ? product.price * item.quantity : 0);
    }, 0);

    const delivery = subtotal === 0 || subtotal >= 1000 ? 0 : 50;

    return {
        subtotal,
        delivery,
        total: subtotal + delivery
    };
}

// ---------- Product display ----------

function productCard(product) {
    const stock = Number(product.stock) || 0;

    return `
        <article class="product-card">
            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                class="product-image"
                loading="lazy"
            >

            <div class="product-info">
                <span class="product-category">
                    ${escapeHTML(product.category)}
                </span>

                <h3>${escapeHTML(product.name)}</h3>

                <p>${escapeHTML(product.description)}</p>

                <p class="product-price">
                    ${money(product.price)}
                </p>

                <p>${stock > 0 ? `${stock} available` : "Out of stock"}</p>

                <button
                    type="button"
                    class="btn btn-primary add-to-cart"
                    data-id="${Number(product.id)}"
                    ${stock <= 0 ? "disabled" : ""}
                >
                    ${stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
            </div>
        </article>
    `;
}

function displayProducts(products, container) {
    if (!container) return;

    container.innerHTML = products.map(productCard).join("");

    container.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", () => {
            addToCart(Number(button.dataset.id));
        });
    });
}

function initialiseHomePage() {
    const container = document.querySelector("#featured-products");
    if (!container) return;

    displayProducts(getProducts().slice(0, 4), container);
}

function initialiseProductsPage() {
    const container = document.querySelector("#products-container");
    if (!container) return;

    const searchInput = document.querySelector("#search-input");
    const categoryFilter = document.querySelector("#category-filter");
    const sortFilter = document.querySelector("#sort-filter");
    const countElement = document.querySelector("#product-count");
    const emptyMessage = document.querySelector("#empty-message");
    const clearButton = document.querySelector("#clear-filters");

    function render() {
        const search = (searchInput?.value || "").toLowerCase().trim();
        const category = categoryFilter?.value || "";
        const sort = sortFilter?.value || "";

        let products = getProducts().filter(product => {
            const matchesSearch =
                product.name.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search);

            const matchesCategory =
                !category || product.category === category;

            return matchesSearch && matchesCategory;
        });

        if (sort === "price-low") {
            products.sort((a, b) => a.price - b.price);
        } else if (sort === "price-high") {
            products.sort((a, b) => b.price - a.price);
        } else if (sort === "name") {
            products.sort((a, b) => a.name.localeCompare(b.name));
        }

        displayProducts(products, container);

        if (countElement) {
            countElement.textContent = `${products.length} products found`;
        }

        if (emptyMessage) {
            emptyMessage.hidden = products.length > 0;
        }
    }

    [searchInput, categoryFilter, sortFilter].forEach(element => {
        element?.addEventListener("input", render);
        element?.addEventListener("change", render);
    });

    clearButton?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (sortFilter) sortFilter.value = "";
        render();
    });

    render();
}

// ---------- Shopping cart ----------

function addToCart(productId) {
    const product = getProducts().find(
        item => item.id === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }

    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert("Sorry, there is not enough stock.");
            return;
        }

        existingItem.quantity += 1;
    } else {
        if (product.stock <= 0) {
            alert("This product is out of stock.");
            return;
        }

        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart(cart);
    alert(`${product.name} added to cart!`);
}

function changeQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    const product = getProducts().find(
        product => product.id === productId
    );

    if (!item || !product) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        saveCart(cart.filter(item => item.id !== productId));
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        saveCart(cart);
    } else {
        alert("You cannot add more than the available stock.");
    }

    initialiseCartPage();
}

function removeFromCart(productId) {
    saveCart(getCart().filter(item => item.id !== productId));
    initialiseCartPage();
}

function initialiseCartPage() {
    const container = document.querySelector("#cart-items");
    if (!container) return;

    const emptyMessage = document.querySelector("#empty-cart");
    const checkoutButton = document.querySelector("#checkout-button");
    const cart = getCart();
    const products = getProducts();

    const validItems = cart.filter(item =>
        products.some(product => product.id === item.id)
    );

    if (validItems.length !== cart.length) {
        saveCart(validItems);
    }

    const currentCart = getCart();

    container.innerHTML = currentCart.map(item => {
        const product = products.find(
            product => product.id === item.id
        );

        if (!product) return "";

        return `
            <article class="cart-item">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="cart-item-image"
                >

                <div class="cart-item-info">
                    <h3>${escapeHTML(product.name)}</h3>
                    <p>${money(product.price)} each</p>

                    <div class="quantity-controls">
                        <button type="button"
                            data-action="decrease"
                            data-id="${product.id}">−</button>

                        <span>${item.quantity}</span>

                        <button type="button"
                            data-action="increase"
                            data-id="${product.id}">+</button>
                    </div>

                    <button type="button"
                        class="remove-item"
                        data-action="remove"
                        data-id="${product.id}">
                        Remove
                    </button>
                </div>

                <strong>${money(product.price * item.quantity)}</strong>
            </article>
        `;
    }).join("");

    container.querySelectorAll("[data-action]").forEach(button => {
        const id = Number(button.dataset.id);

        button.addEventListener("click", () => {
            const action = button.dataset.action;

            if (action === "increase") changeQuantity(id, 1);
            if (action === "decrease") changeQuantity(id, -1);
            if (action === "remove") removeFromCart(id);
        });
    });

    const totals = getCartTotals();

    const itemsElement = document.querySelector("#summary-items");
    const subtotalElement = document.querySelector("#cart-subtotal");
    const deliveryElement = document.querySelector("#delivery-charge");
    const totalElement = document.querySelector("#cart-total");

    if (itemsElement) {
        itemsElement.textContent = currentCart.reduce(
            (sum, item) => sum + item.quantity, 0
        );
    }

    if (subtotalElement) subtotalElement.textContent = money(totals.subtotal);
    if (deliveryElement) deliveryElement.textContent = money(totals.delivery);
    if (totalElement) totalElement.textContent = money(totals.total);

    if (emptyMessage) emptyMessage.hidden = currentCart.length > 0;
    if (checkoutButton) checkoutButton.disabled = currentCart.length === 0;
}

// ---------- Checkout demo ----------

function initialiseCheckoutPage() {
    const form = document.querySelector("#checkout-form");
    if (!form) return;

    const message = document.querySelector("#checkout-message");
    const button = document.querySelector("#place-order-button");

    function renderTotals() {
        const totals = getCartTotals();

        const itemsElement = document.querySelector("#checkout-items");
        const deliveryElement = document.querySelector("#checkout-delivery");
        const totalElement = document.querySelector("#checkout-total");

        if (itemsElement) itemsElement.textContent = money(totals.subtotal);
        if (deliveryElement) deliveryElement.textContent = money(totals.delivery);
        if (totalElement) totalElement.textContent = money(totals.total);
    }

    renderTotals();

    form.addEventListener("submit", event => {
        event.preventDefault();

        const cart = getCart();

        if (cart.length === 0) {
            showMessage(message, "Your cart is empty.");
            return;
        }

        const products = getProducts();

        // Demo validation only. A real server must validate prices and stock.
        for (const item of cart) {
            const product = products.find(
                product => product.id === item.id
            );

            if (!product || item.quantity > product.stock) {
                showMessage(
                    message,
                    "A product is unavailable or has insufficient stock. Please update your cart."
                );
                return;
            }
        }

        const formData = new FormData(form);
        const totals = getCartTotals();

        const order = {
            id: `DEMO-${Date.now()}`,
            date: new Date().toISOString(),
            customer: {
                name: formData.get("full-name") ||
                    document.querySelector("#full-name")?.value || "",
                email: formData.get("email") ||
                    document.querySelector("#email")?.value || "",
                phone: document.querySelector("#phone")?.value || "",
                address: document.querySelector("#address")?.value || "",
                city: document.querySelector("#city")?.value || "",
                pincode: document.querySelector("#pincode")?.value || ""
            },
            items: cart.map(item => {
                const product = products.find(
                    product => product.id === item.id
                );

                return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity
                };
            }),
            total: totals.total,
            paymentMethod:
                document.querySelector("#payment-method")?.value ||
                "Cash on Delivery",
            status: "Pending"
        };

        const orders = readStorage(STORAGE_KEYS.orders, []);
        orders.push(order);
        saveStorage(STORAGE_KEYS.orders, orders);
        saveCart([]);

        showMessage(
            message,
            `Demo order placed successfully! Order ID: ${order.id}. This order is saved only in this browser.`,
            "success"
        );

        form.reset();
        renderTotals();

        if (button) button.disabled = true;
    });
}

// ---------- Login and registration ----------

async function postToAPI(path, data) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

function initialiseLoginPage() {
    const form = document.querySelector("#login-form");
    if (!form) return;

    const message = document.querySelector("#login-message");
    const button = document.querySelector("#login-button");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.querySelector("#email")?.value.trim();
        const password = document.querySelector("#password")?.value;

        if (!email || !password) {
            showMessage(message, "Please enter your email and password.");
            return;
        }

        if (button) button.disabled = true;

        try {
            await postToAPI("/auth/login", { email, password });

            showMessage(message, "Login successful!", "success");
            window.location.href = "index.html";
        } catch (error) {
            showMessage(
                message,
                `${error.message} Make sure your backend server is running.`
            );
        } finally {
            if (button) button.disabled = false;
        }
    });
}

function initialiseRegisterPage() {
    const form = document.querySelector("#register-form");
    if (!form) return;

    const message = document.querySelector("#register-message");
    const button = document.querySelector("#register-button");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.querySelector("#name")?.value.trim();
        const email = document.querySelector("#email")?.value.trim();
        const password = document.querySelector("#password")?.value;
        const confirmPassword =
            document.querySelector("#confirm-password")?.value;

        if (!name || !email || !password || !confirmPassword) {
            showMessage(message, "Please fill in all fields.");
            return;
        }

        if (password.length < 8) {
            showMessage(message, "Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(message, "Passwords do not match.");
            return;
        }

        if (button) button.disabled = true;

        try {
            await postToAPI("/auth/register", {
                name,
                email,
                password
            });

            showMessage(
                message,
                "Registration successful! You can now log in.",
                "success"
            );

            form.reset();
        } catch (error) {
            showMessage(
                message,
                `${error.message} Make sure your backend server is running.`
            );
        } finally {
            if (button) button.disabled = false;
        }
    });
}

// ---------- Demo order history ----------

function initialiseOrdersPage() {
    const list = document.querySelector("#orders-list");
    if (!list) return;

    const loading = document.querySelector("#orders-loading");
    const empty = document.querySelector("#orders-empty");
    const message = document.querySelector("#orders-message");
    const retry = document.querySelector("#retry-orders-button");

    function render() {
        const orders = readStorage(STORAGE_KEYS.orders, []);

        if (loading) loading.hidden = true;
        if (message) message.hidden = true;
        if (empty) empty.hidden = orders.length > 0;

        list.innerHTML = orders.slice().reverse().map(order => `
            <article class="order-card">
                <h3>Order ${escapeHTML(order.id)}</h3>
                <p>Date: ${escapeHTML(new Date(order.date).toLocaleString())}</p>
                <p>Status: ${escapeHTML(order.status)}</p>
                <p>Total: ${money(order.total)}</p>
                <ul>
                    ${order.items.map(item => `
                        <li>
                            ${escapeHTML(item.name)} × ${Number(item.quantity)}
                            — ${money(item.price * item.quantity)}
                        </li>
                    `).join("")}
                </ul>
            </article>
        `).join("");
    }

    retry?.addEventListener("click", render);
    render();
}

// ---------- Demo admin dashboard ----------

function initialiseAdminPage() {
    const productList = document.querySelector("#admin-products-list");
    if (!productList) return;

    const form = document.querySelector("#product-form");
    const formTitle = document.querySelector("#product-form-title");
    const idInput = document.querySelector("#product-id");
    const message = document.querySelector("#admin-message");

    function render() {
        const products = getProducts();
        const orders = readStorage(STORAGE_KEYS.orders, []);

        const totalProducts = document.querySelector("#total-products");
        const totalOrders = document.querySelector("#total-orders");
        const pendingOrders = document.querySelector("#pending-orders");
        const totalSales = document.querySelector("#total-sales");

        if (totalProducts) totalProducts.textContent = products.length;
        if (totalOrders) totalOrders.textContent = orders.length;
        if (pendingOrders) {
            pendingOrders.textContent = orders.filter(
                order => order.status === "Pending"
            ).length;
        }
        if (totalSales) {
            totalSales.textContent = money(
                orders.reduce((sum, order) => sum + order.total, 0)
            );
        }

        productList.innerHTML = products.map(product => `
            <div class="admin-product-row">
                <span>${escapeHTML(product.name)}</span>
                <span>${money(product.price)}</span>
                <span>Stock: ${Number(product.stock)}</span>
                <button type="button" data-edit="${Number(product.id)}">
                    Edit
                </button>
                <button type="button" data-delete="${Number(product.id)}">
                    Delete
                </button>
            </div>
        `).join("");

        productList.querySelectorAll("[data-edit]").forEach(button => {
            button.addEventListener("click", () => {
                const product = getProducts().find(
                    item => item.id === Number(button.dataset.edit)
                );

                if (!product) return;

                idInput.value = product.id;
                document.querySelector("#product-name").value = product.name;
                document.querySelector("#product-description").value =
                    product.description;
                document.querySelector("#product-category").value =
                    product.category;
                document.querySelector("#product-price").value = product.price;
                document.querySelector("#product-stock").value = product.stock;
                document.querySelector("#product-image").value = product.image;

                if (formTitle) formTitle.textContent = "Edit Product";
                form.hidden = false;
            });
        });

        productList.querySelectorAll("[data-delete]").forEach(button => {
            button.addEventListener("click", () => {
                const id = Number(button.dataset.delete);
                const updated = getProducts().filter(
                    product => product.id !== id
                );

                saveStorage(STORAGE_KEYS.products, updated);
                showMessage(message, "Product deleted from this browser.", "success");
                render();
            });
        });

        const ordersList = document.querySelector("#admin-orders-list");

        if (ordersList) {
            ordersList.innerHTML = orders.slice().reverse().map(order => `
                <article class="order-card">
                    <p>Order: ${escapeHTML(order.id)}</p>
                    <p>Customer: ${escapeHTML(order.customer.name)}</p>
                    <p>Total: ${money(order.total)}</p>
                    <p>Status: ${escapeHTML(order.status)}</p>
                </article>
            `).join("");
        }
    }

    document.querySelector("#show-product-form")?.addEventListener("click", () => {
        form.reset();
        idInput.value = "";
        if (formTitle) formTitle.textContent = "Add Product";
        form.hidden = false;
    });

    document.querySelector("#cancel-product-button")?.addEventListener("click", () => {
        form.reset();
        form.hidden = true;
    });

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.querySelector("#product-name").value.trim();
        const description =
            document.querySelector("#product-description").value.trim();
        const category = document.querySelector("#product-category").value;
        const price = Number(document.querySelector("#product-price").value);
        const stock = Number(document.querySelector("#product-stock").value);
        const image = document.querySelector("#product-image").value.trim();
        const id = idInput.value ? Number(idInput.value) : null;

        if (!name || !category || price < 0 || stock < 0) {
            showMessage(message, "Please enter valid product details.");
            return;
        }

        const products = getProducts();

        if (id !== null) {
            const index = products.findIndex(product => product.id === id);

            if (index !== -1) {
                products[index] = {
                    ...products[index],
                    name,
                    description,
                    category,
                    price,
                    stock,
                    image: image || "https://placehold.co/400x300?text=Product"
                };
            }
        } else {
            products.push({
                id: Date.now(),
                name,
                description,
                category,
                price,
                stock,
                image: image || "https://placehold.co/400x300?text=Product"
            });
        }

        saveStorage(STORAGE_KEYS.products, products);
        form.reset();
        form.hidden = true;

        showMessage(message, "Product saved in this browser.", "success");
        render();
    });

    document.querySelector("#refresh-admin-button")?.addEventListener(
        "click",
        render
    );

    render();
}

// ---------- Start the correct page ----------

document.addEventListener("DOMContentLoaded", () => {
    // Initialise demo products on first use.
    if (localStorage.getItem(STORAGE_KEYS.products) === null) {
        saveStorage(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
    }

    updateCartCount();
    initialiseHomePage();
    initialiseProductsPage();
    initialiseCartPage();
    initialiseCheckoutPage();
    initialiseLoginPage();
    initialiseRegisterPage();
    initialiseOrdersPage();
    initialiseAdminPage();
});

