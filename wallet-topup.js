/* =====================================================
   BIG STORE - REAL WALLET TOPUP
   SUPABASE INTEGRATION
===================================================== */

import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =====================================================
   SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL =
"https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_KEY =
"sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =====================================================
   DOM ELEMENTS
===================================================== */

const depositAmount =
document.getElementById("depositAmount");

const bankMethod =
document.getElementById("bankMethod");

const ezcashMethod =
document.getElementById("ezcashMethod");

const binanceMethod =
document.getElementById("binanceMethod");

const bankDetailsPanel =
document.getElementById("bankDetailsPanel");

const ezcashDetailsPanel =
document.getElementById("ezcashDetailsPanel");

const binanceDetailsPanel =
document.getElementById("binanceDetailsPanel");

const selectedBank =
document.getElementById("selectedBank");

const bankDisplayName =
document.getElementById("bankDisplayName");

const bankAccountName =
document.getElementById("bankAccountName");

const bankAccountNumber =
document.getElementById("bankAccountNumber");

const bankBranch =
document.getElementById("bankBranch");

const bankReceipt =
document.getElementById("bankReceipt");

const ezcashReceipt =
document.getElementById("ezcashReceipt");

const binanceReceipt =
document.getElementById("binanceReceipt");

const bankReceiptPreview =
document.getElementById("bankReceiptPreview");

const ezcashReceiptPreview =
document.getElementById("ezcashReceiptPreview");

const binanceReceiptPreview =
document.getElementById("binanceReceiptPreview");

const cryptoTransactionId =
document.getElementById("cryptoTransactionId");

const submitDepositBtn =
document.getElementById("submitDepositBtn");

const walletBalance =
document.getElementById("walletBalance");

const depositHistoryList =
document.getElementById("depositHistoryList");

const walletToast =
document.getElementById("walletToast");

const walletToastMessage =
document.getElementById("walletToastMessage");


/* =====================================================
   CURRENT USER
===================================================== */

let currentUser = null;

let currentPaymentMethod = "bank";

let toastTimer;


/* =====================================================
   PAYMENT DETAILS
===================================================== */

const bankDetails = {

    BOC: {

        name: "Bank of Ceylon",

        accountName: "JOYTHAS K",

        accountNumber: "96644532",

        branch: "THIRUKKOVIL"

    },

    HNB: {

        name: "Hatton National Bank",

        accountName: "JOYTHAS K",

        accountNumber: "134020110640",

        branch: "THIRUKKOVIL"

    }

};


/* =====================================================
   TOAST
===================================================== */

function showToast(message, type = "info") {

    if (!walletToast || !walletToastMessage) {

        alert(message);

        return;

    }

    const icon = walletToast.querySelector("i");

    walletToastMessage.textContent = message;

    if (icon) {

        if (type === "success") {

            icon.className = "fas fa-check-circle";

        } else if (type === "error") {

            icon.className = "fas fa-exclamation-circle";

        } else {

            icon.className = "fas fa-info-circle";

        }

    }

    walletToast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        walletToast.classList.remove("show");

    }, 3500);

}


/* =====================================================
   AUTHENTICATION
===================================================== */

async function checkAuthentication() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {

        console.error(error);

        showToast("Unable to verify login.", "error");

        return false;

    }

    currentUser = data.session?.user || null;

    if (!currentUser) {

        window.location.replace("login.html");

        return false;

    }

    return true;

}


/* =====================================================
   LOAD WALLET BALANCE
===================================================== */

