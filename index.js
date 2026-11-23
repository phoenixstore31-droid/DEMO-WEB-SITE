/* =========================================
   BIG STORE - MAIN JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // 01. CURRENT YEAR
    // =====================================

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // =====================================
    // 02. HERO SLIDER
    // =====================================

    const heroSlider = document.getElementById("heroSlider");

    const heroSlides = [
        {
            badge: "PREMIUM GAMING STORE",
            title: "Power Up.<br><span>Play More.</span>",
            description: "Fast, secure and reliable gaming top-up services around the world.",
            button: "Explore Games"
        },
        {
            badge: "GLOBAL GAMING SERVICES",
            title: "Your Game.<br><span>Your Power.</span>",
            description: "Discover premium digital products and gaming services.",
            button: "Browse Products"
        },
        {
            badge: "EXCLUSIVE OFFERS",
            title: "More Value.<br><span>More Rewards.</span>",
            description: "Explore exciting offers and special gaming deals.",
            button: "View Offers"
        }
    ];

    let currentSlide = 0;

    function showSlide(index) {

        if (!heroSlider) return;

        const content = heroSlider.querySelector(".hero-content");

        if (!content) return;

        const slide = heroSlides[index];

        content.querySelector(".hero-badge").innerHTML =
            `<i class="fa-solid fa-crown"></i> ${slide.badge}`;

        content.querySelector("h1").innerHTML = slide.title;

        content.querySelector("p").textContent = slide.description;

        content.querySelector(".hero-btn").innerHTML =
            `${slide.button} <i class="fa-solid fa-arrow-right"></i>`;

        currentSlide = index;

        const indicators = heroSlider.querySelectorAll(
            ".slider-indicators span"
        );

        indicators.forEach((indicator, i) => {
            indicator.classList.toggle("active", i === index);
        });

    }

    if (heroSlider) {

        const indicators = heroSlider.querySelectorAll(
            ".slider-indicators span"
        );

        indicators.forEach((indicator, index) => {

            indicator.style.cursor = "pointer";

            indicator.addEventListener("click", () => {
                showSlide(index);
            });

        });

        setInterval(() => {

            currentSlide = (currentSlide + 1) % heroSlides.length;

            showSlide(currentSlide);

        }, 5000);

    }


    // =====================================
    // 03. HERO BUTTON
    // =====================================

    const startTopupBtn = document.getElementById("startTopupBtn");

    if (startTopupBtn) {

        startTopupBtn.addEventListener("click", () => {
            window.location.href = "games.html";
        });

    }


    // =====================================
    // 04. WALLET BUTTON
    // =====================================

    const addMoneyBtn = document.getElementById("addMoneyBtn");

    if (addMoneyBtn) {

        addMoneyBtn.addEventListener("click", () => {
            window.location.href = "wallet.html";
        });

    }


    // =====================================
    // 05. BOTTOM NAVIGATION
    // =====================================

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            navItems.forEach(nav => {
                nav.classList.remove("active");
            });

            item.classList.add("active");

        });

    });


    // =====================================
    // 06. QUICK ACCESS
    // =====================================

    const quickCards = document.querySelectorAll(".quick-card");

    quickCards.forEach(card => {

        card.addEventListener("click", () => {

            const destination = card.getAttribute("href");

            if (destination) {
                window.location.href = destination;
            }

        });

    });


    // =====================================
    // 07. FAQ ACCORDION
    // =====================================

    const faqItems = document.querySelectorAll(".faq-item");

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


    // =====================================
    // 08. NOTIFICATION BUTTON
    // =====================================

    const notificationBtn = document.querySelector(
        ".notification-btn"
    );

    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            window.location.href = "notifications.html";

        });

    }


    // =====================================
    // 09. PROFILE BUTTON
    // =====================================

    const profileBtn = document.querySelector(".profile-btn");

    if (profileBtn) {

        profileBtn.addEventListener("click", () => {

            window.location.href = "profile.html";

        });

    }


    // =====================================
    // 10. SMOOTH PAGE INITIALIZATION
    // =====================================

    document.body.classList.add("page-loaded");

    console.log("BIG STORE initialized successfully!");

});