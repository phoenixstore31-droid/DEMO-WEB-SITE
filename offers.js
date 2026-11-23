// =============================================
// BIG STORE - OFFERS PAGE
// =============================================

// DEMO DATA
// Replace with real Supabase offers later.

const demoOffers = [
    {
        id: 1,
        title: "Free Fire Diamond Special",
        game: "Free Fire",
        category: "freefire",
        description: "Special demo discount on selected Free Fire diamonds.",
        oldPrice: 1000,
        newPrice: 850,
        discount: 15,
        image: "",
        expiry: Date.now() + 2 * 24 * 60 * 60 * 1000,
        status: "active"
    },
    {
        id: 2,
        title: "PUBG UC Special Deal",
        game: "PUBG Mobile",
        category: "pubg",
        description: "Explore our demo PUBG Mobile UC promotional offer.",
        oldPrice: 2000,
        newPrice: 1700,
        discount: 15,
        image: "",
        expiry: Date.now() + 5 * 24 * 60 * 60 * 1000,
        status: "active"
    },
    {
        id: 3,
        title: "Mobile Legends Diamonds",
        game: "Mobile Legends",
        category: "mobilelegends",
        description: "A sample promotional offer for Mobile Legends.",
        oldPrice: 1500,
        newPrice: 1200,
        discount: 20,
        image: "",
        expiry: Date.now() + 1 * 24 * 60 * 60 * 1000,
        status: "active"
    },
    {
        id: 4,
        title: "Gaming Special Package",
        game: "Other Games",
        category: "other",
        description: "Example promotional package for other games.",
        oldPrice: 3000,
        newPrice: 2400,
        discount: 20,
        image: "",
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        status: "active"
    }
];


// =============================================
// DOM ELEMENTS
// =============================================

const offersGrid = document.getElementById("offersGrid");

const offersLoading = document.getElementById("offersLoading");

const offersEmpty = document.getElementById("offersEmpty");

const offersError = document.getElementById("offersError");

const offersErrorMessage = document.getElementById("offersErrorMessage");

const totalOffers = document.getElementById("totalOffers");

const activeOffers = document.getElementById("activeOffers");

const endingOffers = document.getElementById("endingOffers");

const visibleOfferCount = document.getElementById("visibleOfferCount");

const offerSearch = document.getElementById("offerSearch");

const clearOfferSearch = document.getElementById("clearOfferSearch");

const offerSort = document.getElementById("offerSort");

const resetOfferFilters = document.getElementById("resetOfferFilters");

const retryOffersBtn = document.getElementById("retryOffersBtn");

const offersToast = document.getElementById("offersToast");

const offersToastMessage = document.getElementById("offersToastMessage");


// =============================================
// VARIABLES
// =============================================

let allOffers = [];

let filteredOffers = [];

let currentCategory = "all";

let searchText = "";

let currentSort = "latest";

let countdownInterval = null;

let toastTimeout = null;


// =============================================
// HELPERS
// =============================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2
    }).format(Number(amount) || 0);

}


function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (char) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];

    });

}


function showToast(message) {

    if (!offersToast || !offersToastMessage) return;

    offersToastMessage.textContent = message;

    offersToast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        offersToast.classList.remove("show");

    }, 3000);

}


function showLoading() {

    if (offersLoading) {
        offersLoading.hidden = false;
    }

    if (offersEmpty) {
        offersEmpty.hidden = true;
    }

    if (offersError) {
        offersError.hidden = true;
    }

}


function hideLoading() {

    if (offersLoading) {
        offersLoading.hidden = true;
    }

}


// =============================================
// LOAD OFFERS
// =============================================

async function loadOffers() {

    try {

        showLoading();

        // Demo data only.
        // Supabase integration will be added later.

        await new Promise(resolve => setTimeout(resolve, 500));

        allOffers = demoOffers.filter(offer => {

            return offer.status === "active" &&
                   Number(offer.expiry) > Date.now();

        });

        updateSummary();

        applyFilters();

        hideLoading();

        startCountdown();

    } catch (error) {

        console.error("Offers loading error:", error);

        hideLoading();

        if (offersError) {
            offersError.hidden = false;
        }

        if (offersErrorMessage) {
            offersErrorMessage.textContent =
                "Unable to load offers. Please try again.";
        }

    }

}


