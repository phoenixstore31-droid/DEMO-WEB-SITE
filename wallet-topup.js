/* =====================================================
   BIG STORE - WALLET TOP UP
   JavaScript
===================================================== */

/* =====================================================
   DOM ELEMENTS
===================================================== */

const depositAmount = document.getElementById("depositAmount");

const bankMethod = document.getElementById("bankMethod");
const ezcashMethod = document.getElementById("ezcashMethod");
const binanceMethod = document.getElementById("binanceMethod");

const bankDetailsPanel = document.getElementById("bankDetailsPanel");
const ezcashDetailsPanel = document.getElementById("ezcashDetailsPanel");
const binanceDetailsPanel = document.getElementById("binanceDetailsPanel");

const selectedBank = document.getElementById("selectedBank");

const bankDisplayName = document.getElementById("bankDisplayName");
const bankAccountName = document.getElementById("bankAccountName");
const bankAccountNumber = document.getElementById("bankAccountNumber");
const bankBranch = document.getElementById("bankBranch");

const bankReceipt = document.getElementById("bankReceipt");
const ezcashReceipt = document.getElementById("ezcashReceipt");
const binanceReceipt = document.getElementById("binanceReceipt");

const bankReceiptPreview = document.getElementById("bankReceiptPreview");
const ezcashReceiptPreview = document.getElementById("ezcashReceiptPreview");
const binanceReceiptPreview = document.getElementById("binanceReceiptPreview");

const submitDepositBtn = document.getElementById("submitDepositBtn");

const walletToast = document.getElementById("walletToast");
const walletToastMessage = document.getElementById("walletToastMessage");

const cryptoTransactionId = document.getElementById("cryptoTransactionId");

/* =====================================================
   DEMO BANK DETAILS
===================================================== */

const bankDetails = {
    boc: {
        name: "Bank of Ceylon",
        accountName: "BIG STORE DEMO",
        accountNumber: "1234567890",
        branch: "Demo Branch"
    },

    commercial: {
        name: "Commercial Bank",
        accountName: "BIG STORE DEMO",
        accountNumber: "2345678901",
        branch: "Demo Branch"
    },

    sampath: {
        name: "Sampath Bank",
        accountName: "BIG STORE DEMO",
        accountNumber: "3456789012",
        branch: "Demo Branch"
    },

    hnb: {
        name: "Hatton National Bank",
        accountName: "BIG STORE DEMO",
        accountNumber: "4567890123",
        branch: "Demo Branch"
    }
};

/* =====================================================
   TOAST NOTIFICATION
===================================================== */

let toastTimer;

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
   PAYMENT METHOD SELECTION
===================================================== */

function selectPaymentMethod(method) {

    const methods = [
        bankMethod,
        ezcashMethod,
        binanceMethod
    ];

    methods.forEach(button => {
        if (button) {
            button.classList.remove("active");
        }
    });

    if (bankDetailsPanel) bankDetailsPanel.hidden = true;
    if (ezcashDetailsPanel) ezcashDetailsPanel.hidden = true;
    if (binanceDetailsPanel) binanceDetailsPanel.hidden = true;

    if (method === "bank") {

        bankMethod?.classList.add("active");

        if (bankDetailsPanel) {
            bankDetailsPanel.hidden = false;
        }

    }

    if (method === "ezcash") {

        ezcashMethod?.classList.add("active");

        if (ezcashDetailsPanel) {
            ezcashDetailsPanel.hidden = false;
        }

    }

    if (method === "binance") {

        binanceMethod?.classList.add("active");

        if (binanceDetailsPanel) {
            binanceDetailsPanel.hidden = false;
        }

    }

}

bankMethod?.addEventListener("click", () => {
    selectPaymentMethod("bank");
});

ezcashMethod?.addEventListener("click", () => {
    selectPaymentMethod("ezcash");
});

binanceMethod?.addEventListener("click", () => {
    selectPaymentMethod("binance");
});

/* =====================================================
   BANK SELECTION
===================================================== */

function updateBankDetails() {

    if (!selectedBank) return;

    const bankKey = selectedBank.value;
    const details = bankDetails[bankKey];

    if (!details) {

        if (bankDisplayName) bankDisplayName.textContent = "Select a Bank";
        if (bankAccountName) bankAccountName.textContent = "-";
        if (bankAccountNumber) bankAccountNumber.textContent = "-";
        if (bankBranch) bankBranch.textContent = "-";

        return;
    }

    if (bankDisplayName) {
        bankDisplayName.textContent = details.name;
    }

    if (bankAccountName) {
        bankAccountName.textContent = details.accountName;
    }

    if (bankAccountNumber) {
        bankAccountNumber.textContent = details.accountNumber;
    }

    if (bankBranch) {
        bankBranch.textContent = details.branch;
    }

}

selectedBank?.addEventListener("change", updateBankDetails);

/* =====================================================
   COPY BUTTONS
===================================================== */

