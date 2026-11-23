// ==========================================
// BIG STORE - SUPABASE AUTHENTICATION
// REGISTER SYSTEM
// ==========================================

import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://zzxzrrntyvqbhyzuhaso.supabase.co";

const SUPABASE_KEY = "sb_publishable_7NpKLvkhQsF3LvPsrXNQdg_z6mIRnDO";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // CURRENT YEAR
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // ======================================
    // PASSWORD SHOW / HIDE
    // ======================================

    function setupPasswordToggle(inputId, buttonId) {

        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (!input || !button) return;

        button.addEventListener("click", () => {

            const show = input.type === "password";

            input.type = show ? "text" : "password";

            button.innerHTML = show
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

        });

    }


    setupPasswordToggle("loginPassword", "togglePassword");

    setupPasswordToggle(
        "registerPassword",
        "toggleRegisterPassword"
    );

    setupPasswordToggle(
        "confirmPassword",
        "toggleConfirmPassword"
    );


    // ======================================
    // MESSAGE FUNCTION
    // ======================================

    function showMessage(element, message, type) {

        if (!element) return;

        element.textContent = message;

        element.className = "auth-message " + type;

    }


    // ======================================
    // REGISTER SYSTEM
    // ======================================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        const nameInput = document.getElementById("registerName");

        const emailInput = document.getElementById("registerEmail");

        const passwordInput = document.getElementById("registerPassword");

        const confirmPasswordInput = document.getElementById("confirmPassword");

        const termsInput = document.getElementById("acceptTerms");

        const registerButton = document.getElementById("registerButton");

        const registerMessage = document.getElementById("registerMessage");


        registerForm.addEventListener("submit", async (event) => {

            event.preventDefault();


            // GET VALUES

            const fullName = nameInput.value.trim();

            const email = emailInput.value.trim().toLowerCase();

            const password = passwordInput.value;

            const confirmPassword = confirmPasswordInput.value;


            // NAME VALIDATION

            if (fullName.length < 2) {

                showMessage(
                    registerMessage,
                    "Please enter your full name.",
                    "error"
                );

                return;

            }


            // EMAIL VALIDATION

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                showMessage(
                    registerMessage,
                    "Please enter a valid email address.",
                    "error"
                );

                return;

            }


            // PASSWORD VALIDATION

            if (password.length < 8) {

                showMessage(
                    registerMessage,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;

            }


            // CONFIRM PASSWORD

            if (password !== confirmPassword) {

                showMessage(
                    registerMessage,
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            // TERMS VALIDATION

            if (!termsInput.checked) {

                showMessage(
                    registerMessage,
                    "Please accept the Terms & Conditions.",
                    "error"
                );

                return;

            }


            // DISABLE BUTTON

            registerButton.disabled = true;

            registerButton.innerHTML = `
                <span>CREATING ACCOUNT...</span>
                <i class="fa-solid fa-spinner fa-spin"></i>
            `;


            try {

                // SUPABASE REGISTRATION

                const { data, error } = await supabase.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            full_name: fullName
                        }

                    }

                });


                if (error) {
                    throw error;
                }


                // SUCCESS

                if (data.user && !data.session) {

                    showMessage(
                        registerMessage,
                        "Account created successfully! Please check your email and verify your account before logging in.",
                        "success"
                    );

                    registerForm.reset();

                }

                else if (data.user && data.session) {

                    showMessage(
                        registerMessage,
                        "Your BIG STORE account has been created successfully!",
                        "success"
                    );

                    registerForm.reset();

                }

                else {

                    throw new Error("Registration could not be completed.");

                }


            } catch (error) {

                console.error("Registration Error:", error);

                showMessage(
                    registerMessage,
                    error.message || "Registration failed. Please try again.",
                    "error"
                );

            } finally {

                // ENABLE BUTTON

                registerButton.disabled = false;

                registerButton.innerHTML = `
                    <span>CREATE ACCOUNT</span>
                    <i class="fa-solid fa-arrow-right"></i>
                `;

            }

        });

    }

});