// ==========================================
// BIG STORE - GAMES PAGE
// SUPABASE INTEGRATION
// ==========================================

import { createClient } from
"https://esm.sh/@supabase/supabase-js@2";


// ==========================================
// 01. SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
"https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_KEY =
"sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


// ==========================================
// 02. DOM ELEMENTS
// ==========================================

const gameSearch =
document.getElementById("gameSearch");

const clearGameSearch =
document.getElementById("clearGameSearch");

const gamesGrid =
document.getElementById("gamesGrid");

const gamesCount =
document.getElementById("gamesCount");

const noGamesFound =
document.getElementById("noGamesFound");

const resetGameSearch =
document.getElementById("resetGameSearch");

const categoryButtons =
document.querySelectorAll(".category-btn");

const notificationBtn =
document.getElementById("notificationBtn");

const profileBtn =
document.getElementById("profileBtn");


// ==========================================
// 03. VARIABLES
// ==========================================

let allGames = [];

let activeCategory = "all";

let searchText = "";


// ==========================================
// 04. GAME CONFIGURATION
// ==========================================

const gameConfig = {

    "Free Fire": {
        slug: "free-fire",
        icon: "fa-fire",
        css: "game-free-fire",
        category: ["battle-royale", "mobile"],
        genre: "Battle Royale"
    },

    "Arena of Valor": {
        slug: "arena-of-valor",
        icon: "fa-shield-halved",
        css: "game-aov",
        category: ["mobile"],
        genre: "MOBA"
    },

    "Call of Duty: Mobile": {
        slug: "call-of-duty-mobile",
        icon: "fa-crosshairs",
        css: "game-cod",
        category: ["battle-royale", "mobile"],
        genre: "Action"
    },

    "Garena Delta Force": {
        slug: "delta-force",
        icon: "fa-bullseye",
        css: "game-delta",
        category: ["battle-royale", "mobile"],
        genre: "Action"
    },

    "Garena Undawn": {
        slug: "undawn",
        icon: "fa-skull",
        css: "game-undawn",
        category: ["other", "mobile"],
        genre: "Survival"
    },

    "Speed Drifters": {
        slug: "speed-drifters",
        icon: "fa-car",
        css: "game-speed-drifters",
        category: ["other", "mobile"],
        genre: "Racing"
    }

};


// ==========================================
// 05. START PAGE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeGamesPage
);


async function initializeGamesPage() {

    try {

        initializeButtons();

        initializeSearch();

        initializeCategories();

        initializeResetButton();

        initializeNavigation();

        // LOGIN CHECK

        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {

            window.location.replace("login.html");

            return;

        }

        // LOAD GAMES

        await loadGames();

        console.log(
            "BIG STORE Games Page Loaded Successfully."
        );

    } catch (error) {

        console.error(
            "Games Initialization Error:",
            error
        );

        showGameError(
            "Unable to load games. Please refresh the page."
        );

    }

}


// ==========================================
// 06. LOAD GAMES FROM SUPABASE
// ==========================================

async function loadGames() {

    gamesGrid.innerHTML = `
        <div class="game-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading Games...</p>
        </div>
    `;

    const { data, error } = await supabase

        .from("products")

        .select(
            "id, product_name, category, description, image_url, price, is_active"
        )

        .eq("category", "game")

        .order("product_name", {
            ascending: true
        });


    if (error) {

        throw error;

    }


    allGames = data || [];

    renderGames();

}


// ==========================================
// 07. RENDER GAME CARDS
// ==========================================

function renderGames() {

    gamesGrid.innerHTML = "";

    const filteredGames = allGames.filter(game => {

        const name =
            (game.product_name || "").toLowerCase();

        const config =
            gameConfig[game.product_name] || {
                category: ["other"]
            };

        const matchesSearch =
            name.includes(searchText);

        const matchesCategory =
            activeCategory === "all" ||
            config.category.includes(activeCategory);

        return matchesSearch && matchesCategory;

    });


    // UPDATE COUNT

    if (gamesCount) {

        gamesCount.textContent =
            `${filteredGames.length} ${
                filteredGames.length === 1 ? "Game" : "Games"
            }`;

    }


    // EMPTY RESULT

    if (filteredGames.length === 0) {

        gamesGrid.style.display = "none";

        noGamesFound.style.display = "block";

        return;

    }


    gamesGrid.style.display = "grid";

    noGamesFound.style.display = "none";


    filteredGames.forEach(game => {

        const card = createGameCard(game);

        gamesGrid.appendChild(card);

    });

}


// ==========================================
// 08. CREATE GAME CARD
// ==========================================

