// ---------- Data ----------
const STORES = [
  { id: "lowes", name: "Lowes Foods", img: "assets/Lowesfoods.png" },
  { id: "berts", name: "Bert's Market", img: "assets/logo.png" },
  { id: "publix", name: "Publix", img: "assets/Publix-Logo.wine.png" },
  { id: "harristeeter", name: "Harris Teeter", img: "assets/PJNOAWQ46VBUPHTVQI3KIURUFU.png" },
  { id: "traderjoes", name: "Trader Joe's", img: "assets/Trader-Joes-Symbol.png" },
  { id: "foodlion", name: "Food Lion", img: "assets/Food_Lion_logo.png" },
  { id: "cvs", name: "CVS Pharmacy", img: "assets/CVS-Pharmacy-Logo.png" },
  { id: "walgreens", name: "Walgreens", img: "assets/1485908_WAG_Signature_logo_RGB_750x208.png" },
];

const DEPARTMENTS = [
  "Fruits", "Vegetables", "Deli", "Bakery", "Butcher",
  "Seafood", "Canned Goods", "Chips", "Pasta and Rice", "Personal Care",
];

const CARROT_IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e8a35c'/%3E%3C/svg%3E";

const SAVED_LISTS = [
  { id: "weekly", name: "Weekly Essentials", items: ["Milk", "Eggs", "Bread", "Bananas", "Coffee"] },
  { id: "party", name: "Party Supplies", items: ["Chips", "Soda", "Ice", "Paper Plates"] },
  { id: "quick", name: "Quick Reorder", items: ["Yesterday's Order (3 items)"] },
];

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
  cart: {},
  favStores: new Set(),
  favProducts: {}, // id -> product
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
  document.querySelectorAll(".site-nav button").forEach(b => b.classList.remove("active"));
  const map = { home: "nav-home", lists: "nav-lists", favorites: "nav-favorites" };
  const id = map[name];
  if (id) document.getElementById(id)?.classList.add("active");
}

// ---------- Home / store select ----------
function renderStores() {
  const grid = document.getElementById("store-grid");
  grid.innerHTML = "";
  STORES.forEach(store => grid.appendChild(buildStoreCard(store)));
}

function buildStoreCard(store) {
  const card = document.createElement("div");
  card.className = "store-card";
  const isFav = state.favStores.has(store.id);
  card.innerHTML = `
    <button class="fav-toggle ${isFav ? 'favorited' : ''}" data-store-id="${store.id}">${isFav ? "♥" : "♡"}</button>
    ${store.img ? `<img src="${store.img}" alt="${store.name}">` : `<div class="fallback-name">${store.name}</div>`}
  `;
  card.querySelector("img, .fallback-name")?.addEventListener("click", () => selectStore(store));
  card.querySelector(".fav-toggle").onclick = (e) => { e.stopPropagation(); toggleFavStore(store); };
  return card;
}

function toggleFavStore(store) {
  if (state.favStores.has(store.id)) state.favStores.delete(store.id);
  else state.favStores.add(store.id);
  renderStores();
  if (document.getElementById("screen-favorites").classList.contains("active")) renderFavorites();
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
  state.products.forEach(p => grid.appendChild(buildProductCard(p)));
}

function buildProductCard(p) {
  const card = document.createElement("div");
  card.className = "product-card";
  const inCart = !!state.cart[p.id];
  const isFav = !!state.favProducts[p.id];
  card.innerHTML = `
    <button class="fav-toggle-product ${isFav ? 'favorited' : ''}" data-id="${p.id}">${isFav ? "♥" : "♡"}</button>
    <button class="add-btn ${inCart ? 'added' : ''}" data-id="${p.id}">${inCart ? "✓" : "+"}</button>
    <img src="${p.img}" alt="">
    <div class="product-name">${p.name}</div>
    <div class="product-price">$${p.price}</div>
  `;
  card.querySelector(".add-btn").onclick = (e) => toggleCartItem(p, e.currentTarget);
  card.querySelector(".fav-toggle-product").onclick = () => toggleFavProduct(p);
  return card;
}

