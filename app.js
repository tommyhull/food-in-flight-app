// ---------- Data ----------
const FIGMA_ASSETS = "https://www.figma.com/api/mcp/asset/962e3bf6-97ec-4dcf-957e-293f6075e953";

const STORES = [
  { id: "lowes", name: "Lowes Foods", img: `${FIGMA_ASSETS}/42204.png` },
  { id: "berts", name: "Bert's Market", img: null },
  { id: "publix", name: "Publix", img: null },
  { id: "harristeeter", name: "Harris Teeter", img: `${FIGMA_ASSETS}/9e3fb.png` },
  { id: "traderjoes", name: "Trader Joe's", img: `${FIGMA_ASSETS}/c468b.png` },
  { id: "foodlion", name: "Food Lion", img: null },
  { id: "cvs", name: "CVS Pharmacy", img: `${FIGMA_ASSETS}/9ebea.png` },
  { id: "walgreens", name: "Walgreens", img: `${FIGMA_ASSETS}/8cfaa.png` },
];

const DEPARTMENTS = [
  "Fruits", "Vegetables", "Deli", "Bakery", "Butcher",
  "Seafood", "Canned Goods", "Chips", "Pasta and Rice", "Personal Care",
];

const PRODUCT_IMG = `${FIGMA_ASSETS}/... `; // placeholder, replaced below
const CARROT_IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e8a35c'/%3E%3C/svg%3E";

function makeProducts(deptName) {
  const items = [];
  for (let i = 1; i <= 10; i++) {
    items.push({
      id: `${deptName}-${i}`,
      name: `${deptName} Item ${i}`,
      price: (Math.random() * 4 + 1.5).toFixed(2),
      img: CARROT_IMG_FALLBACK,
    });
  }
  return items;
}

// ---------- State ----------
const state = {
  screenStack: ["home"],
  selectedStore: null,
  selectedDept: null,
  products: [],
  cart: {}, // id -> {product, qty}
  selectedZone: "Front Porch",
  selectedConfirmMethod: "Photo",
  trackingTimer: null,
};

// ---------- Navigation ----------
function showScreen(name, push = true) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
  if (push) state.screenStack.push(name);
  updateNavActive(name);
  window.scrollTo(0, 0);
}

function goBack() {
  state.screenStack.pop();
  const prev = state.screenStack[state.screenStack.length - 1] || "home";
  showScreen(prev, false);
}

function updateNavActive(name) {
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  const map = { home: "nav-home", cart: "nav-cart" };
  const id = map[name];
  if (id) document.getElementById(id)?.classList.add("active");
}

// ---------- Home / store select ----------
function renderStores() {
  const grid = document.getElementById("store-grid");
  grid.innerHTML = "";
  STORES.forEach(store => {
    const btn = document.createElement("button");
    btn.className = "store-card";
    btn.onclick = () => selectStore(store);
    if (store.img) {
      btn.innerHTML = `<img src="${store.img}" alt="${store.name}">`;
    } else {
      btn.innerHTML = `<div class="fallback-name">${store.name}</div>`;
    }
    grid.appendChild(btn);
  });
}

function selectStore(store) {
  state.selectedStore = store;
  document.getElementById("dept-store-title").textContent = store.name;
  document.getElementById("product-store-title").textContent = store.name;
  renderDepartments();
  showScreen("department");
}

// ---------- Department list ----------
function renderDepartments() {
  const list = document.getElementById("dept-list");
  list.innerHTML = "";
  DEPARTMENTS.forEach(dept => {
    const btn = document.createElement("button");
    btn.className = "dept-pill";
    btn.innerHTML = `<span>${dept}</span>`;
    btn.onclick = () => selectDept(dept);
    list.appendChild(btn);
  });
}

function selectDept(dept) {
  state.selectedDept = dept;
  state.products = makeProducts(dept);
  document.getElementById("product-dept-title").textContent = dept;
  renderProducts();
  showScreen("products");
}

// ---------- Product grid ----------
function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";
  state.products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const inCart = !!state.cart[p.id];
    card.innerHTML = `
      <button class="add-btn ${inCart ? 'added' : ''}" data-id="${p.id}">${inCart ? "✓" : "+"}</button>
      <img src="${p.img}" alt="">
      <div class="product-name">${p.name}</div>
      <div class="product-price">$${p.price}</div>
    `;
    card.querySelector(".add-btn").onclick = (e) => toggleCartItem(p, e.currentTarget);
    grid.appendChild(card);
  });
}

function toggleCartItem(product, btn) {
  if (state.cart[product.id]) {
    delete state.cart[product.id];
    btn.classList.remove("added");
    btn.textContent = "+";
  } else {
    state.cart[product.id] = { product, qty: 1 };
    btn.classList.add("added");
    btn.textContent = "✓";
  }
  updateCartBadge();
}

function updateCartBadge() {
  const count = Object.keys(state.cart).length;
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

// ---------- Cart screen ----------
function renderCart() {
  const list = document.getElementById("cart-list");
  const items = Object.values(state.cart);
  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Go add some groceries!</div>`;
    document.getElementById("cart-summary").style.display = "none";
    document.getElementById("checkout-btn").style.display = "none";
    return;
  }
  document.getElementById("cart-summary").style.display = "block";
  document.getElementById("checkout-btn").style.display = "block";
  list.innerHTML = "";
  let subtotal = 0;
  items.forEach(({ product, qty }) => {
    subtotal += parseFloat(product.price) * qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${product.img}" alt="">
      <div class="info">
        <div class="name">${product.name}</div>
        <div class="qty">Qty: ${qty}</div>
      </div>
      <div class="price">$${(product.price * qty).toFixed(2)}</div>
      <button class="remove" data-id="${product.id}">✕</button>
    `;
    row.querySelector(".remove").onclick = () => { delete state.cart[product.id]; updateCartBadge(); renderCart(); };
    list.appendChild(row);
  });
  const deliveryFee = 2.50;
  document.getElementById("cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("cart-total").textContent = `$${(subtotal + deliveryFee).toFixed(2)}`;
}

