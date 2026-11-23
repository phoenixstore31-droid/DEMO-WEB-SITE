/* =====================================================
   BIG STORE - REAL WHATSAPP SUPPORT SYSTEM
===================================================== */


/* =====================================================
   WHATSAPP CONFIGURATION
===================================================== */

const WHATSAPP_NUMBER = "94743829773";

const SUPPORT_EMAIL = "phoenixstore31@gmail.com";

const SUPPORT_PHONE = "+94743829773";


/* =====================================================
   DOM ELEMENTS
===================================================== */

const supportForm = document.getElementById("supportForm");

const supportName = document.getElementById("supportName");

const supportEmail = document.getElementById("supportEmail");

const supportOrderId = document.getElementById("supportOrderId");

const supportCategory = document.getElementById("supportCategory");

const supportPriority = document.getElementById("supportPriority");

const supportMessage = document.getElementById("supportMessage");

const submitSupportBtn = document.getElementById("submitSupportBtn");

const supportToast = document.getElementById("supportToast");

const supportToastMessage = document.getElementById("supportToastMessage");


/* =====================================================
   TOAST NOTIFICATION
===================================================== */

let toastTimer;

function showToast(message, type = "info") {

    if (!supportToast || !supportToastMessage) {

        alert(message);

        return;

    }

    const icon = supportToast.querySelector("i");

    supportToastMessage.textContent = message;

    if (icon) {

        if (type === "success") {

            icon.className = "fas fa-check-circle";

        }

        else if (type === "error") {

            icon.className = "fas fa-exclamation-circle";

        }

        else {

            icon.className = "fas fa-info-circle";

        }

    }

    supportToast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        supportToast.classList.remove("show");

    }, 4000);

}


/* =====================================================
   FAQ ACCORDION
===================================================== */

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

    const question = item.querySelector(".faq-question");

    if (!question) return;

    question.addEventListener("click", () => {

        const isAlreadyOpen = item.classList.contains("active");

        faqItems.forEach(faq => {

            faq.classList.remove("active");

        });

        if (!isAlreadyOpen) {

            item.classList.add("active");

        }

    });

});


/* =====================================================
   EMAIL VALIDATION
===================================================== */

