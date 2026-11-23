/* ==========================================
   BIG STORE - HISTORY SYSTEM
   SUPABASE INTEGRATION
========================================== */

import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ==========================================
   SUPABASE CONFIGURATION
========================================== */

const SUPABASE_URL =
"https://zzxzrrntyvqbhyzuhaso.supabase.co";

const SUPABASE_KEY =
"sb_publishable_7NpKLvkhQsF3LvPsrXNQdg_z6mIRnDO";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================
   DOM ELEMENTS
========================================== */

const transactionList =
document.getElementById("transactionList");

const historyLoading =
document.getElementById("historyLoading");

const historyEmpty =
document.getElementById("historyEmpty");

const historyError =
document.getElementById("historyError");

const historyErrorMessage =
document.getElementById("historyErrorMessage");

const historySearch =
document.getElementById("historySearch");

const clearHistorySearch =
document.getElementById("clearHistorySearch");

const statusFilter =
document.getElementById("statusFilter");

const historyTabs =
document.querySelectorAll(".history-tab");

const totalOrdersElement =
document.getElementById("totalOrders");

const successfulOrdersElement =
document.getElementById("successfulOrders");

const pendingOrdersElement =
document.getElementById("pendingOrders");

const pagination =
document.getElementById("historyPagination");

const previousPage =
document.getElementById("previousPage");

const nextPage =
document.getElementById("nextPage");

const pageInfo =
document.getElementById("pageInfo");

const retryHistoryBtn =
document.getElementById("retryHistoryBtn");


/* ==========================================
   STATE
========================================== */

let currentUser = null;

let allTransactions = [];

let filteredTransactions = [];

let currentTab = "all";

let currentPage = 1;

const ITEMS_PER_PAGE = 10;


/* ==========================================
   HELPER FUNCTIONS
========================================== */

function showLoading() {

    historyLoading.hidden = false;

    historyEmpty.hidden = true;

    historyError.hidden = true;

    pagination.hidden = true;

}


function hideLoading() {

    historyLoading.hidden = true;

}


function showError(message) {

    hideLoading();

    historyEmpty.hidden = true;

    historyError.hidden = false;

    pagination.hidden = true;

    historyErrorMessage.textContent = message;

}


function formatCurrency(amount) {

    const number = Number(amount);

    if (!Number.isFinite(number)) {
        return "LKR 0.00";
    }

    return "LKR " + number.toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-LK", {

        year: "numeric",

        month: "short",

        day: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    });

}


function normalizeStatus(status) {

    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (
        ["success", "successful", "completed", "complete", "approved", "paid"].includes(value)
    ) {
        return "success";
    }

    if (
        ["pending", "processing", "waiting", "in_progress"].includes(value)
    ) {
        return "pending";
    }

    if (
        ["failed", "failure", "rejected", "cancelled", "canceled", "error"].includes(value)
    ) {
        return "failed";
    }

    return "pending";

}


function getAmount(item) {

    return Number(
        item.amount ??
        item.total_amount ??
        item.price ??
        item.wallet_amount ??
        0
    );

}


function getTransactionId(item) {

    return (
        item.transaction_id ??
        item.order_id ??
        item.reference_id ??
        item.id ??
        "N/A"
    );

}


/* ==========================================
   LOAD AUTHENTICATED USER
========================================== */

async function checkUser() {

    const {
        data: {
            session
        },
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session || !session.user) {

        window.location.href = "login.html";

        return null;

    }

    currentUser = session.user;

    return currentUser;

}


/* ==========================================
   LOAD ORDERS
========================================== */

async function loadOrders() {

    const {
        data,
        error
    } = await supabase

        .from("orders")

        .select("*")

        .eq("user_id", currentUser.id)

        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Orders Loading Error:", error);

        throw new Error(
            "Unable to load your orders. Check the orders table and its RLS policies."
        );

    }

    return (data || []).map(order => ({

        ...order,

        history_type: "order",

        history_date: order.created_at,

        history_status: normalizeStatus(order.status),

        history_amount: getAmount(order),

        history_title:
            order.product_name ??
            order.game_name ??
            order.product ??
            "Game Top-Up Order",

        history_id: getTransactionId(order)

    }));

}


