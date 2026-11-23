// ======================================================
// BIG STORE - FREE FIRE TOP-UP
// COMPLETE FRONTEND JAVASCRIPT
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

        if (!currentUser) {
            return;
        }

        await loadWalletBalance();

        // Products are loaded from secure backend.
        await loadProducts();

    } catch (error) {

        console.error(
            "Initialization Error:",
            error
        );

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

            window.location.href =
            "login.html";

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

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            window.location.href =
            "login.html";

        }

    }
);


// ======================================================
// 08. BACKEND CONNECTION
// ======================================================

async function callFreeFireBackend(
    action,
    data = {}
) {

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error || !session) {

        throw new Error(
            "Please login again."
        );

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

        .select(
            "wallet_balance, username, email"
        )

        .eq("id", currentUser.id)

        .single();

    if (error) {

        console.error(
            "Wallet Error:",
            error
        );

        showToast(
            "Wallet Error",
            "Unable to load your wallet balance.",
            "error"
        );

        return;

    }

    currentProfile = data;

    walletBalance =
    Number(data.wallet_balance || 0);

    updateWalletDisplay();

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
// 12. LOAD FREE FIRE PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const result =
        await callFreeFireBackend("products");

        availableProducts =
        (result.products || []).filter(product => {

            const gameCode =
            String(
                product.game_code || ""
            ).toLowerCase();

            const gameName =
            String(
                product.game_name || ""
            ).toLowerCase();

            return (
                gameCode.includes("freefire") ||
                gameCode.includes("free-fire") ||
                gameName.includes("free fire")
            );

        });

        renderProducts();

    } catch (error) {

        console.error(
            "Products Error:",
            error
        );

        showNoProducts(
            "Unable to load products. Please try again later."
        );

    }

}


// ======================================================
// 13. RENDER PRODUCTS
// ======================================================

