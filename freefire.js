// ======================================================
// BIG STORE - FREE FIRE TOP-UP
// COMPLETE FIXED FRONTEND JAVASCRIPT
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

let toastTimer = null;
let isPurchasing = false;


// ======================================================
// 03. DOM ELEMENTS
// ======================================================

const pageLoader =
document.getElementById("pageLoader");

const playerUID =
document.getElementById("playerUID");

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

    const yearElement =
    document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent =
        new Date().getFullYear();
    }

    setupMobileMenu();
    setupToast();
    setupPlayerInput();
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

        if (!currentUser) return;

        await loadWalletBalance();

        await loadProducts();

    } catch (error) {

        console.error(
            "Initialization Error:",
            error
        );

        showToast(
            "Something Went Wrong",
            error.message || "Unable to load Free Fire page.",
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

    if (error) throw error;

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

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (event === "SIGNED_OUT" || !session) {
            window.location.href = "login.html";
        }

        if (session) {
            currentUser = session.user;
        }

    }
);


// ======================================================
// 08. BACKEND CONNECTION
// ======================================================

async function callFreeFireBackend(action, data = {}) {

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error || !session) {
        throw new Error("Please login again.");
    }

    const response = await fetch(
        "/.netlify/functions/freefire",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization":
                `Bearer ${session.access_token}`
            },

            body: JSON.stringify({
                action,
                ...data
            })
        }
    );

    let result;

    try {

        result = await response.json();

    } catch {

        throw new Error(
            "Invalid response received from backend."
        );

    }

    if (!response.ok || !result.success) {

        throw new Error(
            result.message ||
            `Backend request failed (${response.status}).`
        );

    }

    return result;

}


// ======================================================
// 09. LOAD WALLET BALANCE
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

    walletBalance = Number(
        data.wallet_balance || 0
    );

    updateWalletDisplay();
    updateOrderSummary();

}


// ======================================================
// 10. UPDATE WALLET DISPLAY
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
// 11. CURRENCY FORMAT
// ======================================================