function createGameCard(game) {

    const config =
        gameConfig[game.product_name] || {
            slug: "unknown",
            icon: "fa-gamepad",
            css: "",
            category: ["other"],
            genre: "Gaming"
        };

    const isActive =
        game.is_active === true;

    const card =
        document.createElement("article");

    card.className =
        `game-card ${isActive ? "" : "disabled"}`;


    card.dataset.name =
        game.product_name.toLowerCase();

    card.dataset.category =
        config.category.join(" ");


    // GAME LINK

    const link =
        document.createElement("a");

    link.className = "game-card-link";


    if (isActive) {

        link.href =
            `game-details.html?game=${encodeURIComponent(config.slug)}`;

    } else {

        link.href = "#";

        link.addEventListener("click", event => {

            event.preventDefault();

            showGameToast(
                `${game.product_name} is coming soon!`
            );

        });

    }


    // IMAGE

    const image =
        document.createElement("div");

    image.className =
        `game-image ${config.css}`;


    if (game.image_url) {

        const img =
            document.createElement("img");

        img.className = "game-card-image";

        img.src = game.image_url;

        img.alt = game.product_name;

        img.loading = "lazy";

        img.onerror = () => {

            img.remove();

        };

        image.appendChild(img);

    }


    // ICON

    const icon =
        document.createElement("div");

    icon.className = "game-image-icon";

    icon.innerHTML =
        `<i class="fas ${config.icon}"></i>`;

    image.appendChild(icon);


    // STATUS BADGE

    const badge =
        document.createElement("span");

    badge.className =
        `game-label ${isActive ? "popular" : "soon"}`;

    badge.textContent =
        isActive ? "POPULAR" : "COMING SOON";

    image.appendChild(badge);


    // GAME INFO

    const info =
        document.createElement("div");

    info.className = "game-info";


    // TITLE

    const titleRow =
        document.createElement("div");

    titleRow.className = "game-title-row";


    const title =
        document.createElement("h3");

    title.textContent =
        game.product_name;


    const arrow =
        document.createElement("i");

    arrow.className =
        isActive
            ? "fas fa-arrow-up-right-from-square"
            : "fas fa-lock";


    titleRow.appendChild(title);

    titleRow.appendChild(arrow);


    // DESCRIPTION

    const description =
        document.createElement("p");

    description.textContent =
        game.description || config.genre;


    // BOTTOM

    const bottom =
        document.createElement("div");

    bottom.className = "game-card-bottom";


    const genre =
        document.createElement("span");

    genre.innerHTML =
        `<i class="fas fa-gamepad"></i> `;

    genre.appendChild(
        document.createTextNode(config.genre)
    );


    const status =
        document.createElement("span");

    status.className =
        `game-status ${isActive ? "available" : "coming-soon"}`;

    status.textContent =
        isActive ? "Available" : "Coming Soon";


    bottom.appendChild(genre);

    bottom.appendChild(status);


    info.appendChild(titleRow);

    info.appendChild(description);

    info.appendChild(bottom);


    link.appendChild(image);

    link.appendChild(info);

    card.appendChild(link);


    return card;

}


// ==========================================
// 09. SEARCH
// ==========================================

function initializeSearch() {

    if (!gameSearch) return;

    gameSearch.addEventListener("input", () => {

        searchText =
            gameSearch.value.trim().toLowerCase();

        renderGames();

        updateClearButton();

    });

}


function updateClearButton() {

    if (!clearGameSearch) return;

    clearGameSearch.style.display =
        gameSearch.value.length > 0
            ? "grid"
            : "none";

}


if (clearGameSearch) {

    clearGameSearch.addEventListener("click", () => {

        gameSearch.value = "";

        searchText = "";

        renderGames();

        updateClearButton();

        gameSearch.focus();

    });

}


// ==========================================
// 10. CATEGORY FILTER
// ==========================================

function initializeCategories() {

    categoryButtons.forEach(button => {

        button.addEventListener("click", () => {

            categoryButtons.forEach(btn => {

                btn.classList.remove("active");

            });

            button.classList.add("active");

            activeCategory =
                button.dataset.category || "all";

            renderGames();

        });

    });

}


// ==========================================
// 11. RESET SEARCH
// ==========================================

function initializeResetButton() {

    if (!resetGameSearch) return;

    resetGameSearch.addEventListener("click", () => {

        gameSearch.value = "";

        searchText = "";

        activeCategory = "all";

        categoryButtons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category === "all"
            );

        });

        updateClearButton();

        renderGames();

    });

}


// ==========================================
// 12. BUTTONS
// ==========================================

function initializeButtons() {

    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            window.location.href =
                "notifications.html";

        });

    }


    if (profileBtn) {

        profileBtn.addEventListener("click", () => {

            window.location.href =
                "profile.html";

        });

    }

}


// ==========================================
// 13. BOTTOM NAVIGATION
// ==========================================

function initializeNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase() || "index.html";

    const navItems =
        document.querySelectorAll(
            ".big-store-bottom-nav .nav-item"
        );

    navItems.forEach(item => {

        const link =
            item.getAttribute("href") || "";

        item.classList.toggle(
            "active",
            link.toLowerCase() === currentPage
        );

    });

}


// ==========================================
// 14. TOAST
// ==========================================

function showGameToast(message) {

    const oldToast =
        document.querySelector(".game-toast");

    if (oldToast) oldToast.remove();


    const toast =
        document.createElement("div");

    toast.className = "game-toast";


    const icon =
        document.createElement("i");

    icon.className =
        "fas fa-info-circle";


    const text =
        document.createElement("span");

    text.textContent = message;


    toast.appendChild(icon);

    toast.appendChild(text);


    document.body.appendChild(toast);


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

        maxWidth: "90%"

    });


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transition =
            "opacity 0.3s ease";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2500);

}


// ==========================================
// 15. ERROR DISPLAY
// ==========================================

function showGameError(message) {

    if (!gamesGrid) return;

    gamesGrid.style.display = "grid";

    gamesGrid.innerHTML = "";


    const error =
        document.createElement("div");

    error.className = "game-error";


    const icon =
        document.createElement("i");

    icon.className =
        "fas fa-triangle-exclamation";


    const text =
        document.createElement("p");

    text.textContent = message;


    const button =
        document.createElement("button");

    button.textContent = "Try Again";

    button.addEventListener("click", () => {

        window.location.reload();

    });


    error.appendChild(icon);

    error.appendChild(text);

    error.appendChild(button);


    gamesGrid.appendChild(error);

}


// ==========================================
// 16. AUTH STATE
// ==========================================

supabase.auth.onAuthStateChange((event) => {

    if (event === "SIGNED_OUT") {

        window.location.replace("login.html");

    }

});