/* ==========================================
   LOAD WALLET TRANSACTIONS
========================================== */

async function loadWalletTransactions() {

    const {
        data,
        error
    } = await supabase

        .from("transactions")

        .select("*")

        .eq("user_id", currentUser.id)

        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Wallet Transactions Error:", error);

        throw new Error(
            "Unable to load wallet transactions. Check the transactions table and its RLS policies."
        );

    }

    return (data || []).map(transaction => ({

        ...transaction,

        history_type: "wallet",

        history_date: transaction.created_at,

        history_status: normalizeStatus(transaction.status),

        history_amount: getAmount(transaction),

        history_title:
            transaction.description ??
            transaction.transaction_type ??
            transaction.type ??
            "Wallet Transaction",

        history_id: getTransactionId(transaction)

    }));

}


/* ==========================================
   LOAD ALL HISTORY
========================================== */

async function loadHistory() {

    showLoading();

    try {

        await checkUser();

        if (!currentUser) {
            return;
        }

        const [
            orders,
            walletTransactions
        ] = await Promise.all([

            loadOrders(),

            loadWalletTransactions()

        ]);


        allTransactions = [

            ...orders,

            ...walletTransactions

        ];


        allTransactions.sort((a, b) => {

            return new Date(b.history_date || 0) -
                   new Date(a.history_date || 0);

        });


        updateSummary(orders, walletTransactions);

        applyFilters();

        hideLoading();

        console.log(
            "BIG STORE History Loaded Successfully!",
            allTransactions
        );

    }

    catch (error) {

        console.error("History Error:", error);

        showError(
            error.message || "Unable to load transaction history."
        );

    }

}


/* ==========================================
   UPDATE SUMMARY
========================================== */

function updateSummary(orders, walletTransactions) {

    const successful = orders.filter(item => {

        return normalizeStatus(item.status) === "success";

    }).length;


    const pending = orders.filter(item => {

        return normalizeStatus(item.status) === "pending";

    }).length;


    totalOrdersElement.textContent = orders.length;

    successfulOrdersElement.textContent = successful;

    pendingOrdersElement.textContent = pending;

}


/* ==========================================
   APPLY FILTERS
========================================== */

function applyFilters() {

    const searchValue = historySearch.value
        .trim()
        .toLowerCase();

    const selectedStatus = statusFilter.value;


    filteredTransactions = allTransactions.filter(item => {


        /* TAB FILTER */

        if (
            currentTab !== "all" &&
            item.history_type !== (
                currentTab === "orders" ? "order" : "wallet"
            )
        ) {

            return false;

        }


        /* STATUS FILTER */

        if (
            selectedStatus !== "all" &&
            item.history_status !== selectedStatus
        ) {

            return false;

        }


        /* SEARCH FILTER */

        if (searchValue) {

            const searchableText = [

                item.history_id,

                item.history_title,

                item.history_type,

                item.status,

                item.transaction_type,

                item.type

            ].join(" ").toLowerCase();

            if (!searchableText.includes(searchValue)) {

                return false;

            }

        }

        return true;

    });


    currentPage = 1;

    renderTransactions();

}


/* ==========================================
   RENDER TRANSACTIONS
========================================== */

function renderTransactions() {

    transactionList.querySelectorAll(
        ".transaction-card"
    ).forEach(card => card.remove());


    const totalItems = filteredTransactions.length;


    if (totalItems === 0) {

        historyEmpty.hidden = false;

        pagination.hidden = true;

        return;

    }


    historyEmpty.hidden = true;


    const totalPages = Math.ceil(
        totalItems / ITEMS_PER_PAGE
    );


    const startIndex =
        (currentPage - 1) * ITEMS_PER_PAGE;


    const endIndex =
        startIndex + ITEMS_PER_PAGE;


    const pageItems = filteredTransactions.slice(
        startIndex,
        endIndex
    );


    pageItems.forEach(item => {

        const card = createTransactionCard(item);

        transactionList.appendChild(card);

    });


    updatePagination(totalPages);

}


/* ==========================================
   CREATE TRANSACTION CARD
========================================== */

