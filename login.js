// ==========================================
// BIG STORE - LOGIN SYSTEM
// SUPABASE AUTHENTICATION
// ==========================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SUPABASE CONNECTION

const SUPABASE_URL = "https://tvhgxlqqeklrdlgbkosa.supabase.co";

const SUPABASE_KEY = "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I";

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


// HTML ELEMENTS

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");

const buttonText = document.getElementById("buttonText");

const loginMessage = document.getElementById("loginMessage");

const togglePassword = document.getElementById("togglePassword");

const forgotPassword = document.getElementById("forgotPassword");


// ==========================================
// CHECK EXISTING LOGIN
// ==========================================

async function checkExistingLogin() {

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Session Error:", error.message);
        return;
    }

    if (data.session) {
        window.location.replace("index.html");
    }

}

checkExistingLogin();


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";

    }

});


// ==========================================
// MESSAGE FUNCTION
// ==========================================

function showMessage(message, type) {

    loginMessage.textContent = message;

    loginMessage.className = "message " + type;

}


// ==========================================
// LOADING FUNCTION
// ==========================================

function setLoading(isLoading) {

    loginButton.disabled = isLoading;

    loginButton.classList.toggle("loading", isLoading);

    buttonText.textContent = isLoading ? "Signing In..." : "Sign In";

}


// ==========================================
// LOGIN FUNCTION
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    if (!email || !password) {

        showMessage("Please enter your email and password.", "error");

        return;

    }

    setLoading(true);

    loginMessage.className = "message";

    try {

        const { data, error } = await supabase.auth.signInWithPassword({

            email: email,

            password: password

        });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error("Login session could not be created.");
        }

        showMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {

            window.location.replace("index.html");

        }, 700);

    } catch (error) {

        console.error("Login Error:", error);

        let message = "Login failed. Please try again.";

        if (error.message.includes("Invalid login credentials")) {

            message = "Incorrect email or password.";

        } else if (error.message.includes("Email not confirmed")) {

            message = "Please confirm your email before logging in.";

        } else if (error.message.includes("Invalid API key")) {

            message = "Supabase API key is incorrect.";

        } else {

            message = error.message;

        }

        showMessage(message, "error");

        setLoading(false);

    }

});


// ==========================================
// FORGOT PASSWORD
// ==========================================

forgotPassword.addEventListener("click", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {

        showMessage("Please enter your email address first.", "error");

        emailInput.focus();

        return;

    }

    try {

        const { error } = await supabase.auth.resetPasswordForEmail(email, {

            redirectTo: window.location.origin + "/reset-password.html"

        });

        if (error) {
            throw error;
        }

        showMessage("Password reset link sent to your email.", "success");

    } catch (error) {

        showMessage(error.message, "error");

    }

});