// ================================================
// BIG STORE - MAIN INDEX JAVASCRIPT
// FIXED VERSION
// SUPABASE INTEGRATION
// ================================================

import { createClient } from
"https://esm.sh/@supabase/supabase-js@2";


// ================================================
// 01. SUPABASE CONNECTION
// ================================================

const SUPABASE_URL =
"https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


// ================================================
// 02. GLOBAL STATE
// ================================================

let currentUser = null;

let heroInterval = null;


// ================================================
// 03. IMAGE FALLBACK
// FIXED 404 INFINITE LOOP
// ================================================

const FALLBACK_IMAGE =
"data:image/svg+xml;charset=UTF-8," +
encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"
width="400" height="300" viewBox="0 0 400 300">

<rect width="400" height="300" fill="#151515"/>

<g fill="none" stroke="#d4af37"
stroke-width="8" opacity=".8">

<rect x="145" y="85" width="110"
height="85" rx="12"/>

<circle cx="180" cy="115" r="12"/>

<path d="M150 155 L185 130 L210 150 L235 120 L255 155"/>

</g>

<text x="200" y="215"
fill="#d4af37"
font-size="18"
text-anchor="middle"
font-family="Arial">

BIG STORE

</text>

</svg>
`);


function setupImageFallback(image) {

    if (!image) return;

    image.addEventListener("error", () => {

        if (image.dataset.fallbackApplied === "true") {
            return;
        }

        image.dataset.fallbackApplied = "true";

        image.src = FALLBACK_IMAGE;

    });

}


// ================================================
// 04. INITIALIZATION
// ================================================

document.addEventListener(
"DOMContentLoaded",
async () => {

    const currentYear =
    document.getElementById("currentYear");

    if (currentYear) {

        currentYear.textContent =
        new Date().getFullYear();

    }


    initializeHeroSlider();

    initializeFAQ();

    initializeNavigation();

    initializeButtons();


    // Fix existing images on page

    document.querySelectorAll("img").forEach(img => {

        setupImageFallback(img);

    });


    document.body.classList.add("page-loaded");


    await checkUserSession();


    console.log(
        "BIG STORE initialized successfully!"
    );

});


// ================================================
// 05. AUTHENTICATION
// ================================================

async function checkUserSession() {

    try {

        const {
            data,
            error
        } = await supabase.auth.getSession();


        if (error) {
            throw error;
        }


        if (!data.session) {

            window.location.replace("login.html");

            return;

        }


        currentUser = data.session.user;


        // Load homepage data

        await Promise.allSettled([

            loadWalletBalance(),

            loadFeaturedProducts(),

            loadCustomerReviews(),

            loadLeaderboard()

        ]);


    } catch (error) {

        console.error(
            "Session Error:",
            error
        );

        showToast(
            "Unable to verify your account."
        );

    }

}


// ================================================
// 06. WALLET BALANCE
// ================================================

async function loadWalletBalance() {

    if (!currentUser) return;


    const walletElement =
    document.getElementById("walletBalance");


    if (!walletElement) return;


    walletElement.textContent = "Loading...";


    try {

        const {
            data,
            error
        } = await supabase

            .from("profiles")

            .select("wallet_balance")

            .eq("id", currentUser.id)

            .single();


        if (error) {
            throw error;
        }


        const balance =
        Number(data.wallet_balance || 0);


        walletElement.textContent =

        "LKR " + balance.toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    } catch (error) {

        console.error(
            "Wallet Error:",
            error
        );

        walletElement.textContent =
        "Unavailable";

    }

}


// ================================================
// 07. HERO SLIDER
// ================================================

function initializeHeroSlider() {

    const heroSlider =
    document.getElementById("heroSlider");


    if (!heroSlider) return;


    const content =
    heroSlider.querySelector(".hero-content");


    if (!content) return;


    const badge =
    content.querySelector(".hero-badge");

    const heading =
    content.querySelector("h1");

    const description =
    content.querySelector("p");

    const button =
    content.querySelector(".hero-btn");


    if (!badge || !heading || !description || !button) {
        return;
    }


    const heroSlides = [

        {
            badge: "PREMIUM GAMING STORE",

            title: "Power Up.<br><span>Play More.</span>",

            description:
            "Fast, secure and reliable gaming top-up services around the world.",

            button: "Explore Games"
        },

        {
            badge: "GLOBAL GAMING SERVICES",

            title: "Your Game.<br><span>Your Power.</span>",

            description:
            "Discover premium digital products and gaming services.",

            button: "Browse Products"
        },

        {
            badge: "EXCLUSIVE OFFERS",

            title: "More Value.<br><span>More Rewards.</span>",

            description:
            "Explore exciting offers and special gaming deals.",

            button: "View Offers"
        }

    ];


    let currentSlide = 0;


    function showSlide(index) {

        const slide = heroSlides[index];


        badge.innerHTML =
        `<i class="fa-solid fa-crown"></i> ${slide.badge}`;


        heading.innerHTML =
        slide.title;


        description.textContent =
        slide.description;


        button.innerHTML =
        `${slide.button} <i class="fa-solid fa-arrow-right"></i>`;


        currentSlide = index;


        const indicators =
        heroSlider.querySelectorAll(
            ".slider-indicators span"
        );


        indicators.forEach((indicator, i) => {

            indicator.classList.toggle(
                "active",
                i === index
            );

        });

    }


    const indicators =
    heroSlider.querySelectorAll(
        ".slider-indicators span"
    );


    indicators.forEach((indicator, index) => {

        indicator.style.cursor = "pointer";

        indicator.addEventListener("click", () => {

            showSlide(index);

            restartSlider();

        });

    });


    function restartSlider() {

        clearInterval(heroInterval);

        heroInterval = setInterval(() => {

            const nextSlide =
            (currentSlide + 1) % heroSlides.length;

            showSlide(nextSlide);

        }, 5000);

    }


    showSlide(0);

    restartSlider();

}


// ================================================
// 08. BUTTONS
// ================================================

function initializeButtons() {


    const startTopupBtn =
    document.getElementById("startTopupBtn");


    if (startTopupBtn) {

        startTopupBtn.addEventListener("click", () => {

            window.location.href = "games.html";

        });

    }


    const addMoneyBtn =
    document.getElementById("addMoneyBtn");


    if (addMoneyBtn) {

        addMoneyBtn.addEventListener("click", () => {

            window.location.href = "wallet-topup.html";

        });

    }


    const profileBtn =
    document.querySelector(".profile-btn");


    if (profileBtn) {

        profileBtn.addEventListener("click", () => {

            window.location.href = "profile.html";

        });

    }


    const notificationBtn =
    document.querySelector(".notification-btn");


    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            window.location.href = "notifications.html";

        });

    }

}


// ================================================
// 09. BOTTOM NAVIGATION
// ================================================

function initializeNavigation() {

    const currentPage =

    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase() || "index.html";


    document.querySelectorAll(
        ".big-store-bottom-nav .nav-item"
    ).forEach(item => {

        const link =
        item.getAttribute("href");


        if (!link) return;


        item.classList.toggle(

            "active",

            link.toLowerCase() === currentPage

        );

    });

}


// ================================================
// 10. FAQ ACCORDION
// ================================================

function initializeFAQ() {

    const faqItems =
    document.querySelectorAll(".faq-item");


    faqItems.forEach(item => {

        item.addEventListener("toggle", () => {

            if (item.open) {

                faqItems.forEach(otherItem => {

                    if (otherItem !== item) {

                        otherItem.open = false;

                    }

                });

            }

        });

    });

}


// ================================================
// 11. FEATURED PRODUCTS
// ================================================

async function loadFeaturedProducts() {

    const dealsGrid =
    document.getElementById("dealsGrid");


    if (!dealsGrid) return;


    dealsGrid.innerHTML = `

        <div class="deals-placeholder">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>Loading products...</p>

        </div>

    `;


    try {

const {
    data,
    error
} = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .limit(6);


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            dealsGrid.innerHTML = `

                <div class="deals-placeholder">

                    <i class="fa-solid fa-box-open"></i>

                    <p>No products available right now.</p>

                </div>

            `;

            return;

        }


        dealsGrid.innerHTML = "";


        data.forEach(product => {

            const name =

            product.product_name ||
            product.name ||
            "Gaming Product";


            const price =
            Number(product.price || 0);


            const image =

            product.image_url ||
            product.image ||
            FALLBACK_IMAGE;


            const card =
            document.createElement("div");


            card.className = "deal-card";


            const img =
            document.createElement("img");


            img.src = image;

            img.alt = name;

            img.loading = "lazy";

            setupImageFallback(img);


            const title =
            document.createElement("h3");


            title.textContent = name;


            const priceElement =
            document.createElement("p");


            priceElement.textContent =

            "LKR " + price.toLocaleString(
                "en-LK",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );


            const button =
            document.createElement("button");


            button.type = "button";

            button.textContent = "View Product";


            button.addEventListener("click", () => {

                window.location.href = "games.html";

            });


            card.appendChild(img);

            card.appendChild(title);

            card.appendChild(priceElement);

            card.appendChild(button);


            dealsGrid.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Products Error:",
            error
        );


        dealsGrid.innerHTML = `

            <div class="deals-placeholder">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <p>Products could not be loaded.</p>

            </div>

        `;

    }

}


// ================================================
// 12. CUSTOMER REVIEWS
// ================================================

async function loadCustomerReviews() {

    const reviewsContainer =
    document.getElementById("reviewsContainer");


    if (!reviewsContainer) return;


    try {

        const {
            data,
            error
        } = await supabase

            .from("reviews")

            .select("*")

            .eq("status", "approved")

            .limit(6);


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            reviewsContainer.innerHTML = `

                <div class="reviews-placeholder">

                    <i class="fa-solid fa-star"></i>

                    <p>No customer reviews available yet.</p>

                </div>

            `;

            return;

        }


        reviewsContainer.innerHTML = "";


        data.forEach(review => {

            const card =
            document.createElement("div");


            card.className = "review-card";


            // Customer name

            const name =
            document.createElement("h3");


            name.textContent =
            review.customer_name || "Customer";


            // Rating

            const rating =
            document.createElement("div");


            rating.className = "review-rating";


            const stars = Math.max(
                0,
                Math.min(5, Math.floor(
                    Number(review.rating || 0)
                ))
            );


            rating.textContent =

            "\u2605".repeat(stars) +
            "\u2606".repeat(5 - stars);


            // Review message

            const message =
            document.createElement("p");


            message.textContent =
            review.review_text || "";


            card.appendChild(name);

            card.appendChild(rating);

            card.appendChild(message);


            reviewsContainer.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Reviews Error:",
            error
        );


        reviewsContainer.innerHTML = `

            <div class="reviews-placeholder">

                <i class="fa-solid fa-star"></i>

                <p>Reviews could not be loaded.</p>

            </div>

        `;

    }

}


// ================================================
// 13. LEADERBOARD
// ================================================

async function loadLeaderboard() {

    const leaderboardList =
    document.getElementById("leaderboardList");


    const rankingElement =
    document.getElementById("userRanking");


    if (!leaderboardList) return;


    leaderboardList.innerHTML = `

        <div class="leaderboard-placeholder">

            <i class="fa-solid fa-trophy"></i>

            <p>Leaderboard will be available soon.</p>

        </div>

    `;


    if (rankingElement) {

        rankingElement.textContent = "#--";

    }

}


// ================================================
// 14. TOAST MESSAGE
// ================================================

function showToast(message) {

    let toast =
    document.getElementById("indexToast");


    if (!toast) {

        toast =
        document.createElement("div");


        toast.id = "indexToast";


        toast.style.cssText = `

            position:fixed;

            bottom:110px;

            left:50%;

            transform:translateX(-50%);

            background:#222;

            color:#fff;

            padding:13px 20px;

            border:1px solid #d4af37;

            border-radius:10px;

            z-index:999999;

            font-size:14px;

            box-shadow:0 5px 20px rgba(0,0,0,.4);

            max-width:90%;

            text-align:center;

        `;


        document.body.appendChild(toast);

    }


    toast.textContent = message;


    toast.style.display = "block";


    clearTimeout(toast.hideTimer);


    toast.hideTimer = setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}


// ================================================
// 15. AUTH STATE LISTENER
// ================================================

supabase.auth.onAuthStateChange((event) => {

    if (event === "SIGNED_OUT") {

        window.location.replace("login.html");

    }

});


// ================================================
// 16. END
// ================================================

console.log(
    "BIG STORE INDEX.JS LOADED"
);