function isValidEmail(email) {

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


/* =====================================================
   GENERATE UNIQUE TICKET ID
===================================================== */

function generateTicketNumber() {

    const date = new Date();

    const timestamp = date.getTime().toString().slice(-8);

    const random = Math.floor(1000 + Math.random() * 9000);

    return "BS-" + timestamp + random;

}


/* =====================================================
   FORM VALIDATION
===================================================== */

function validateSupportForm() {

    const name = supportName.value.trim();

    const email = supportEmail.value.trim();

    const category = supportCategory.value;

    const priority = supportPriority.value;

    const message = supportMessage.value.trim();


    if (name.length < 2) {

        showToast("Please enter your full name.", "error");

        supportName.focus();

        return false;

    }


    if (!isValidEmail(email)) {

        showToast("Please enter a valid email address.", "error");

        supportEmail.focus();

        return false;

    }


    if (!category) {

        showToast("Please select an issue category.", "error");

        supportCategory.focus();

        return false;

    }


    if (!["normal", "high", "urgent"].includes(priority)) {

        showToast("Invalid priority selected.", "error");

        supportPriority.focus();

        return false;

    }


    if (message.length < 10) {

        showToast("Please describe your problem (minimum 10 characters).", "error");

        supportMessage.focus();

        return false;

    }


    if (message.length > 2000) {

        showToast("Message cannot exceed 2000 characters.", "error");

        supportMessage.focus();

        return false;

    }


    return true;

}


/* =====================================================
   CATEGORY LABELS
===================================================== */

function getCategoryName(category) {

    const categories = {

        payment: "Payment Problem",

        order: "Order Problem",

        topup: "Game Top-Up Problem",

        wallet: "Wallet Problem",

        account: "Account Problem",

        reseller: "Reseller Problem",

        other: "Other"

    };

    return categories[category] || category;

}


/* =====================================================
   PRIORITY LABELS
===================================================== */

function getPriorityName(priority) {

    const priorities = {

        normal: "Normal",

        high: "High",

        urgent: "Urgent"

    };

    return priorities[priority] || priority;

}


/* =====================================================
   WHATSAPP MESSAGE GENERATOR
===================================================== */

function generateWhatsAppMessage(ticketData) {

    return `
*BIG STORE - CUSTOMER SUPPORT*

━━━━━━━━━━━━━━━━━━━━

*Ticket ID:* ${ticketData.ticket_id}

*Customer Information*

Name: ${ticketData.name}

Email: ${ticketData.email}

━━━━━━━━━━━━━━━━━━━━

*Order Information*

Order ID: ${ticketData.order_id || "Not Provided"}

━━━━━━━━━━━━━━━━━━━━

*Support Information*

Category: ${ticketData.category}

Priority: ${ticketData.priority}

━━━━━━━━━━━━━━━━━━━━

*Problem Description*

${ticketData.message}

━━━━━━━━━━━━━━━━━━━━

*Ticket Created:*

${ticketData.created_at}

━━━━━━━━━━━━━━━━━━━━

Please assist this customer.

Thank You!

*BIG STORE SUPPORT*
`.trim();

}


/* =====================================================
   OPEN WHATSAPP
===================================================== */

function openWhatsApp(message) {

    const encodedMessage = encodeURIComponent(message);

    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =====================================================
   SUPPORT FORM SUBMISSION
===================================================== */

supportForm?.addEventListener("submit", function(event) {

    event.preventDefault();


    if (!validateSupportForm()) {

        return;

    }


    const ticketData = {

        ticket_id: generateTicketNumber(),

        name: supportName.value.trim(),

        email: supportEmail.value.trim(),

        order_id: supportOrderId.value.trim(),

        category: getCategoryName(supportCategory.value),

        priority: getPriorityName(supportPriority.value),

        message: supportMessage.value.trim(),

        created_at: new Date().toLocaleString("en-LK")

    };


    const whatsappMessage =
        generateWhatsAppMessage(ticketData);


    const encodedMessage =
        encodeURIComponent(whatsappMessage);


    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;


    if (submitSupportBtn) {

        submitSupportBtn.disabled = true;

        submitSupportBtn.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Opening WhatsApp...

        `;

    }


    // Open WhatsApp directly from the submit action.

    const whatsappWindow = window.open(
        whatsappURL,
        "_blank"
    );


    if (!whatsappWindow) {

        // Fallback if the browser blocks the new window.

        window.location.href = whatsappURL;

    }


    showToast(

        "Your support request is ready in WhatsApp. Please press Send.",

        "success"

    );


    setTimeout(() => {

        if (submitSupportBtn) {

            submitSupportBtn.disabled = false;

            submitSupportBtn.innerHTML = `

                <i class="fas fa-paper-plane"></i>

                Submit Support Ticket

            `;

        }

    }, 3000);

});


/* =====================================================
   CHARACTER COUNT
===================================================== */

if (supportMessage) {

    supportMessage.addEventListener("input", () => {

        const currentLength = supportMessage.value.length;

        if (currentLength > 1900 && currentLength <= 2000) {

            showToast(

                `${currentLength}/2000 characters used.`,

                "info"

            );

        }

    });

}


/* =====================================================
   NOTIFICATION BUTTON
===================================================== */

document.getElementById("notificationBtn")?.addEventListener("click", () => {

    showToast("No new notifications.", "info");

});


/* =====================================================
   PROFILE BUTTON
===================================================== */

document.getElementById("profileBtn")?.addEventListener("click", () => {

    window.location.href = "profile.html";

});


/* =====================================================
   BOTTOM NAVIGATION ACTIVE STATE
===================================================== */

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".big-store-bottom-nav a").forEach(link => {

    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {

        link.classList.add("active");

    }

    else {

        link.classList.remove("active");

    }

});


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("BIG STORE Real WhatsApp Support Loaded.");

    console.log("Support WhatsApp:", WHATSAPP_NUMBER);

    console.log("Support Email:", SUPPORT_EMAIL);

    console.log("Support Phone:", SUPPORT_PHONE);

});