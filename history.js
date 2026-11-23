// ==========================================
// BIG STORE - TRANSACTION HISTORY
// SUPABASE INTEGRATION
// ==========================================

import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
"https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_KEY =
"sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// DOM ELEMENTS
// ==========================================

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


// ==========================================
// STATE
// ==========================================

let currentUser = null;

let allTransactions = [];

let filteredTransactions = [];

let currentTab = "all";

let currentPage = 1;

const ITEMS_PER_PAGE = 10;


// ==========================================
// HELPERS
// ==========================================

function showLoading() {

    historyLoading.hidden = false;
    historyEmpty.hidden = true;
    historyError.hidden = true;
    pagination.hidden = true;

    transactionList
        .querySelectorAll(".transaction-card")
        .forEach(card => card.remove());

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

    return "LKR " + Math.abs(number).toLocaleString(
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


// ==========================================
// NORMALIZE STATUS
// ==========================================

function normalizeStatus(status) {

    const value = String(status || "")
        .trim()
        .toLowerCase();

    if ([
        "success",
        "successful",
        "completed",
        "complete",
        "approved",
        "paid"
    ].includes(value)) {

        return "success";

    }

    if ([
        "pending",
        "processing",
        "waiting",
        "in_progress"
    ].includes(value)) {

        return "pending";

    }

    if ([
        "failed",
        "failure",
        "rejected",
        "cancelled",
        "canceled",
        "error"
    ].includes(value)) {

        return "failed";

    }

    return "pending";

}


// ==========================================
// GET AUTHENTICATED USER
// ==========================================

async function checkUser() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!data.session) {

        window.location.href = "login.html";

        return null;

    }

    currentUser = data.session.user;

    return currentUser;

}


// ==========================================
// LOAD ALL ROWS
// Handles Supabase pagination
// ==========================================

async function loadAllRows(tableName) {

    const PAGE_SIZE = 1000;

    let results = [];

    let start = 0;

    while (true) {

        const {
            data,
            error
        } = await supabase

            .from(tableName)

            .select("*")

            .eq("user_id", currentUser.id)

            .order("created_at", {
                ascending: false
            })

            .range(start, start + PAGE_SIZE - 1);


        if (error) {

            console.error(
                tableName + " Error:",
                error
            );

            throw error;

        }

        results = results.concat(data || []);

        if (!data || data.length < PAGE_SIZE) {
            break;
        }

        start += PAGE_SIZE;

    }

    return results;

}


// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {

    const orders = await loadAllRows("orders");

    return orders.map(order => ({

        ...order,

        history_type: "order",

        history_date: order.created_at,

        history_status: normalizeStatus(order.status),

        history_amount: Number(order.amount || 0),

        history_title:
            order.product_name ||
            order.game_name ||
            "Game Top-Up Order",

        history_id:
            order.order_number ||
            order.id,

        history_direction: "debit"

    }));

}


// ==========================================
// LOAD WALLET REQUESTS
// ==========================================

async function loadWalletRequests() {

    const requests = await loadAllRows(
        "wallet_requests"
    );

    return requests.map(request => {

        const method = String(
            request.payment_method || "Wallet"
        ).replaceAll("_", " ");

        const bank = request.bank_name
            ? " - " + request.bank_name
            : "";

        return {

            ...request,

            history_type: "wallet",

            history_date: request.created_at,

            history_status: normalizeStatus(
                request.status
            ),

            history_amount: Number(
                request.amount || 0
            ),

            history_title:
                method + bank + " Deposit",

            history_id:
                request.transaction_id ||
                request.id,

            history_direction: "credit",

            history_subtitle:
                "Wallet Deposit Request"

        };

    });

}


// ==========================================
// LOAD WALLET TRANSACTIONS
// ==========================================