function toggleFavProduct(p) {
  if (state.favProducts[p.id]) delete state.favProducts[p.id];
  else state.favProducts[p.id] = p;
  renderProducts();
  if (document.getElementById("screen-favorites").classList.contains("active")) renderFavorites();
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
    el.style.display = count > 0 ? "flex" : "none";
  });
}

// ---------- Cart screen ----------
function renderCart() {
  const list = document.getElementById("cart-list");
  const items = Object.values(state.cart);
  const summary = document.getElementById("cart-summary");
  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Go add some groceries!</div>`;
    summary.style.display = "none";
    return;
  }
  summary.style.display = "block";
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

// ---------- Favorites screen ----------
function renderFavorites() {
  const storeWrap = document.getElementById("favorites-stores");
  const favStoreList = STORES.filter(s => state.favStores.has(s.id));
  if (favStoreList.length === 0) {
    storeWrap.innerHTML = `<div class="empty-state">No favorite stores yet — tap the heart on any store to save it here.</div>`;
  } else {
    storeWrap.innerHTML = "";
    favStoreList.forEach(s => storeWrap.appendChild(buildStoreCard(s)));
  }

  const productWrap = document.getElementById("favorites-products");
  const favProductList = Object.values(state.favProducts);
  if (favProductList.length === 0) {
    productWrap.innerHTML = `<div class="empty-state">No favorite products yet — tap the heart on any item to save it here.</div>`;
  } else {
    productWrap.innerHTML = "";
    favProductList.forEach(p => productWrap.appendChild(buildProductCard(p)));
  }
}

// ---------- Lists screen ----------
function renderLists() {
  const grid = document.getElementById("lists-grid");
  grid.innerHTML = "";
  SAVED_LISTS.forEach(list => {
    const card = document.createElement("div");
    card.className = "list-card";
    card.innerHTML = `
      <div class="list-name">${list.name}</div>
      <div class="list-count">${list.items.length} items</div>
      <div class="list-items">${list.items.join(", ")}</div>
      <button class="btn-secondary" style="width:100%;">Add All to Cart</button>
    `;
    card.querySelector("button").onclick = () => addListToCart(list);
    grid.appendChild(card);
  });
}

function addListToCart(list) {
  list.items.forEach((name, i) => {
    const id = `${list.id}-${i}`;
    const product = { id, name, price: (Math.random() * 4 + 1.5).toFixed(2), img: CARROT_IMG_FALLBACK };
    state.cart[id] = { product, qty: 1 };
  });
  updateCartBadge();
  openCart();
}

// ---------- Wire up ----------
document.addEventListener("DOMContentLoaded", () => {
  renderStores();
  updateCartBadge();

  document.querySelectorAll("[data-back]").forEach(btn => btn.onclick = goBack);
  document.querySelectorAll("[data-open-cart]").forEach(btn => btn.onclick = openCart);
  document.querySelectorAll("[data-go-home]").forEach(btn => btn.onclick = goHome);

  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.onclick = () => {
      const target = btn.dataset.nav;
      if (target === "favorites") renderFavorites();
      if (target === "lists") renderLists();
      showScreen(target);
    };
  });

  document.querySelectorAll(".zone-pill").forEach(btn => {
    btn.onclick = () => selectZone(btn.dataset.zone, btn);
  });
  document.querySelectorAll(".method-pill").forEach(btn => {
    btn.onclick = () => selectMethod(btn.dataset.method, btn);
  });
  document.querySelectorAll(".stars button").forEach((btn, i) => {
    btn.onclick = () => setRating(i + 1);
  });
  document.querySelectorAll("[data-setting-toggle]").forEach(btn => {
    btn.onclick = () => btn.classList.toggle("on");
  });

  document.getElementById("checkout-btn").onclick = goToCheckout;
  document.getElementById("continue-btn").onclick = goToCheckout;
  document.getElementById("place-order-btn").onclick = startTracking;
  document.getElementById("abort-btn").onclick = abortDelivery;
  document.getElementById("done-btn").onclick = goHome;
  document.getElementById("notify-toggle").onclick = (e) => e.currentTarget.classList.toggle("on");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});