function renderProducts() {

    if (!productsGrid || !noProducts) {
        return;
    }

    productsGrid.innerHTML = "";

    if (!verifiedPlayer) {

        showNoProducts(
            "Verify your Player ID to view available packages."
        );

        return;

    }

    if (verifiedPlayer.region !== "SG") {

        showNoProducts(
            "Top-up is currently available only for SG region accounts."
        );

        return;

    }

    const products =
    availableProducts.filter(product => {

        return (
            String(product.region || "")
            .toUpperCase() === "SG"
        );

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

        card.dataset.productId =
        product.id;


        // PRODUCT IMAGE

        const imageBox =
        document.createElement("div");

        imageBox.className =
        "product-image";

        const image =
        document.createElement("img");

        image.alt =
        product.product_name;

        image.loading = "lazy";

        if (product.image_url) {

            image.src =
            product.image_url;

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


        // PRODUCT DETAILS

        const details =
        document.createElement("div");

        details.className =
        "product-details";

        const title =
        document.createElement("h3");

        title.textContent =
        product.product_name;

        const subtitle =
        document.createElement("p");

        subtitle.textContent =
        "Free Fire";

        details.appendChild(title);

        details.appendChild(subtitle);


        // PRODUCT PRICE

        const priceBox =
        document.createElement("div");

        priceBox.className =
        "product-price";

        const currency =
        document.createElement("span");

        currency.textContent =
        "LKR";

        const price =
        document.createElement("strong");

        price.textContent =
        Number(product.price).toLocaleString(
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


        // SELECT PRODUCT

        card.addEventListener("click", () => {

            selectProduct(product, card);

        });


        productsGrid.appendChild(card);

    });

}


// ======================================================
// 14. SHOW NO PRODUCTS
// ======================================================

function showNoProducts(message) {

    if (!productsGrid || !noProducts) {
        return;
    }

    productsGrid.style.display = "none";

    noProducts.classList.add("show");

    const paragraph =
    noProducts.querySelector("p");

    if (paragraph) {

        paragraph.textContent = message;

    }

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

    document
    .querySelectorAll(".product-card")
    .forEach(item => {

        item.classList.remove("selected");

    });

    card.classList.add("selected");

    updateOrderSummary();

}


// ======================================================
// 16. UPDATE ORDER SUMMARY
// ======================================================

function updateOrderSummary() {

    if (!selectedProduct || !verifiedPlayer) {
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

        purchaseButton.disabled = true;

        purchaseButton.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            <span>Purchase Backend Pending</span>
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
// 17. RESET VERIFICATION
// ======================================================

function resetVerification() {

    verifiedPlayer = null;

    selectedProduct = null;

    if (playerResult) {

        playerResult.classList.remove("show");

    }

    if (summaryPlayerID) {

        summaryPlayerID.textContent = "---";

    }

    if (summaryPlayerName) {

        summaryPlayerName.textContent = "---";

    }

    if (summaryProduct) {

        summaryProduct.textContent =
        "Not Selected";

    }

    if (summaryTotal) {

        summaryTotal.textContent =
        "LKR 0.00";

    }

    if (purchaseButton) {

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

        regionStatus.textContent =
        "Waiting";

        regionStatus.className =
        "region-status";

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
// 18. PLAYER INPUT
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
// 19. FIND ALU RESPONSE VALUE
// ======================================================

function findResponseValue(object, keys) {

    if (
        !object ||
        typeof object !== "object"
    ) {

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

        if (
            value &&
            typeof value === "object"
        ) {

            const found =
            findResponseValue(value, keys);

            if (found !== null) {

                return found;

            }

        }

    }

    return null;

}


// ======================================================
// 20. NORMALIZE REGION
// ======================================================

function normalizeRegion(value) {

    if (!value) {
        return "UNKNOWN";
    }

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

    return region;

}


// ======================================================
// 21. NAME CHECK - ALU BACKEND
// ======================================================

function setupNameCheck() {

    if (!nameCheckButton || !playerUID) {
        return;
    }

    nameCheckButton.addEventListener(
        "click",
        async () => {

            const uid =
            playerUID.value.trim();

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

                // CALL BACKEND

                const result =
                await callFreeFireBackend(
                    "name-check",
                    { uid }
                );

                const raw =
                result.data;

                console.log(
                    "FREE FIRE ALU RESPONSE:",
                    raw
                );


                // FIND REAL PLAYER NAME

                const actualName =
                findResponseValue(
                    raw,
                    [
                        "player_name",
                        "playerName",
                        "characterName",
                        "charname",
                        "nickname",
                        "nickName",
                        "character_name",
                        "name"
                    ]
                );


                // FIND REAL REGION

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


                // CHECK NAME

                if (!actualName) {

                    throw new Error(
                        "ALU response received, but player name could not be identified. Please share the API response for correct mapping."
                    );

                }


                const region =
                normalizeRegion(actualRegion);


                // STORE VERIFIED PLAYER

                verifiedPlayer = {

                    playerId: uid,

                    playerName:
                    String(actualName),

                    region

                };


                // DISPLAY PLAYER NAME

                if (playerName) {

                    playerName.textContent =
                    verifiedPlayer.playerName;

                }


                // DISPLAY REGION

                if (playerRegion) {

                    playerRegion.textContent =
                    region;

                }

                if (selectedRegion) {

                    selectedRegion.textContent =
                    region;

                }


                // REGION STATUS

                if (regionStatus) {

                    regionStatus.textContent =
                    region === "SG"
                        ? "Verified"
                        : "Not Supported";

                    regionStatus.className =
                    region === "SG"
                        ? "region-status available"
                        : "region-status";

                }


                // SHOW PLAYER RESULT

                if (playerResult) {

                    playerResult.classList.add("show");

                }


                // VERIFICATION MESSAGE

                if (verificationMessage) {

                    verificationMessage.classList.remove("error");

                    verificationMessage.textContent =
                    region === "SG"
                        ? "Player verified successfully."
                        : "Player identified. Top-up is currently available only for SG accounts.";

                }


                // LOAD SG PRODUCTS

                renderProducts();


                showToast(
                    "Player Verification",
                    region === "SG"
                        ? "Player verified successfully!"
                        : "This account is not eligible for SG top-up.",
                    region === "SG"
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

            } finally {

                nameCheckButton.disabled = false;

                nameCheckButton.innerHTML = `
                    <i class="fa-solid fa-magnifying-glass"></i>
                    Verify Player
                `;

            }

        }
    );

}


// ======================================================
// 22. PURCHASE BUTTON
// ======================================================

function setupPurchaseButton() {

    if (!purchaseButton) return;

    purchaseButton.addEventListener(
        "click",
        () => {

            showToast(
                "Purchase Unavailable",
                "Secure purchase processing is not ready yet.",
                "error"
            );

        }
    );

}


// ======================================================
// 23. MOBILE MENU
// ======================================================

function setupMobileMenu() {

    const menuButton =
    document.getElementById("mobileMenuButton");

    const mobileNavigation =
    document.getElementById("mobileNavigation");

    if (
        !menuButton ||
        !mobileNavigation
    ) {

        return;

    }

    menuButton.addEventListener(
        "click",
        () => {

            mobileNavigation.classList.toggle("show");

            const icon =
            menuButton.querySelector("i");

            if (!icon) return;

            if (
                mobileNavigation.classList.contains("show")
            ) {

                icon.className =
                "fa-solid fa-xmark";

            } else {

                icon.className =
                "fa-solid fa-bars";

            }

        }
    );

}


// ======================================================
// 24. TOAST NOTIFICATION
// ======================================================

function setupToast() {

    const closeButton =
    document.getElementById("closeToast");

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            hideToast
        );

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
    toastContainer.querySelector(
        ".toast-icon i"
    );

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
// 25. HIDE PAGE LOADER
// ======================================================

function hideLoader() {

    if (!pageLoader) return;

    pageLoader.classList.add("hide");

}


// ======================================================
// 26. SECURITY NOTES
// ======================================================

// 1. Service Role Key is NEVER used in frontend.
// 2. ALU Secret Key is NEVER used in frontend.
// 3. Wallet debit must happen in secure backend.
// 4. Product price must be checked in backend.
// 5. User JWT must be verified by backend.
// 6. ALU response must be verified before completing.
// 7. Failed orders must be refunded safely.
// 8. Never trust client-side player information.

// ======================================================
// END OF BIG STORE FREE FIRE FRONTEND
// ======================================================