function openCart() {
  renderCart();
  showScreen("cart");
}

// ---------- Delivery details ----------
function selectZone(zone, btn) {
  state.selectedZone = zone;
  document.querySelectorAll(".zone-pill").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  document.getElementById("map-pin-label").textContent = `📍 ${zone}`;
}

// ---------- Checkout ----------
function renderCheckout() {
  const items = Object.values(state.cart);
  const subtotal = items.reduce((sum, { product, qty }) => sum + parseFloat(product.price) * qty, 0);
  const total = subtotal + 2.50;
  document.getElementById("checkout-items").textContent = `${items.length} item${items.length !== 1 ? "s" : ""} · ${state.selectedStore?.name || "Store"}`;
  document.getElementById("checkout-address").textContent = `Delivery · ${state.selectedZone}`;
  document.getElementById("checkout-total").textContent = `$${total.toFixed(2)}`;
}

function selectMethod(method, btn) {
  state.selectedConfirmMethod = method;
  document.querySelectorAll(".method-pill").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function goToCheckout() {
  renderCheckout();
  showScreen("checkout");
}

// ---------- Live tracking ----------
const TRACKING_STAGES = [
  { title: "Preparing Order", sub: "Your groceries are being packed for flight.", eta: "Arriving in 18 min", battery: "100%" },
  { title: "In Flight", sub: "Drone is en route to your location.", eta: "Arriving in 10 min", battery: "91%" },
  { title: "In Flight", sub: "Drone is en route to your location.", eta: "Arriving in 4 min", battery: "78%" },
  { title: "Arriving", sub: "Drone is descending to your drop zone.", eta: "Arriving now", battery: "65%" },
];

function startTracking() {
  document.getElementById("order-id").textContent = `Order #FIF-${Math.floor(1000 + Math.random() * 9000)}`;
  document.getElementById("tracking-address").textContent = `${state.selectedStore?.name || "Store"} · ${state.selectedZone}`;
  showScreen("tracking");

  let stage = 0;
  const statusTitle = document.getElementById("status-title");
  const statusSub = document.getElementById("status-sub");
  const statusEta = document.getElementById("status-eta");
  const statusBattery = document.getElementById("status-battery");

  function applyStage() {
    const s = TRACKING_STAGES[stage];
    statusTitle.textContent = s.title;
    statusSub.textContent = s.sub;
    statusEta.textContent = s.eta;
    statusBattery.textContent = s.battery;
  }
  applyStage();

  clearInterval(state.trackingTimer);
  state.trackingTimer = setInterval(() => {
    stage++;
    if (stage >= TRACKING_STAGES.length) {
      clearInterval(state.trackingTimer);
      finishDelivery();
      return;
    }
    applyStage();
  }, 2600);
}

function abortDelivery() {
  clearInterval(state.trackingTimer);
  if (confirm("Abort this delivery and return the drone to base?")) {
    goHome();
  }
}

function finishDelivery() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  document.getElementById("confirmed-time").textContent = `Delivered at ${timeStr}`;
  showScreen("confirmed");
}

function goHome() {
  state.cart = {};
  updateCartBadge();
  state.screenStack = ["home"];
  showScreen("home", false);
}

// ---------- Rating ----------
function setRating(n) {
  document.querySelectorAll(".stars button").forEach((btn, i) => {
    btn.classList.toggle("filled", i < n);
  });
}

// ---------- Side menu ----------
function toggleSideMenu(open) {
  document.getElementById("side-menu").classList.toggle("open", open);
  document.getElementById("side-menu-overlay").classList.toggle("open", open);
}

// ---------- Wire up static buttons ----------
document.addEventListener("DOMContentLoaded", () => {
  renderStores();
  updateCartBadge();

  document.querySelectorAll("[data-back]").forEach(btn => btn.onclick = goBack);
  document.querySelectorAll("[data-open-menu]").forEach(btn => btn.onclick = () => toggleSideMenu(true));
  document.querySelectorAll("[data-close-menu]").forEach(btn => btn.onclick = () => toggleSideMenu(false));
  document.getElementById("side-menu-overlay").onclick = () => toggleSideMenu(false);
  document.querySelectorAll("[data-open-cart]").forEach(btn => btn.onclick = openCart);
  document.querySelectorAll("[data-go-home]").forEach(btn => btn.onclick = goHome);

  document.querySelectorAll(".zone-pill").forEach(btn => {
    btn.onclick = () => selectZone(btn.dataset.zone, btn);
  });
  document.querySelectorAll(".method-pill").forEach(btn => {
    btn.onclick = () => selectMethod(btn.dataset.method, btn);
  });
  document.querySelectorAll(".stars button").forEach((btn, i) => {
    btn.onclick = () => setRating(i + 1);
  });

  document.getElementById("checkout-btn").onclick = goToCheckout;
  document.getElementById("continue-btn").onclick = goToCheckout;
  document.getElementById("place-order-btn").onclick = startTracking;
  document.getElementById("abort-btn").onclick = abortDelivery;
  document.getElementById("done-btn").onclick = goHome;
  document.getElementById("notify-toggle").onclick = (e) => e.currentTarget.classList.toggle("on");

  // Register service worker for installability
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});