async function loadWalletBalance() {

    if (!currentUser) return;

    const { data, error } = await supabase

        .from("profiles")

        .select("wallet_balance")

        .eq("id", currentUser.id)

        .single();


    if (error) {

        console.error("Balance Error:", error);

        showToast("Unable to load wallet balance.", "error");

        return;

    }


    const balance = Number(data.wallet_balance || 0);

    walletBalance.textContent =

        "LKR " + balance.toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* =====================================================
   PAYMENT METHOD SELECTION
===================================================== */

function selectPaymentMethod(method) {

    currentPaymentMethod = method;

    document.querySelectorAll(".payment-method").forEach(button => {

        button.classList.remove("active");

    });

    bankDetailsPanel.hidden = true;

    ezcashDetailsPanel.hidden = true;

    binanceDetailsPanel.hidden = true;


    if (method === "bank") {

        bankMethod.classList.add("active");

        bankDetailsPanel.hidden = false;

    }


    if (method === "ezcash") {

        ezcashMethod.classList.add("active");

        ezcashDetailsPanel.hidden = false;

    }


    if (method === "binance") {

        binanceMethod.classList.add("active");

        binanceDetailsPanel.hidden = false;

    }

}


bankMethod.addEventListener("click", () => {

    selectPaymentMethod("bank");

});

ezcashMethod.addEventListener("click", () => {

    selectPaymentMethod("ezcash");

});

binanceMethod.addEventListener("click", () => {

    selectPaymentMethod("binance");

});


/* =====================================================
   BANK DETAILS
===================================================== */

function updateBankDetails() {

    const bank = bankDetails[selectedBank.value];

    if (!bank) {

        bankDisplayName.textContent = "Select a Bank";

        bankAccountName.textContent = "-";

        bankAccountNumber.textContent = "-";

        bankBranch.textContent = "-";

        return;

    }

    bankDisplayName.textContent = bank.name;

    bankAccountName.textContent = bank.accountName;

    bankAccountNumber.textContent = bank.accountNumber;

    bankBranch.textContent = bank.branch;

}

selectedBank.addEventListener("change", updateBankDetails);


/* =====================================================
   COPY BUTTONS
===================================================== */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast("Copied successfully!", "success");

    } catch (error) {

        const textarea = document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        showToast("Copied successfully!", "success");

    }

}


document.querySelectorAll("[data-copy]").forEach(button => {

    button.addEventListener("click", () => {

        const target = document.getElementById(
            button.dataset.copy
        );

        if (!target) return;

        copyText(target.textContent.trim());

    });

});


/* =====================================================
   QUICK AMOUNT
===================================================== */

document.querySelectorAll(".amount-btn").forEach(button => {

    button.addEventListener("click", () => {

        const amount = Number(button.dataset.amount);

        depositAmount.value = amount;

        document.querySelectorAll(".amount-btn").forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

    });

});


depositAmount.addEventListener("input", () => {

    document.querySelectorAll(".amount-btn").forEach(button => {

        button.classList.remove("active");

    });

});


/* =====================================================
   RECEIPT PREVIEW
===================================================== */

function setupReceiptPreview(input, preview) {

    input.addEventListener("change", () => {

        preview.innerHTML = "";

        preview.classList.remove("visible");

        const file = input.files?.[0];

        if (!file) return;


        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp",

            "application/pdf"

        ];


        if (!allowedTypes.includes(file.type)) {

            input.value = "";

            showToast("Unsupported file type.", "error");

            return;

        }


        if (file.size > 5 * 1024 * 1024) {

            input.value = "";

            showToast("Maximum file size is 5 MB.", "error");

            return;

        }


        const info = document.createElement("div");

        info.className = "receipt-file-info";


        const title = document.createElement("strong");

        title.textContent = file.name;


        const size = document.createElement("small");

        size.textContent =

            (file.size / 1024 / 1024).toFixed(2) + " MB";


        info.appendChild(title);

        info.appendChild(size);


        if (file.type.startsWith("image/")) {

            const image = document.createElement("img");

            image.src = URL.createObjectURL(file);

            image.alt = "Receipt preview";

            preview.appendChild(image);

        } else {

            const pdfIcon = document.createElement("div");

            pdfIcon.className = "receipt-pdf-icon";

            pdfIcon.innerHTML = '<i class="fas fa-file-pdf"></i>';

            preview.appendChild(pdfIcon);

        }


        const removeButton = document.createElement("button");

        removeButton.type = "button";

        removeButton.className = "remove-receipt-btn";

        removeButton.innerHTML = '<i class="fas fa-trash"></i>';


        removeButton.addEventListener("click", () => {

            input.value = "";

            preview.innerHTML = "";

            preview.classList.remove("visible");

        });


        preview.appendChild(info);

        preview.appendChild(removeButton);

        preview.classList.add("visible");

    });

}


setupReceiptPreview(bankReceipt, bankReceiptPreview);

setupReceiptPreview(ezcashReceipt, ezcashReceiptPreview);

setupReceiptPreview(binanceReceipt, binanceReceiptPreview);