function createTransactionCard(item) {

    const card = document.createElement("div");

    card.className = "transaction-card";


    const isOrder =
        item.history_type === "order";


    const icon = isOrder
        ? "fa-gamepad"
        : "fa-wallet";


    const status = item.history_status;


    const statusLabel = {

        success: "Successful",

        pending: "Pending",

        failed: "Failed"

    }[status];


    const amount = formatCurrency(
        item.history_amount
    );


    const transactionTitle =
        item.history_title || "Transaction";


    const transactionDate =
        formatDate(item.history_date);


    const transactionId =
        item.history_id;


    const amountPrefix = isOrder ? "-" : "";


    card.innerHTML = `

        <div class="transaction-icon">

            <i class="fas ${icon}"></i>

        </div>


        <div class="transaction-details">

            <h3></h3>

            <p class="transaction-id"></p>


            <span class="transaction-status status-${status}">

                <i class="fas ${
                    status === "success"
                    ? "fa-circle-check"
                    : status === "failed"
                    ? "fa-circle-xmark"
                    : "fa-clock"
                }"></i>

                ${statusLabel}

            </span>

        </div>


        <div class="transaction-right">

            <span class="transaction-amount"></span>

            <span class="transaction-date"></span>

        </div>

    `;


    card.querySelector(
        ".transaction-details h3"
    ).textContent = transactionTitle;


    card.querySelector(
        ".transaction-id"
    ).textContent = "ID: " + transactionId;


    card.querySelector(
        ".transaction-amount"
    ).textContent = amountPrefix + amount;


    card.querySelector(
        ".transaction-date"
    ).textContent = transactionDate;


    return card;

}


/* ==========================================
   PAGINATION
========================================== */

function updatePagination(totalPages) {

    if (totalPages <= 1) {

        pagination.hidden = true;

        return;

    }


    pagination.hidden = false;


    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;


    previousPage.disabled =
        currentPage <= 1;


    nextPage.disabled =
        currentPage >= totalPages;

}


/* ==========================================
   TAB EVENTS
========================================== */

historyTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        historyTabs.forEach(item => {

            item.classList.remove("active");

        });


        tab.classList.add("active");


        currentTab = tab.dataset.tab;


        applyFilters();

    });

});


/* ==========================================
   SEARCH EVENTS
========================================== */

historySearch.addEventListener(
    "input",
    () => {

        clearHistorySearch.classList.toggle(
            "visible",
            historySearch.value.length > 0
        );

        applyFilters();

    }
);


clearHistorySearch.addEventListener(
    "click",
    () => {

        historySearch.value = "";

        clearHistorySearch.classList.remove(
            "visible"
        );

        applyFilters();

    }
);


/* ==========================================
   STATUS FILTER EVENT
========================================== */

statusFilter.addEventListener(
    "change",
    applyFilters
);


/* ==========================================
   PAGINATION EVENTS
========================================== */

previousPage.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            renderTransactions();

        }

    }
);


nextPage.addEventListener(
    "click",
    () => {

        const totalPages = Math.ceil(
            filteredTransactions.length /
            ITEMS_PER_PAGE
        );


        if (currentPage < totalPages) {

            currentPage++;

            renderTransactions();

        }

    }
);


/* ==========================================
   RETRY BUTTON
========================================== */

retryHistoryBtn.addEventListener(
    "click",
    loadHistory
);


/* ==========================================
   HEADER BUTTONS
========================================== */

document.getElementById(
    "notificationBtn"
).addEventListener("click", () => {

    console.log("Notifications clicked");

});


document.getElementById(
    "profileBtn"
).addEventListener("click", () => {

    window.location.href = "profile.html";

});


/* ==========================================
   BOTTOM NAV ACTIVE PAGE
========================================== */

function setupBottomNavigation() {

    const currentPage =
        window.location.pathname
        .split("/")
        .pop()
        .toLowerCase() || "index.html";


    document.querySelectorAll(
        ".big-store-bottom-nav .nav-item"
    ).forEach(item => {

        const link = item.getAttribute("href");

        if (!link) return;

        item.classList.toggle(
            "active",
            link.toLowerCase() === currentPage
        );

    });

}


/* ==========================================
   AUTH STATE
========================================== */

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            window.location.href = "login.html";

        }

    }
);


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupBottomNavigation();

        await loadHistory();

    }
);