async function copyText(text) {

    if (!text || text === "-") {
        showToast("Nothing to copy.", "error");
        return;
    }

    try {

        await navigator.clipboard.writeText(text);

        showToast("Copied successfully!", "success");

    } catch (error) {

        const textarea = document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        try {
            document.execCommand("copy");
            showToast("Copied successfully!", "success");
        } catch {
            showToast("Unable to copy. Please copy manually.", "error");
        }

        textarea.remove();

    }

}

document.querySelectorAll("[data-copy]").forEach(button => {

    button.addEventListener("click", () => {

        const targetId = button.dataset.copy;

        const target = document.getElementById(targetId);

        if (!target) {
            showToast("Copy item not found.", "error");
            return;
        }

        copyText(target.textContent.trim());

    });

});

/* =====================================================
   QUICK AMOUNT BUTTONS
===================================================== */

document.querySelectorAll(".amount-btn").forEach(button => {

    button.addEventListener("click", () => {

        const amount = Number(button.dataset.amount);

        if (!Number.isFinite(amount) || amount <= 0) return;

        if (depositAmount) {
            depositAmount.value = amount;
        }

        document.querySelectorAll(".amount-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

    });

});

depositAmount?.addEventListener("input", () => {

    document.querySelectorAll(".amount-btn").forEach(button => {
        button.classList.remove("active");
    });

});

/* =====================================================
   RECEIPT IMAGE PREVIEW
===================================================== */

function setupReceiptPreview(input, preview) {

    if (!input || !preview) return;

    input.addEventListener("change", () => {

        preview.innerHTML = "";
        preview.classList.remove("show");

        const file = input.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            input.value = "";

            showToast("Please select an image file.", "error");

            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024;

        if (file.size > MAX_SIZE) {

            input.value = "";

            showToast("Image must be smaller than 5MB.", "error");

            return;
        }

        const reader = new FileReader();

        reader.onload = event => {

            const image = document.createElement("img");

            image.src = event.target.result;
            image.alt = "Receipt preview";

            const info = document.createElement("div");
            info.className = "preview-info";

            const title = document.createElement("strong");
            title.textContent = file.name;

            const size = document.createElement("span");

            size.textContent =
                (file.size / 1024 / 1024).toFixed(2) + " MB";

            info.appendChild(title);
            info.appendChild(size);

            preview.appendChild(image);
            preview.appendChild(info);

            preview.classList.add("show");

        };

        reader.readAsDataURL(file);

    });

}

setupReceiptPreview(bankReceipt, bankReceiptPreview);
setupReceiptPreview(ezcashReceipt, ezcashReceiptPreview);
setupReceiptPreview(binanceReceipt, binanceReceiptPreview);

/* =====================================================
   DEPOSIT VALIDATION
===================================================== */

function getSelectedPaymentMethod() {

    if (bankMethod?.classList.contains("active")) {
        return "bank";
    }

    if (ezcashMethod?.classList.contains("active")) {
        return "ezcash";
    }

    if (binanceMethod?.classList.contains("active")) {
        return "binance";
    }

    return null;

}

function validateDeposit() {

    const amount = Number(depositAmount?.value);

    if (!Number.isFinite(amount) || amount <= 0) {

        showToast("Please enter a valid deposit amount.", "error");

        depositAmount?.focus();

        return false;
    }

    if (amount < 100) {

        showToast("Minimum demo amount is LKR 100.", "error");

        return false;
    }

    const method = getSelectedPaymentMethod();

    if (!method) {

        showToast("Please select a payment method.", "error");

        return false;
    }

    if (method === "bank") {

        if (!selectedBank?.value || !bankDetails[selectedBank.value]) {

            showToast("Please select a bank.", "error");

            selectedBank?.focus();

            return false;
        }

        if (!bankReceipt?.files?.length) {

            showToast("Please select your bank receipt image.", "error");

            return false;
        }

    }

    if (method === "ezcash") {

        if (!ezcashReceipt?.files?.length) {

            showToast("Please select your EZ Cash receipt image.", "error");

            return false;
        }

    }

    if (method === "binance") {

        if (!cryptoTransactionId?.value.trim()) {

            showToast("Please enter your transaction ID.", "error");

            cryptoTransactionId?.focus();

            return false;
        }

        if (!binanceReceipt?.files?.length) {

            showToast("Please select your Binance receipt image.", "error");

            return false;
        }

    }

    return true;

}

/* =====================================================
   DEMO SUBMISSION
===================================================== */

submitDepositBtn?.addEventListener("click", event => {

    event.preventDefault();

    if (!validateDeposit()) return;

    showToast(
        "Demo only! No payment request was submitted and wallet balance was not changed.",
        "info"
    );

});

/* =====================================================
   HEADER BUTTONS
===================================================== */

document.getElementById("notificationBtn")?.addEventListener("click", () => {

    showToast("No new notifications.", "info");

});

document.getElementById("profileBtn")?.addEventListener("click", () => {

    window.location.href = "profile.html";

});

/* =====================================================
   BOTTOM NAVIGATION
===================================================== */

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".big-store-bottom-nav a").forEach(link => {

    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
        link.classList.add("active");
    } else {
        link.classList.remove("active");
    }

});

/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    updateBankDetails();

    selectPaymentMethod("bank");

});