function formatCurrency(amount) {

    return "LKR " +
    Number(amount || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// ======================================================
// 12. REGION NORMALIZATION
// ======================================================

function normalizeRegion(value) {

    if (!value) return "UNKNOWN";

    const region =
    String(value).trim().toUpperCase();

    if (
        region === "SG" ||
        region.includes("SINGAPORE")
    ) {
        return "SG";
    }

    if (
        region === "MY" ||
        region.includes("MALAYSIA")
    ) {
        return "MY";
    }

    if (
        region === "ASIA" ||
        region.includes("ASIA")
    ) {
        return "ASIA";
    }

    return region;

}


// ======================================================
// 13. CHECK SUPPORTED REGION
// ======================================================

function isSupportedRegion(region) {

    return [
        "SG",
        "ASIA"
    ].includes(
        String(region || "").toUpperCase()
    );

}


// ======================================================
// 14. LOAD FREE FIRE PRODUCTS
// ======================================================

async function loadProducts() {

    try {

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
            .eq("game_code", "freefire_sgmy")
            .eq("region", "SG")
            .eq("is_active", true)
            .order("sort_order", {
                ascending: true
            });

        if (error) throw error;

        availableProducts = (data || []).map(product => ({
            ...product,
            price: Number(product.price)
        }));

        console.log(
            "FREE FIRE PRODUCTS:",
            availableProducts
        );

        renderProducts();

    } catch (error) {

        console.error(
            "Products Loading Error:",
            error
        );

        showNoProducts(
            "Unable to load products. Please try again later."
        );

    }

}


// ======================================================
// 15. RENDER PRODUCTS
// ======================================================

function renderProducts() {

    if (!productsGrid || !noProducts) return;

    productsGrid.innerHTML = "";

    if (!verifiedPlayer) {

        showNoProducts(
            "Verify your Player ID to view available packages."
        );

        return;

    }

    if (!isSupportedRegion(verifiedPlayer.region)) {

        showNoProducts(
            "This account region is not currently supported."
        );

        return;

    }

    const products = availableProducts.filter(product => {

        return String(product.region || "")
        .toUpperCase() === "SG";

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

        const card =
        document.createElement("button");

        card.type = "button";
        card.className = "product-card";
        card.dataset.productId = product.id;

        // IMAGE

        const imageBox =
        document.createElement("div");

        imageBox.className = "product-image";

        const image =
        document.createElement("img");

        image.alt = product.product_name;
        image.loading = "lazy";

        if (product.image_url) {

            image.src = product.image_url;

            image.onerror = () => {
                image.style.display = "none";
            };

        } else {

            image.style.display = "none";

        }

        const fallbackIcon =
        document.createElement("i");

        fallbackIcon.className =
        "fa-solid fa-gem fallback-gem";

        imageBox.appendChild(image);
        imageBox.appendChild(fallbackIcon);

        // DETAILS

        const details =
        document.createElement("div");

        details.className = "product-details";

        const title =
        document.createElement("h3");

        title.textContent =
        product.product_name;

        const subtitle =
        document.createElement("p");

        subtitle.textContent = "Free Fire";

        details.appendChild(title);
        details.appendChild(subtitle);

        // PRICE

        const priceBox =
        document.createElement("div");

        priceBox.className = "product-price";

        const currency =
        document.createElement("span");

        currency.textContent = "LKR";

        const price =
        document.createElement("strong");

        price.textContent =
        product.price.toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

        priceBox.appendChild(currency);
        priceBox.appendChild(price);

        // APPEND

        card.appendChild(imageBox);
        card.appendChild(details);
        card.appendChild(priceBox);

        // SELECT

        card.addEventListener("click", () => {
            selectProduct(product, card);
        });

        productsGrid.appendChild(card);

    });

}


// ======================================================
// 16. SHOW NO PRODUCTS
// ======================================================

function showNoProducts(message) {

    if (!productsGrid || !noProducts) return;

    productsGrid.style.display = "none";

    noProducts.classList.add("show");

    const paragraph =
    noProducts.querySelector("p");

    if (paragraph) {
        paragraph.textContent = message;
    }

}


// ======================================================
// 17. SELECT PRODUCT
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

    if (!isSupportedRegion(verifiedPlayer.region)) {

        showToast(
            "Region Not Supported",
            "This account region is not supported.",
            "error"
        );

        return;

    }

    selectedProduct = product;

    document
        .querySelectorAll(".product-card")
        .forEach(item => {
            item.classList.remove("selected");
        });

    card.classList.add("selected");

    updateOrderSummary();

}


// ======================================================
// 18. UPDATE ORDER SUMMARY
// ======================================================

function updateOrderSummary() {

    if (!purchaseButton) return;

    if (isPurchasing) return;

    if (!selectedProduct || !verifiedPlayer) {

        purchaseButton.disabled = true;

        return;

    }

    if (summaryPlayerID) {
        summaryPlayerID.textContent =
        verifiedPlayer.playerId;
    }

    if (summaryPlayerName) {
        summaryPlayerName.textContent =
        verifiedPlayer.playerName;
    }

    if (summaryProduct) {
        summaryProduct.textContent =
        selectedProduct.product_name;
    }

    if (summaryTotal) {
        summaryTotal.textContent =
        formatCurrency(selectedProduct.price);
    }

    const productPrice =
    Number(selectedProduct.price);

    if (walletBalance >= productPrice) {

        purchaseButton.disabled = false;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-shield-halved"></i>
            <span>Confirm Purchase</span>
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
// 19. RESET VERIFICATION
// ======================================================

function resetVerification() {

    verifiedPlayer = null;
    selectedProduct = null;

    if (playerResult) {
        playerResult.classList.remove("show");
    }

    if (playerName) {
        playerName.textContent = "---";
    }

    if (playerRegion) {
        playerRegion.textContent = "---";
    }

    if (summaryPlayerID) {
        summaryPlayerID.textContent = "---";
    }

    if (summaryPlayerName) {
        summaryPlayerName.textContent = "---";
    }

    if (summaryProduct) {
        summaryProduct.textContent = "Not Selected";
    }

    if (summaryTotal) {
        summaryTotal.textContent = "LKR 0.00";
    }

    if (purchaseButton && !isPurchasing) {

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            <span>Confirm Purchase</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    }

    if (selectedRegion) {
        selectedRegion.textContent =
        "Verify your Player ID first";
    }

    if (regionStatus) {

        regionStatus.textContent = "Waiting";

        regionStatus.className = "region-status";

    }

    document
        .querySelectorAll(".product-card")
        .forEach(card => {
            card.classList.remove("selected");
        });

    showNoProducts(
        "Verify your Player ID to view available packages."
    );

}


// ======================================================
// 20. PLAYER INPUT
// ======================================================

function setupPlayerInput() {

    if (!playerUID) return;

    playerUID.addEventListener("input", () => {

        resetVerification();

        if (verificationMessage) {

            verificationMessage.classList.remove("error");

            verificationMessage.textContent =
            "Please verify your Player ID.";

        }

    });

}


// ======================================================
// 21. FIND ALU RESPONSE VALUE
// ======================================================

function findResponseValue(object, keys) {

    if (!object || typeof object !== "object") {
        return null;
    }

    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            typeof object[key] !== "object"
        ) {

            return object[key];

        }

    }

    for (const value of Object.values(object)) {

        if (value && typeof value === "object") {

            const found =
            findResponseValue(value, keys);

            if (found !== null) return found;

        }

    }

    return null;

}


// ======================================================
// 22. NAME CHECK
// ======================================================

function setupNameCheck() {

    if (!nameCheckButton || !playerUID) return;

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

        resetVerification();

        nameCheckButton.disabled = true;

        nameCheckButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Verifying Player...
        `;

        if (verificationMessage) {

            verificationMessage.classList.remove("error");

            verificationMessage.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Connecting to ALU API...
            `;

        }

        try {

            const result =
            await callFreeFireBackend(
                "name-check",
                { uid }
            );

            const raw = result.data;

            console.log(
                "FREE FIRE ALU RESPONSE:",
                raw
            );

            if (raw?.valid !== "valid") {

                throw new Error(
                    "Free Fire Player ID could not be verified."
                );

            }

            // PLAYER NAME

            const actualName =
            findResponseValue(
                raw,
                [
                    "username",
                    "player_name",
                    "playerName",
                    "characterName",
                    "charname",
                    "nickname",
                    "nickName",
                    "character_name",
                    "name",
                    "fullname"
                ]
            );

            // REGION

            const actualRegion =
            findResponseValue(
                raw,
                [
                    "region",
                    "server",
                    "country",
                    "serverRegion",
                    "server_region"
                ]
            );

            if (!actualName) {

                throw new Error(
                    "Player name was not found in ALU response."
                );

            }

            const region =
            normalizeRegion(actualRegion);

            verifiedPlayer = {

                playerId: uid,

                playerName: String(actualName),

                region

            };

            // DISPLAY NAME

            if (playerName) {

                playerName.textContent =
                verifiedPlayer.playerName;

            }

            // DISPLAY REGION

            if (playerRegion) {

                playerRegion.textContent = region;

            }

            if (selectedRegion) {

                selectedRegion.textContent = region;

            }

            // REGION STATUS

            if (regionStatus) {

                if (isSupportedRegion(region)) {

                    regionStatus.textContent = "Verified";

                    regionStatus.className =
                    "region-status available";

                } else {

                    regionStatus.textContent =
                    "Not Supported";

                    regionStatus.className =
                    "region-status";

                }

            }

            // RESULT

            if (playerResult) {
                playerResult.classList.add("show");
            }

            if (verificationMessage) {

                verificationMessage.classList.remove("error");

                verificationMessage.textContent =
                isSupportedRegion(region)
                ? "Player verified successfully."
                : "This account region is not supported.";

            }

            renderProducts();

            showToast(
                "Player Verification",
                isSupportedRegion(region)
                ? "Player verified successfully!"
                : "This account region is not supported.",
                isSupportedRegion(region)
                ? "success"
                : "error"
            );

        } catch (error) {

            console.error(
                "PLAYER VERIFICATION ERROR:",
                error
            );

            verifiedPlayer = null;

            if (verificationMessage) {

                verificationMessage.classList.add("error");

                verificationMessage.textContent =
                error.message ||
                "Player verification failed.";

            }

            showToast(
                "Verification Failed",
                error.message ||
                "Unable to verify player.",
                "error"
            );

            renderProducts();

        } finally {

            nameCheckButton.disabled = false;

            nameCheckButton.innerHTML = `
                <i class="fa-solid fa-magnifying-glass"></i>
                Verify Player
            `;

        }

    });

}