/* =====================================================
   VALIDATION
===================================================== */

function validateDeposit() {

    const amount = Number(depositAmount.value);

    if (!Number.isFinite(amount) || amount < 100) {

        showToast(
            "Minimum deposit amount is LKR 100.",
            "error"
        );

        depositAmount.focus();

        return false;

    }


    if (amount > 9999999999) {

        showToast("Invalid deposit amount.", "error");

        return false;

    }


    if (currentPaymentMethod === "bank") {

        if (!bankDetails[selectedBank.value]) {

            showToast("Please select a bank.", "error");

            selectedBank.focus();

            return false;

        }


        if (!bankReceipt.files.length) {

            showToast("Please upload your bank receipt.", "error");

            return false;

        }

    }


    if (currentPaymentMethod === "ezcash") {

        if (!ezcashReceipt.files.length) {

            showToast("Please upload your EZ Cash receipt.", "error");

            return false;

        }

    }


    if (currentPaymentMethod === "binance") {

        if (!cryptoTransactionId.value.trim()) {

            showToast("Please enter your Binance TXID.", "error");

            cryptoTransactionId.focus();

            return false;

        }


        if (!binanceReceipt.files.length) {

            showToast("Please upload your Binance receipt.", "error");

            return false;

        }

    }


    return true;

}


/* =====================================================
   GET RECEIPT FILE
===================================================== */

function getReceiptFile() {

    if (currentPaymentMethod === "bank") {

        return bankReceipt.files[0];

    }

    if (currentPaymentMethod === "ezcash") {

        return ezcashReceipt.files[0];

    }

    if (currentPaymentMethod === "binance") {

        return binanceReceipt.files[0];

    }

    return null;

}


/* =====================================================
   RESET RECEIPT INPUTS
===================================================== */

function resetReceiptInputs() {

    const inputs = [

        [bankReceipt, bankReceiptPreview],

        [ezcashReceipt, ezcashReceiptPreview],

        [binanceReceipt, binanceReceiptPreview]

    ];


    inputs.forEach(([input, preview]) => {

        input.value = "";

        preview.innerHTML = "";

        preview.classList.remove("visible");

    });


    cryptoTransactionId.value = "";

}


/* =====================================================
   SUBMIT DEPOSIT REQUEST
===================================================== */

async function submitDepositRequest() {

    if (!validateDeposit()) return;


    if (!currentUser) {

        showToast("Please login again.", "error");

        return;

    }


    const amount = Number(depositAmount.value);

    const receiptFile = getReceiptFile();


    if (!receiptFile) return;


    submitDepositBtn.disabled = true;

    submitDepositBtn.innerHTML = `

        <span>Submitting Request...</span>

        <i class="fas fa-spinner fa-spin"></i>

    `;


    try {


        /* ----------------------------------
           CREATE UNIQUE RECEIPT PATH
        ---------------------------------- */

        const extension =

            receiptFile.name.split(".").pop().toLowerCase();


        const filePath =

            `${currentUser.id}/${crypto.randomUUID()}.${extension}`;


        /* ----------------------------------
           UPLOAD RECEIPT
        ---------------------------------- */

        const { data: uploadData, error: uploadError } =

            await supabase.storage

                .from("wallet-receipts")

                .upload(filePath, receiptFile, {

                    cacheControl: "3600",

                    upsert: false,

                    contentType: receiptFile.type

                });


        if (uploadError) {

            throw uploadError;

        }


        /* ----------------------------------
           CREATE DATABASE REQUEST
        ---------------------------------- */

        const requestData = {

            user_id: currentUser.id,

            amount: amount,

            payment_method: currentPaymentMethod,

            receipt_path: uploadData.path,

            status: "pending"

        };


        if (currentPaymentMethod === "bank") {

            requestData.bank_name = selectedBank.value;

        }


        if (currentPaymentMethod === "binance") {

            requestData.transaction_id =

                cryptoTransactionId.value.trim();

        }


        const { error: requestError } = await supabase

            .from("wallet_requests")

            .insert(requestData);


        if (requestError) {

            throw requestError;

        }


        showToast(

            "Deposit request submitted successfully!",

            "success"

        );


        depositAmount.value = "";

        document.querySelectorAll(".amount-btn").forEach(button => {

            button.classList.remove("active");

        });


        resetReceiptInputs();


        await loadDepositHistory();


        await loadWalletBalance();


    } catch (error) {

        console.error("Deposit Error:", error);

        showToast(

            error.message || "Unable to submit deposit request.",

            "error"

        );

    } finally {

        submitDepositBtn.disabled = false;

        submitDepositBtn.innerHTML = `

            <span>Submit Deposit Request</span>

            <i class="fas fa-arrow-right"></i>

        `;

    }

}