async function loadWalletTransactions() {

    const transactions = await loadAllRows(
        "wallet_transactions"
    );

    return transactions.map(transaction => {

        const type = String(
            transaction.transaction_type || ""
        ).toLowerCase();

        const isDebit = [

            "debit",
            "withdrawal",
            "withdraw",
            "purchase",
            "order",
            "deduction",
            "spent"

        ].some(word => type.includes(word));


        return {

            ...transaction,

            history_type: "wallet",

            history_date: transaction.created_at,

            // A wallet transaction is already recorded.
            history_status: "success",

            history_amount: Number(
                transaction.amount || 0
            ),

            history_title:
                transaction.description ||
                transaction.transaction_type ||
                "Wallet Transaction",

            history_id: transaction.id,

            history_direction:
                isDebit ? "debit" : "credit",

            history_subtitle:
                transaction.transaction_type || "Wallet"

        };

    });

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary(orders) {

    const successful = orders.filter(order => {

        return order.history_status === "success";

    }).length;


    const pending = orders.filter(order => {

        return order.history_status === "pending";

    }).length;


    totalOrdersElement.textContent =
        orders.length;


    successfulOrdersElement.textContent =
        successful;


    pendingOrdersElement.textContent =
        pending;

}


// ==========================================
// LOAD ALL HISTORY
// ==========================================

async function loadHistory() {

    showLoading();

    try {

        await checkUser();

        if (!currentUser) {
            return;
        }


        const [

            orders,
            walletRequests,
            walletTransactions

        ] = await Promise.all([

            loadOrders(),

            loadWalletRequests(),

            loadWalletTransactions()

        ]);


        // Avoid showing an approved deposit twice.
        // The wallet transaction has request_id
        // pointing to the original wallet request.

        const processedRequestIds = new Set(

            walletTransactions

                .map(item => item.request_id)

                .filter(Boolean)

        );


        const uniqueWalletRequests =
            walletRequests.filter(request => {

                return !processedRequestIds.has(
                    request.id
                );

            });


        allTransactions = [

            ...orders,

            ...uniqueWalletRequests,

            ...walletTransactions

        ];


        allTransactions.sort((a, b) => {

            return new Date(b.history_date || 0) -
                   new Date(a.history_date || 0);

        });


        updateSummary(orders);

        applyFilters();

        hideLoading();


        console.log(
            "BIG STORE History Loaded Successfully",
            allTransactions
        );

    }

    catch (error) {

        console.error(
            "History Loading Error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your transaction history."
        );

    }

}


// ==========================================
// APPLY FILTERS
// ==========================================

function applyFilters() {

    const searchValue = historySearch.value
        .trim()
        .toLowerCase();

    const selectedStatus = statusFilter.value;


    filteredTransactions = allTransactions.filter(item => {


        // TAB FILTER

        if (

            currentTab !== "all" &&

            item.history_type !== (

                currentTab === "orders"
                    ? "order"
                    : "wallet"

            )

        ) {

            return false;

        }


        // STATUS FILTER

        if (

            selectedStatus !== "all" &&

            item.history_status !== selectedStatus

        ) {

            return false;

        }


        // SEARCH FILTER

        if (searchValue) {

            const searchableText = [

                item.history_id,

                item.history_title,

                item.history_type,

                item.status,

                item.transaction_type,

                item.transaction_id,

                item.order_number,

                item.player_id,

                item.description

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


// ==========================================
// CREATE TRANSACTION CARD
// ==========================================

function createTransactionCard(item) {

    const card = document.createElement("div");

    card.className = "transaction-card";


    const isOrder =
        item.history_type === "order";


    const status = item.history_status;


    const statusLabels = {

        success: "Successful",

        pending: "Pending",

        failed: "Failed"

    };


    const icon = isOrder
        ? "fa-gamepad"
        : "fa-wallet";


    const iconStatus = {

        success: "fa-circle-check",

        pending: "fa-clock",

        failed: "fa-circle-xmark"

    };


    const direction =
        item.history_direction || "credit";


    const amountPrefix =
        direction === "debit" ? "-" : "+";


    const title = document.createElement("h3");

    title.textContent =
        item.history_title || "Transaction";


    const transactionId = document.createElement("p");

    transactionId.className = "transaction-id";

    transactionId.textContent =
        "ID: " + (item.history_id || "N/A");


    const statusBadge = document.createElement("span");

    statusBadge.className =
        "transaction-status status-" + status;


    const statusIcon = document.createElement("i");

    statusIcon.className =
        "fas " + iconStatus[status];


    statusBadge.appendChild(statusIcon);

    statusBadge.appendChild(
        document.createTextNode(
            " " + statusLabels[status]
        )
    );


    const details = document.createElement("div");

    details.className = "transaction-details";

    details.appendChild(title);

    details.appendChild(transactionId);

    details.appendChild(statusBadge);


    const transactionIcon = document.createElement("div");

    transactionIcon.className = "transaction-icon";


    const iconElement = document.createElement("i");

    iconElement.className = "fas " + icon;


    transactionIcon.appendChild(iconElement);


    const right = document.createElement("div");

    right.className = "transaction-right";


    const amount = document.createElement("span");

    amount.className = "transaction-amount";

    amount.textContent =
        amountPrefix + formatCurrency(
            item.history_amount
        );


    const date = document.createElement("span");

    date.className = "transaction-date";

    date.textContent =
        formatDate(item.history_date);


    right.appendChild(amount);

    right.appendChild(date);


    card.appendChild(transactionIcon);

    card.appendChild(details);

    card.appendChild(right);


    return card;

}


// ==========================================
// RENDER TRANSACTIONS
// ==========================================

function renderTransactions() {

    transactionList

        .querySelectorAll(".transaction-card")

        .forEach(card => card.remove());


    const totalItems =
        filteredTransactions.length;


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


    const pageItems =

        filteredTransactions.slice(

            startIndex,

            startIndex + ITEMS_PER_PAGE

        );


    pageItems.forEach(item => {

        transactionList.appendChild(

            createTransactionCard(item)

        );

    });


    updatePagination(totalPages);

}


// ==========================================
// PAGINATION
// ==========================================

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


// ==========================================
// TAB EVENTS
// ==========================================

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


// ==========================================
// SEARCH EVENTS
// ==========================================

historySearch.addEventListener("input", () => {

    clearHistorySearch.classList.toggle(

        "visible",

        historySearch.value.length > 0

    );


    applyFilters();

});


clearHistorySearch.addEventListener("click", () => {

    historySearch.value = "";

    clearHistorySearch.classList.remove("visible");

    applyFilters();

});


// ==========================================
// STATUS FILTER
// ==========================================

statusFilter.addEventListener(
    "change",
    applyFilters
);


// ==========================================
// PAGINATION EVENTS
// ==========================================

previousPage.addEventListener("click", () => {

    if (currentPage > 1) {

        currentPage--;

        renderTransactions();

    }

});


nextPage.addEventListener("click", () => {

    const totalPages = Math.ceil(

        filteredTransactions.length /
        ITEMS_PER_PAGE

    );


    if (currentPage < totalPages) {

        currentPage++;

        renderTransactions();

    }

});


// ==========================================
// RETRY BUTTON
// ==========================================

retryHistoryBtn.addEventListener(
    "click",
    loadHistory
);


// ==========================================
// HEADER BUTTONS
// ==========================================

document.getElementById(
    "notificationBtn"
).addEventListener("click", () => {

    window.location.href = "notifications.html";

});


document.getElementById(
    "profileBtn"
).addEventListener("click", () => {

    window.location.href = "profile.html";

});


// ==========================================
// BOTTOM NAVIGATION
// ==========================================

function setupBottomNavigation() {

    const currentFile =

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

            link.toLowerCase() === currentFile

        );

    });

}


// ==========================================
// AUTH STATE
// ==========================================

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


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupBottomNavigation();

        await loadHistory();

    }
);