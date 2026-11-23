// ======================================================
// BIG STORE - FREE FIRE TOP-UP
// FRONTEND JAVASCRIPT
// ======================================================

import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// ======================================================
// 01. SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
    "https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ======================================================
// 02. GLOBAL VARIABLES
// ======================================================

let currentUser = null;
let currentProfile = null;

let walletBalance = 0;

let verifiedPlayer = null;
let selectedProduct = null;

let availableProducts = [];


// ======================================================
// 03. DOM ELEMENTS
// ======================================================

const pageLoader = document.getElementById("pageLoader");

const playerUID = document.getElementById("playerUID");

const nameCheckButton =
    document.getElementById("nameCheckButton");

const playerResult =
    document.getElementById("playerResult");

const playerName =
    document.getElementById("playerName");

const playerRegion =
    document.getElementById("playerRegion");

const verificationMessage =
    document.getElementById("verificationMessage");

const selectedRegion =
    document.getElementById("selectedRegion");

const regionStatus =
    document.getElementById("regionStatus");

const productsGrid =
    document.getElementById("productsGrid");

const noProducts =
    document.getElementById("noProducts");

const purchaseButton =
    document.getElementById("purchaseButton");

const walletBalanceElement =
    document.getElementById("walletBalance");

const sidebarWalletBalance =
    document.getElementById("sidebarWalletBalance");

const summaryPlayerID =
    document.getElementById("summaryPlayerID");

const summaryPlayerName =
    document.getElementById("summaryPlayerName");

const summaryProduct =
    document.getElementById("summaryProduct");

const summaryTotal =
    document.getElementById("summaryTotal");

const toastContainer =
    document.getElementById("toastContainer");


// ======================================================
// 04. PAGE INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    setupMobileMenu();

    setupToast();

    setupPlayerInput();

    setupProductSelection();

    setupNameCheck();

    setupPurchaseButton();

    await initializePage();

});


// ======================================================
// 05. INITIALIZE PAGE
// ======================================================

async function initializePage() {

    try {

        await checkLogin();

        if (!currentUser) {
            return;
        }

        await loadWalletBalance();

        await loadProducts();

    } catch (error) {

        console.error("Initialization Error:", error);

        showToast(
            "Something went wrong",
            "Unable to load the Free Fire page.",
            "error"
        );

    } finally {

        hideLoader();

    }

}


// ======================================================
// 06. CHECK LOGIN
// ======================================================

async function checkLogin() {

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session) {

        showToast(
            "Login Required",
            "Please login to use BIG STORE Top-Up.",
            "error"
        );

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

        return;

    }

    currentUser = session.user;

}


// ======================================================
// 07. AUTH STATE CHANGE
// ======================================================

supabase.auth.onAuthStateChange((event, session) => {

    if (event === "SIGNED_OUT" || !session) {

        window.location.href = "login.html";

    }

});


// ======================================================
// 08. LOAD WALLET BALANCE
// ======================================================

async function loadWalletBalance() {

    if (!currentUser) return;

    const { data, error } = await supabase
        .from("profiles")
        .select("wallet_balance, username, email")
        .eq("id", currentUser.id)
        .single();

    if (error) {

        console.error("Wallet Error:", error);

        showToast(
            "Wallet Error",
            "Unable to load your wallet balance.",
            "error"
        );

        return;

    }

    currentProfile = data;

    walletBalance = Number(data.wallet_balance || 0);

    updateWalletDisplay();

}


// ======================================================
// 09. UPDATE WALLET DISPLAY
// ======================================================

function updateWalletDisplay() {

    const formattedBalance =
        formatCurrency(walletBalance);

    if (walletBalanceElement) {

        walletBalanceElement.textContent =
            formattedBalance;

    }

    if (sidebarWalletBalance) {

        sidebarWalletBalance.textContent =
            formattedBalance;

    }

}


// ======================================================
// 10. CURRENCY FORMAT
// ======================================================

