// ==========================================
// DOM ELEMENTS
// ==========================================

const gameSearch = document.getElementById("gameSearch");

const clearGameSearch = document.getElementById("clearGameSearch");

const gamesGrid = document.getElementById("gamesGrid");

const gamesCount = document.getElementById("gamesCount");

const noGamesFound = document.getElementById("noGamesFound");

const resetGameSearch = document.getElementById("resetGameSearch");

const categoryButtons = document.querySelectorAll(".category-btn");

const notificationBtn = document.getElementById("notificationBtn");

const profileBtn = document.getElementById("profileBtn");

const gameCards = document.querySelectorAll(".game-card");


// ==========================================
// PAGE VARIABLES
// ==========================================

let activeCategory = "all";

let searchText = "";


// ==========================================
// GAME FILTER FUNCTION
// ==========================================

function filterGames() {

    let visibleCount = 0;

    gameCards.forEach(card => {

        const gameName = (
            card.dataset.name || ""
        ).toLowerCase();

        const gameCategories = (
            card.dataset.category || ""
        ).toLowerCase().split(" ");

        const matchesSearch = gameName.includes(searchText);

        const matchesCategory =
            activeCategory === "all" ||
            gameCategories.includes(activeCategory);

        const shouldShow = matchesSearch && matchesCategory;

        card.style.display = shouldShow ? "block" : "none";

        if (shouldShow) {
            visibleCount++;
        }

    });


    // UPDATE GAME COUNT

    if (gamesCount) {

        gamesCount.textContent =
            `${visibleCount} ${visibleCount === 1 ? "Game" : "Games"}`;

    }


    // SHOW EMPTY MESSAGE

    if (noGamesFound) {

        noGamesFound.style.display =
            visibleCount === 0 ? "block" : "none";

    }

    if (gamesGrid) {

        gamesGrid.style.display =
            visibleCount === 0 ? "none" : "grid";

    }

}


// ==========================================
// SEARCH GAMES
// ==========================================

if (gameSearch) {

    gameSearch.addEventListener("input", function () {

        searchText = this.value.trim().toLowerCase();

        filterGames();

        updateClearButton();

    });

}


// ==========================================
// CLEAR SEARCH BUTTON
// ==========================================

function updateClearButton() {

    if (!clearGameSearch || !gameSearch) return;

    clearGameSearch.style.display =
        gameSearch.value.length > 0 ? "grid" : "none";

}


if (clearGameSearch) {

    clearGameSearch.addEventListener("click", function () {

        gameSearch.value = "";

        searchText = "";

        filterGames();

        updateClearButton();

        gameSearch.focus();

    });

}


// ==========================================
// CATEGORY FILTER
// ==========================================

categoryButtons.forEach(button => {

    button.addEventListener("click", function () {

        // REMOVE OLD ACTIVE CLASS

        categoryButtons.forEach(btn => {
            btn.classList.remove("active");
        });


        // SET NEW ACTIVE CATEGORY

        this.classList.add("active");

        activeCategory = this.dataset.category || "all";


        // FILTER GAMES

        filterGames();

    });

});


// ==========================================
// RESET SEARCH
// ==========================================

if (resetGameSearch) {

    resetGameSearch.addEventListener("click", function () {

        // CLEAR SEARCH

        if (gameSearch) {
            gameSearch.value = "";
        }

        searchText = "";


        // RESET CATEGORY

        activeCategory = "all";

        categoryButtons.forEach(button => {

            button.classList.remove("active");

            if (button.dataset.category === "all") {
                button.classList.add("active");
            }

        });


        // UPDATE PAGE

        filterGames();

        updateClearButton();

    });

}


// ==========================================
// NOTIFICATION BUTTON
// ==========================================

if (notificationBtn) {

    notificationBtn.addEventListener("click", function () {

        showGameToast("Notifications will be available soon.");

    });

}


// ==========================================
// PROFILE BUTTON
// ==========================================

if (profileBtn) {

    profileBtn.addEventListener("click", function () {

        window.location.href = "profile.html";

    });

}


// ==========================================
// BOTTOM NAVIGATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const currentPage =
        window.location.pathname.split("/").pop().toLowerCase() || "index.html";

    const navItems = document.querySelectorAll(
        ".big-store-bottom-nav .nav-item"
    );

    navItems.forEach(item => {

        const link = (
            item.getAttribute("href") || ""
        ).toLowerCase();

        item.classList.toggle(
            "active",
            link === currentPage
        );

    });

});


// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showGameToast(message) {

    const oldToast = document.querySelector(".game-toast");

    if (oldToast) {
        oldToast.remove();
    }


    const toast = document.createElement("div");

    toast.className = "game-toast";

    toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span></span>
    `;

    toast.querySelector("span").textContent = message;


    document.body.appendChild(toast);


    // TOAST STYLE

    Object.assign(toast.style, {

        position: "fixed",

        top: "90px",

        left: "50%",

        transform: "translateX(-50%)",

        zIndex: "1000000",

        display: "flex",

        alignItems: "center",

        gap: "10px",

        padding: "13px 20px",

        background: "#191919",

        color: "#f5c542",

        border: "1px solid rgba(245,197,66,0.3)",

        borderRadius: "12px",

        fontSize: "13px",

        fontWeight: "600",

        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",

        maxWidth: "90%",

        whiteSpace: "normal"

    });


    // REMOVE TOAST

    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transition = "opacity 0.3s ease";

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 2500);

}


// ==========================================
// INITIALIZE GAMES PAGE
// ==========================================

function initializeGamesPage() {

    filterGames();

    updateClearButton();

}


// ==========================================
// START
// ==========================================

initializeGamesPage();

console.log("BIG STORE Games Page Loaded Successfully.");