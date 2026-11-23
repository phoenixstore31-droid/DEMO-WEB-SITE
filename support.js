/* =====================================================
   BIG STORE - CUSTOMER SUPPORT
   JavaScript
===================================================== */


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

    }, 3500);

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

        // Close all FAQ items
        faqItems.forEach(faq => {

            faq.classList.remove("active");

        });

        // Open selected FAQ
        if (!isAlreadyOpen) {

            item.classList.add("active");

        }

    });

});


/* =====================================================
   DEMO CONTACT BUTTONS
===================================================== */

const demoContactButtons = document.querySelectorAll(".demo-contact-btn");

demoContactButtons.forEach(button => {

    button.addEventListener("click", () => {

        showToast(
            "Demo contact details only. Real support connection is not enabled yet.",
            "info"
        );

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
   FORM VALIDATION
===================================================== */

function validateSupportForm() {

    const name = supportName?.value.trim() || "";

    const email = supportEmail?.value.trim() || "";

    const category = supportCategory?.value || "";

    const priority = supportPriority?.value || "";

    const message = supportMessage?.value.trim() || "";


    // Name validation

    if (!name) {

        showToast("Please enter your full name.", "error");

        supportName?.focus();

        return false;

    }


    if (name.length < 2) {

        showToast("Name must contain at least 2 characters.", "error");

        supportName?.focus();

        return false;

    }


    // Email validation

    if (!email) {

        showToast("Please enter your email address.", "error");

        supportEmail?.focus();

        return false;

    }


    if (!isValidEmail(email)) {

        showToast("Please enter a valid email address.", "error");

        supportEmail?.focus();

        return false;

    }


    // Category validation

    if (!category) {

        showToast("Please select an issue category.", "error");

        supportCategory?.focus();

        return false;

    }


    // Priority validation

    if (!["normal", "high", "urgent"].includes(priority)) {

        showToast("Please select a valid priority.", "error");

        supportPriority?.focus();

        return false;

    }


    // Message validation

    if (!message) {

        showToast("Please describe your problem.", "error");

        supportMessage?.focus();

        return false;

    }


    if (message.length < 10) {

        showToast(
            "Please enter at least 10 characters in your message.",
            "error"
        );

        supportMessage?.focus();

        return false;

    }


    if (message.length > 2000) {

        showToast("Message cannot exceed 2000 characters.", "error");

        supportMessage?.focus();

        return false;

    }


    return true;

}


/* =====================================================
   DEMO TICKET NUMBER
===================================================== */

function generateTicketNumber() {

    const randomNumber = Math.floor(
        100000 + Math.random() * 900000
    );

    return "BS-DEMO-" + randomNumber;

}


/* =====================================================
   SUPPORT FORM SUBMISSION
===================================================== */

supportForm?.addEventListener("submit", event => {

    event.preventDefault();


    // Validate form

    if (!validateSupportForm()) {

        return;

    }


    // Generate demo ticket ID

    const ticketNumber = generateTicketNumber();


    // Collect form data

    const ticketData = {

        ticket_id: ticketNumber,

        name: supportName.value.trim(),

        email: supportEmail.value.trim(),

        order_id: supportOrderId?.value.trim() || "",

        category: supportCategory.value,

        priority: supportPriority.value,

        message: supportMessage.value.trim(),

        created_at: new Date().toISOString(),

        status: "DEMO ONLY"

    };


    // Demo output only.
    // No Supabase database submission.

    console.log("BIG STORE DEMO SUPPORT TICKET:");

    console.log(ticketData);


    // Disable button temporarily

    if (submitSupportBtn) {

        submitSupportBtn.disabled = true;

        submitSupportBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
        `;

    }


    setTimeout(() => {

        if (submitSupportBtn) {

            submitSupportBtn.disabled = false;

            submitSupportBtn.innerHTML = `
                <i class="fas fa-paper-plane"></i>
                Submit Support Ticket
            `;

        }


        showToast(
            "Demo ticket generated: " + ticketNumber +
            ". It was NOT sent to support.",
            "success"
        );


        // Reset form

        supportForm.reset();


    }, 1000);

});


/* =====================================================
   CHARACTER COUNT
===================================================== */

if (supportMessage) {

    supportMessage.addEventListener("input", () => {

        const currentLength = supportMessage.value.length;

        if (currentLength > 1900) {

            showToast(
                "You are approaching the 2000 character limit.",
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

    console.log("BIG STORE Support Page Loaded.");

});