// =============================================
// UPDATE SUMMARY
// =============================================

function updateSummary() {

    const now = Date.now();

    const active = allOffers.filter(offer => {

        return offer.status === "active" &&
               Number(offer.expiry) > now;

    });

    const ending = active.filter(offer => {

        return Number(offer.expiry) - now <
               48 * 60 * 60 * 1000;

    });

    if (totalOffers) {
        totalOffers.textContent = active.length;
    }

    if (activeOffers) {
        activeOffers.textContent = active.length;
    }

    if (endingOffers) {
        endingOffers.textContent = ending.length;
    }

}


// =============================================
// FILTER OFFERS
// =============================================

function applyFilters() {

    let result = [...allOffers];

    // Category filter

    if (currentCategory !== "all") {

        result = result.filter(offer => {

            return offer.category === currentCategory;

        });

    }


    // Search filter

    if (searchText) {

        result = result.filter(offer => {

            const searchableText = [

                offer.title,
                offer.game,
                offer.description,
                offer.category

            ].join(" ").toLowerCase();

            return searchableText.includes(searchText);

        });

    }


    // Sorting

    if (currentSort === "discount-high") {

        result.sort((a, b) => {

            return Number(b.discount) - Number(a.discount);

        });

    }

    else if (currentSort === "ending-soon") {

        result.sort((a, b) => {

            return Number(a.expiry) - Number(b.expiry);

        });

    }

    else {

        result.sort((a, b) => {

            return Number(b.id) - Number(a.id);

        });

    }


    filteredOffers = result;

    renderOffers();

}


// =============================================
// RENDER OFFERS
// =============================================

function renderOffers() {

    if (!offersGrid) return;

    offersGrid.innerHTML = "";

    if (visibleOfferCount) {

        visibleOfferCount.textContent = filteredOffers.length;

    }


    if (filteredOffers.length === 0) {

        offersGrid.innerHTML = "";

        if (offersEmpty) {
            offersEmpty.hidden = false;
        }

        return;

    }


    if (offersEmpty) {
        offersEmpty.hidden = true;
    }


    filteredOffers.forEach(offer => {

        const card = createOfferCard(offer);

        offersGrid.appendChild(card);

    });

}


// =============================================
// CREATE OFFER CARD
// =============================================

function createOfferCard(offer) {

    const card = document.createElement("article");

    card.className = "offer-card";

    const safeTitle = escapeHTML(offer.title);

    const safeGame = escapeHTML(offer.game);

    const safeDescription = escapeHTML(offer.description);

    const image = offer.image
        ? `<img src="${escapeHTML(offer.image)}"
                alt="${safeTitle}"
                loading="lazy"
                onerror="this.style.display='none'">`
        : "";


    card.innerHTML = `

        <div class="offer-card-image">

            <div class="offer-image-placeholder">
                <i class="fa-solid fa-gamepad"></i>
            </div>

            ${image}

            <span class="offer-discount-badge">
                ${Number(offer.discount)}% OFF
            </span>

            <span class="offer-status-badge">
                DEMO OFFER
            </span>

        </div>


        <div class="offer-card-content">

            <span class="offer-game-name">

                <i class="fa-solid fa-gamepad"></i>

                ${safeGame}

            </span>


            <h3>${safeTitle}</h3>


            <p class="offer-description">
                ${safeDescription}
            </p>


            <div class="offer-price-row">

                <span class="offer-new-price">
                    ${formatCurrency(offer.newPrice)}
                </span>

                <span class="offer-old-price">
                    ${formatCurrency(offer.oldPrice)}
                </span>

                <span class="offer-savings">
                    Save ${Number(offer.discount)}%
                </span>

            </div>


            <div class="offer-expiry">

                <i class="fa-regular fa-clock"></i>

                <span>Ends in</span>

                <span class="offer-countdown"
                      data-expiry="${Number(offer.expiry)}">

                    Calculating...

                </span>

            </div>


            <button class="offer-card-btn"
                    type="button"
                    data-offer-id="${Number(offer.id)}">

                <i class="fa-solid fa-circle-info"></i>

                Demo Offer

            </button>

        </div>

    `;


    return card;

}


// =============================================
// COUNTDOWN
// =============================================