// ======================================================
// 23. AUTOMATIC ORDER STATUS CHECK
// ======================================================

async function monitorFreeFireOrder(orderId) {

    if (!orderId) {

        throw new Error("Order ID not found.");

    }

    const maxAttempts = 12;
    const delay = 5000;

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            const result =
            await callFreeFireBackend(
                "order-status",
                {
                    order_id: orderId
                }
            );

            console.log(
                `ORDER STATUS CHECK ${attempt}:`,
                result
            );

            // Backend returns:
            // result.alu.data.status

            const aluData =
            result.alu?.data || {};

            const status = String(
                aluData.status ||
                result.order?.status ||
                ""
            ).toLowerCase();

            // SUCCESS

            if (
                status === "successful" ||
                status === "success" ||
                result.order?.status === "completed"
            ) {

                await loadWalletBalance();

                showToast(
                    "Top-Up Successful",
                    "Your Free Fire Top-Up has been delivered!",
                    "success"
                );

                return "completed";

            }

            // FAILED

            if (
                status === "failed" ||
                status === "cancelled"
            ) {

                showToast(
                    "Top-Up Failed",
                    "ALU reported a failed order. Please contact support.",
                    "error"
                );

                return "failed";

            }

            // STILL PROCESSING

            console.log(
                "ALU ORDER STILL PROCESSING:",
                status || "pending"
            );

        } catch (error) {

            console.error(
                "ORDER STATUS ERROR:",
                error
            );

        }

        if (attempt < maxAttempts) {

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );

        }

    }

    showToast(
        "Order Processing",
        "Your order is still being checked. Please check Order History later.",
        "info"
    );

    return "pending";

}