submitDepositBtn.addEventListener(
    "click",
    submitDepositRequest
);


/* =====================================================
   DEPOSIT HISTORY
===================================================== */

function formatDate(date) {

    return new Date(date).toLocaleString("en-LK", {

        year: "numeric",

        month: "short",

        day: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    });

}


function getPaymentName(method) {

    const names = {

        bank: "Bank Transfer",

        ezcash: "EZ Cash",

        binance: "Binance USDT"

    };

    return names[method] || method;

}


function renderDepositHistory(requests) {

    depositHistoryList.innerHTML = "";


    if (!requests.length) {

        depositHistoryList.innerHTML = `

            <div class="history-empty">

                <div class="history-empty-icon">

                    <i class="fas fa-receipt"></i>

                </div>

                <h3>No Deposits Yet</h3>

                <p>Your deposit transactions will appear here.</p>

            </div>

        `;

        return;

    }


    requests.forEach(request => {

        const card = document.createElement("div");

        card.className = "deposit-history-card";


        const status = request.status || "pending";


        const bankText = request.bank_name

            ? `<span>Bank: ${escapeHTML(request.bank_name)}</span>`

            : "";


        const txidText = request.transaction_id

            ? `<span class="history-txid">TXID: ${escapeHTML(request.transaction_id)}</span>`

            : "";


        const noteText = request.admin_note

            ? `<p class="history-admin-note">Admin note: ${escapeHTML(request.admin_note)}</p>`

            : "";


        card.innerHTML = `

            <div class="history-card-top">

                <div class="history-payment-icon">

                    <i class="fas fa-wallet"></i>

                </div>

                <div class="history-main-info">

                    <strong>${escapeHTML(getPaymentName(request.payment_method))}</strong>

                    <small>${formatDate(request.created_at)}</small>

                </div>

                <span class="history-status ${status}">

                    ${escapeHTML(status.toUpperCase())}

                </span>

            </div>

            <div class="history-card-bottom">

                <div>

                    ${bankText}

                    ${txidText}

                </div>

                <strong>

                    LKR ${Number(request.amount).toLocaleString("en-LK", {

                        minimumFractionDigits: 2,

                        maximumFractionDigits: 2

                    })}

                </strong>

            </div>

            ${noteText}

        `;


        depositHistoryList.appendChild(card);

    });

}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            '"': "&quot;",

            "'": "&#039;"

        };

        return entities[character];

    });

}


async function loadDepositHistory() {

    if (!currentUser) return;


    const { data, error } = await supabase

        .from("wallet_requests")

        .select(`

            id,

            amount,

            payment_method,

            bank_name,

            transaction_id,

            status,

            admin_note,

            created_at

        `)

        .eq("user_id", currentUser.id)

        .order("created_at", {

            ascending: false

        });


    if (error) {

        console.error("History Error:", error);

        showToast("Unable to load deposit history.", "error");

        return;

    }


    renderDepositHistory(data || []);

}


/* =====================================================
   HEADER BUTTONS
===================================================== */

document.getElementById("notificationBtn")

.addEventListener("click", () => {

    window.location.href = "notifications.html";

});


document.getElementById("profileBtn")

.addEventListener("click", () => {

    window.location.href = "profile.html";

});


/* =====================================================
   BOTTOM NAVIGATION
===================================================== */

const currentPage =

window.location.pathname.split("/").pop();


document.querySelectorAll(".big-store-bottom-nav a")

.forEach(link => {

    if (link.getAttribute("href") === currentPage) {

        link.classList.add("active");

    } else {

        link.classList.remove("active");

    }

});


/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeWallet() {

    const authenticated = await checkAuthentication();

    if (!authenticated) return;


    await loadWalletBalance();

    await loadDepositHistory();


    selectPaymentMethod("bank");

    updateBankDetails();

}


initializeWallet();