function formatCurrency(amount) {

    return "LKR " + Number(amount || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// 11. LOAD TOP-UP PRODUCTS
// ======================================================

async function loadProducts() {

    const { data, error } = await supabase
        .from("topup_products")
        .select(`
            id,
            game_name,
            game_code,
            product_name,
            denom,
            region,
            image_url,
            price,
            is_active,
            sort_order
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {

        console.error("Products Error:", error);

        showNoProducts(
            "Unable to load products. Please try again later."
        );

        return;

    }

    // Only Free Fire products are displayed.
    availableProducts = (data || []).filter(product => {

        const gameCode =
            String(product.game_code || "").toLowerCase();

        const gameName =
            String(product.game_name || "").toLowerCase();

        return (
            gameCode.includes("freefire") ||
            gameCode.includes("free-fire") ||
            gameName.includes("free fire")
        );

    });

    renderProducts();

}


// ======================================================
// 12. RENDER PRODUCTS
// ======================================================

function renderProducts() {

    productsGrid.innerHTML = "";

    const regionVerified =
        verifiedPlayer?.region?.toUpperCase() === "SG";

    if (!verifiedPlayer) {

        showNoProducts(
            "Verify your Player ID to view available packages."
        );

        return;

    }

    if (!regionVerified) {

        showNoProducts(
            "Top-up is currently available only for SG region accounts."
        );

        return;

    }

    const products = availableProducts.filter(product => {

        return String(product.region || "").toUpperCase() === "SG";

    });

    if (products.length === 0) {

        showNoProducts(
            "No SG products are currently available."
        );

        return;

    }

    noProducts.classList.remove("show");

    productsGrid.style.display = "grid";

    products.forEach(product => {

        const card = document.createElement("button");

        card.type = "button";

        card.className = "product-card";

        card.dataset.productId = product.id;

        const image = document.createElement("img");

        image.src = product.image_url || "";

        image.alt = product.product_name;

        image.onerror = () => {
            image.style.display = "none";
        };

        const imageBox = document.createElement("div");

        imageBox.className = "product-image";

        const fallbackIcon = document.createElement("i");

        fallbackIcon.className =
            "fa-solid fa-gem fallback-gem";

        imageBox.appendChild(image);

        imageBox.appendChild(fallbackIcon);


        const details = document.createElement("div");

        details.className = "product-details";

        const title = document.createElement("h3");

        title.textContent = product.product_name;

        const subtitle = document.createElement("p");

        subtitle.textContent = "Free Fire";

        details.appendChild(title);

        details.appendChild(subtitle);


        const priceBox = document.createElement("div");

        priceBox.className = "product-price";

        const currency = document.createElement("span");

        currency.textContent = "LKR";

        const price = document.createElement("strong");

        price.textContent =
            Number(product.price).toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        priceBox.appendChild(currency);

        priceBox.appendChild(price);


        card.appendChild(imageBox);

        card.appendChild(details);

        card.appendChild(priceBox);


        card.addEventListener("click", () => {

            selectProduct(product, card);

        });


        productsGrid.appendChild(card);

    });

}


// ======================================================
// 13. SHOW NO PRODUCTS
// ======================================================

function showNoProducts(message) {

    productsGrid.style.display = "none";

    noProducts.classList.add("show");

    noProducts.querySelector("p").textContent = message;

}


// ======================================================
// 14. PRODUCT SELECTION
// ======================================================

function setupProductSelection() {

    productsGrid.addEventListener("click", event => {

        const card = event.target.closest(".product-card");

        if (!card) return;

        if (card.disabled) return;

    });

}


// ======================================================
// 15. SELECT PRODUCT
// ======================================================

function selectProduct(product, card) {

    if (!verifiedPlayer) {

        showToast(
            "Verification Required",
            "Please verify your Player ID first.",
            "error"
        );

        return;

    }

    if (verifiedPlayer.region !== "SG") {

        showToast(
            "Region Not Supported",
            "Top-up is currently available only for SG accounts.",
            "error"
        );

        return;

    }

    selectedProduct = product;

    document.querySelectorAll(".product-card").forEach(item => {

        item.classList.remove("selected");

    });

    card.classList.add("selected");

    updateOrderSummary();

}


// ======================================================
// 16. UPDATE ORDER SUMMARY
// ======================================================

function updateOrderSummary() {

    if (!selectedProduct || !verifiedPlayer) return;

    summaryPlayerID.textContent =
        verifiedPlayer.playerId;

    summaryPlayerName.textContent =
        verifiedPlayer.playerName;

    summaryProduct.textContent =
        selectedProduct.product_name;

    summaryTotal.textContent =
        formatCurrency(selectedProduct.price);

    const productPrice =
        Number(selectedProduct.price);

    if (walletBalance >= productPrice) {

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            <span>Backend Connection Required</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    } else {

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-wallet"></i>
            <span>Insufficient Wallet Balance</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    }

}


// ======================================================
// 17. PLAYER INPUT
// ======================================================

function setupPlayerInput() {

    playerUID.addEventListener("input", () => {

        const value = playerUID.value.trim();

        verifiedPlayer = null;

        selectedProduct = null;

        playerResult.classList.remove("show");

        document.querySelectorAll(".product-card").forEach(card => {

            card.classList.remove("selected");

        });

        summaryPlayerID.textContent = "---";

        summaryPlayerName.textContent = "---";

        summaryProduct.textContent = "Not Selected";

        summaryTotal.textContent = "LKR 0.00";

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            <span>Confirm Purchase</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

        selectedRegion.textContent =
            "Verify your Player ID first";

        regionStatus.textContent = "Waiting";

        regionStatus.className = "region-status";

        if (!value) {

            verificationMessage.textContent =
                "Please enter your Player ID.";

        }

        productsGrid.style.display = "none";

        noProducts.classList.add("show");

        noProducts.querySelector("p").textContent =
            "Verify your Player ID to view available packages.";

    });

}


// ======================================================
// 18. NAME CHECK
// ======================================================

function setupNameCheck() {

    nameCheckButton.addEventListener("click", async () => {

        const uid = playerUID.value.trim();

        if (!uid) {

            showToast(
                "Player ID Required",
                "Please enter your Free Fire Player ID.",
                "error"
            );

            playerUID.focus();

            return;

        }

        if (!/^\d{5,20}$/.test(uid)) {

            showToast(
                "Invalid Player ID",
                "Please enter a valid numeric Player ID.",
                "error"
            );

            return;

        }

        // Backend has not been connected yet.
        // Never display a fake verified player.

        showToast(
            "Backend Not Connected",
            "Player verification will work after ALU backend integration.",
            "error"
        );

        verificationMessage.classList.add("error");

        verificationMessage.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i>
            Player verification is not connected yet.
            Please wait for backend integration.
        `;

    });

}


// ======================================================
// 19. PURCHASE BUTTON
// ======================================================

function setupPurchaseButton() {

    purchaseButton.addEventListener("click", () => {

        showToast(
            "Purchase Unavailable",
            "Secure backend purchase integration is not ready yet.",
            "error"
        );

    });

}


// ======================================================
// 20. MOBILE MENU
// ======================================================

function setupMobileMenu() {

    const menuButton =
        document.getElementById("mobileMenuButton");

    const mobileNavigation =
        document.getElementById("mobileNavigation");

    if (!menuButton || !mobileNavigation) return;

    menuButton.addEventListener("click", () => {

        mobileNavigation.classList.toggle("show");

        const icon = menuButton.querySelector("i");

        if (mobileNavigation.classList.contains("show")) {

            icon.className = "fa-solid fa-xmark";

        } else {

            icon.className = "fa-solid fa-bars";

        }

    });

}


// ======================================================
// 21. TOAST NOTIFICATION
// ======================================================

let toastTimer = null;

function setupToast() {

    const closeButton =
        document.getElementById("closeToast");

    if (closeButton) {

        closeButton.addEventListener("click", hideToast);

    }

}


function showToast(title, message, type = "info") {

    if (!toastContainer) return;

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");

    const toastIcon =
        toastContainer.querySelector(".toast-icon i");

    toastTitle.textContent = title;

    toastMessage.textContent = message;

    if (type === "error") {

        toastIcon.className =
            "fa-solid fa-circle-exclamation";

    } else if (type === "success") {

        toastIcon.className =
            "fa-solid fa-circle-check";

    } else {

        toastIcon.className =
            "fa-solid fa-circle-info";

    }

    toastContainer.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        hideToast();

    }, 4500);

}


function hideToast() {

    toastContainer.classList.remove("show");

}


// ======================================================
// 22. HIDE PAGE LOADER
// ======================================================

function hideLoader() {

    if (!pageLoader) return;

    pageLoader.classList.add("hide");

}


// ======================================================
// 23. SECURITY NOTE
// ======================================================

// IMPORTANT:
//
// 1. Never put SUPABASE_SERVICE_ROLE_KEY in this file.
// 2. Never put ALU_SECRET_KEY in this file.
// 3. Never debit wallet directly from frontend.
// 4. Never trust product prices sent by frontend.
// 5. Purchase must be processed by secure Netlify backend.
// 6. Backend must verify the user's Supabase JWT.
// 7. Backend must verify the ALU response before completing
//    or refunding an order.
//
// ======================================================
// END OF FREE FIRE FRONTEND
// ======================================================