function startCountdown() {

    if (countdownInterval) {

        clearInterval(countdownInterval);

    }

    updateCountdowns();

    countdownInterval = setInterval(() => {

        updateCountdowns();

    }, 1000);

}


function updateCountdowns() {

    const countdownElements = document.querySelectorAll(
        ".offer-countdown"
    );

    const now = Date.now();

    countdownElements.forEach(element => {

        const expiry = Number(element.dataset.expiry);

        const remaining = expiry - now;

        if (!Number.isFinite(expiry) || remaining <= 0) {

            element.textContent = "Expired";

            return;

        }

        const days = Math.floor(
            remaining / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
            (remaining % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );

        const minutes = Math.floor(
            (remaining % (1000 * 60 * 60)) /
            (1000 * 60)
        );

        const seconds = Math.floor(
            (remaining % (1000 * 60)) / 1000
        );

        if (days > 0) {

            element.textContent =
                `${days}d ${hours}h`;

        } else {

            element.textContent =
                `${hours}h ${minutes}m ${seconds}s`;

        }

    });

}


// =============================================
// CATEGORY BUTTONS
// =============================================

document.querySelectorAll(".offer-category-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".offer-category-btn").forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        currentCategory = button.dataset.category || "all";

        applyFilters();

    });

});


// =============================================
// SEARCH
// =============================================

if (offerSearch) {

    offerSearch.addEventListener("input", () => {

        searchText = offerSearch.value.trim().toLowerCase();

        if (clearOfferSearch) {

            clearOfferSearch.classList.toggle(
                "visible",
                searchText.length > 0
            );

        }

        applyFilters();

    });

}


if (clearOfferSearch) {

    clearOfferSearch.addEventListener("click", () => {

        if (offerSearch) {

            offerSearch.value = "";

        }

        searchText = "";

        clearOfferSearch.classList.remove("visible");

        applyFilters();

    });

}


// =============================================
// SORT
// =============================================

if (offerSort) {

    offerSort.addEventListener("change", () => {

        currentSort = offerSort.value;

        applyFilters();

    });

}


// =============================================
// RESET FILTERS
// =============================================

function resetFilters() {

    currentCategory = "all";

    searchText = "";

    currentSort = "latest";

    if (offerSearch) {
        offerSearch.value = "";
    }

    if (offerSort) {
        offerSort.value = "latest";
    }

    if (clearOfferSearch) {
        clearOfferSearch.classList.remove("visible");
    }

    document.querySelectorAll(".offer-category-btn").forEach(button => {

        button.classList.remove("active");

        if (button.dataset.category === "all") {

            button.classList.add("active");

        }

    });

    applyFilters();

}


if (resetOfferFilters) {

    resetOfferFilters.addEventListener("click", resetFilters);

}


// =============================================
// OFFER BUTTON
// =============================================

if (offersGrid) {

    offersGrid.addEventListener("click", event => {

        const button = event.target.closest(".offer-card-btn");

        if (!button) return;

        showToast(
            "This is a demo offer. Real purchases are not enabled yet."
        );

    });

}


// =============================================
// RETRY BUTTON
// =============================================

if (retryOffersBtn) {

    retryOffersBtn.addEventListener("click", () => {

        loadOffers();

    });

}


// =============================================
// HEADER BUTTONS
// =============================================

const notificationBtn = document.getElementById("notificationBtn");

const profileBtn = document.getElementById("profileBtn");


if (notificationBtn) {

    notificationBtn.addEventListener("click", () => {

        showToast("You have no new notifications.");

    });

}


if (profileBtn) {

    profileBtn.addEventListener("click", () => {

        window.location.href = "profile.html";

    });

}


// =============================================
// BOTTOM NAVIGATION
// =============================================

document.querySelectorAll(".big-store-bottom-nav .nav-item")
    .forEach(link => {

        link.addEventListener("click", function () {

            document.querySelectorAll(
                ".big-store-bottom-nav .nav-item"
            ).forEach(item => {

                item.classList.remove("active");

            });

            this.classList.add("active");

        });

    });


// =============================================
// PAGE INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", () => {

    loadOffers();

});


// =============================================
// CLEANUP
// =============================================

window.addEventListener("beforeunload", () => {

    if (countdownInterval) {

        clearInterval(countdownInterval);

    }

    if (toastTimeout) {

        clearTimeout(toastTimeout);

    }

});