// ======================================================
// 24. PURCHASE BUTTON
// ======================================================

function setupPurchaseButton() {

    if (!purchaseButton) return;

    purchaseButton.disabled = true;

    purchaseButton.addEventListener("click", async () => {

        if (isPurchasing) return;

        if (!currentUser) {

            showToast(
                "Login Required",
                "Please login again.",
                "error"
            );

            return;

        }

        if (!verifiedPlayer || !selectedProduct) {

            showToast(
                "Selection Required",
                "Verify Player ID and select a package.",
                "error"
            );

            return;

        }

        if (!isSupportedRegion(verifiedPlayer.region)) {

            showToast(
                "Region Not Supported",
                "This account region is not supported.",
                "error"
            );

            return;

        }

        const productPrice =
        Number(selectedProduct.price);

        if (walletBalance < productPrice) {

            showToast(
                "Insufficient Balance",
                "Please add money to your wallet.",
                "error"
            );

            return;

        }

        const confirmed = window.confirm(

            `Confirm Free Fire Top-Up?\n\n` +

            `Player ID: ${verifiedPlayer.playerId}\n` +

            `Player Name: ${verifiedPlayer.playerName}\n` +

            `Package: ${selectedProduct.product_name}\n` +

            `Amount: ${formatCurrency(productPrice)}\n\n` +

            `Continue?`

        );

        if (!confirmed) return;

        isPurchasing = true;

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Processing Order...</span>
        `;

        try {

            const clientRequestId =
            crypto.randomUUID();

            const result =
            await callFreeFireBackend(
                "purchase",
                {
                    product_id: selectedProduct.id,
                    player_id: verifiedPlayer.playerId,
                    client_request_id: clientRequestId
                }
            );

            console.log(
                "FREE FIRE PURCHASE RESULT:",
                result
            );

            // UPDATE WALLET AFTER DEBIT

            await loadWalletBalance();

            // ORDER ID

            const orderId =
            result.order?.id;

            if (!orderId) {

                showToast(
                    "Order Submitted",
                    result.message ||
                    "Your order was submitted. Check Order History.",
                    "info"
                );

                return;

            }

            // AUTOMATIC STATUS CHECK

            purchaseButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Checking Top-Up Status...</span>
            `;

            const finalStatus =
            await monitorFreeFireOrder(orderId);

            // FINAL BUTTON MESSAGE

            if (finalStatus === "completed") {

                purchaseButton.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Top-Up Completed</span>
                `;

            } else if (finalStatus === "failed") {

                purchaseButton.innerHTML = `
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>Order Failed</span>
                `;

            } else {

                purchaseButton.innerHTML = `
                    <i class="fa-solid fa-clock"></i>
                    <span>Order Processing</span>
                `;

            }

        } catch (error) {

            console.error(
                "PURCHASE ERROR:",
                error
            );

            showToast(
                "Purchase Failed",
                error.message ||
                "Unable to process purchase.",
                "error"
            );

            await loadWalletBalance();

        } finally {

            isPurchasing = false;

            // Keep the result button state.
            // Do not overwrite Completed with Order Submitted.

            if (
                !purchaseButton.textContent.includes("Completed") &&
                !purchaseButton.textContent.includes("Processing") &&
                !purchaseButton.textContent.includes("Failed")
            ) {

                updateOrderSummary();

            }

        }

    });

}


// ======================================================
// 25. MOBILE MENU
// ======================================================

function setupMobileMenu() {

    const menuButton =
    document.getElementById("mobileMenuButton");

    const mobileNavigation =
    document.getElementById("mobileNavigation");

    if (!menuButton || !mobileNavigation) return;

    menuButton.addEventListener("click", () => {

        mobileNavigation.classList.toggle("show");

        const icon =
        menuButton.querySelector("i");

        if (!icon) return;

        icon.className =
        mobileNavigation.classList.contains("show")
        ? "fa-solid fa-xmark"
        : "fa-solid fa-bars";

    });

}


// ======================================================
// 26. TOAST NOTIFICATION
// ======================================================

function setupToast() {

    const closeButton =
    document.getElementById("closeToast");

    if (closeButton) {
        closeButton.addEventListener("click", hideToast);
    }

}


function showToast(
    title,
    message,
    type = "info"
) {

    if (!toastContainer) return;

    const toastTitle =
    document.getElementById("toastTitle");

    const toastMessage =
    document.getElementById("toastMessage");

    const toastIcon =
    toastContainer.querySelector(".toast-icon i");

    if (toastTitle) {
        toastTitle.textContent = title;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toastIcon) {

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

    }

    toastContainer.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        hideToast,
        4500
    );

}


function hideToast() {

    if (!toastContainer) return;

    toastContainer.classList.remove("show");

}


// ======================================================
// 27. HIDE PAGE LOADER
// ======================================================

function hideLoader() {

    if (!pageLoader) return;

    pageLoader.classList.add("hide");

}


// ======================================================
// 28. SECURITY NOTES
// ======================================================

// 1. Service Role Key is NEVER used in frontend.
// 2. ALU Secret Key is NEVER used in frontend.
// 3. Wallet debit happens in backend only.
// 4. Backend must verify product price.
// 5. Backend must verify customer JWT.
// 6. Backend verifies player name with ALU.
// 7. Only ALU-confirmed success completes an order.
// 8. Pending orders must not be marked successful.
// 9. Failed orders require secure backend refund.
// 10. Never retry uncertain purchases blindly.


// ======================================================
// END BIG STORE FREE FIRE FRONTEND
// ======================================================