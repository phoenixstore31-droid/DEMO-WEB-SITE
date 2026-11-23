// ==========================================
// BIG STORE - PREMIUM LOGIN SYSTEM
// SUPABASE AUTHENTICATION
// ==========================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://drqanlbxrpahscbxmlyt.supabase.co";

const SUPABASE_KEY = "sb_publishable_9xJxxVib4BAD5RXItitbQQ_O3qfyZ-T";


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
// ELEMENTS
// ==========================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");

const buttonText = document.getElementById("buttonText");

const messageBox = document.getElementById("message");

const togglePassword = document.getElementById("togglePassword");


// ==========================================
// CURRENT YEAR
// ==========================================

document.getElementById("currentYear").textContent =
    new Date().getFullYear();


// ==========================================
// MESSAGE FUNCTION
// ==========================================

function showMessage(message, type) {

    messageBox.textContent = message;

    messageBox.className = "message " + type;

}


// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

togglePassword.addEventListener("click", () => {

    const icon = togglePassword.querySelector("i");

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        icon.className = "fa-regular fa-eye-slash";

        togglePassword.setAttribute("aria-label", "Hide password");

    } else {

        passwordInput.type = "password";

        icon.className = "fa-regular fa-eye";

        togglePassword.setAttribute("aria-label", "Show password");

    }

});


// ==========================================
// LOGIN FUNCTION
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    messageBox.className = "message";


    const email = emailInput.value.trim();

    const password = passwordInput.value;


    if (!email || !password) {

        showMessage(
            "Please enter your email and password.",
            "error"
        );

        return;

    }


    // Loading state

    loginButton.disabled = true;

    buttonText.textContent = "AUTHENTICATING...";


    try {

        // Supabase Login

        const { data, error } = await supabase.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            throw error;

        }


        if (!data.session || !data.user) {

            throw new Error("Login session could not be created.");

        }


        // Successful login

        showMessage(
            "Authentication successful. Welcome to BIG STORE!",
            "success"
        );


        // Redirect

        setTimeout(() => {

            window.location.replace("index.html");

        }, 1200);


    } catch (error) {

        console.error("BIG STORE Login Error:", error);


        let errorMessage = error.message;


        if (error.message.includes("Email not confirmed")) {

            errorMessage =
                "Your email is not verified. Please verify your email first.";

        }

        else if (
            error.message.includes("Invalid login credentials")
        ) {

            errorMessage =
                "Incorrect email or password. Please try again.";

        }

        else if (
            error.message.includes("Too many requests")
        ) {

            errorMessage =
                "Too many login attempts. Please try again later.";

        }


        showMessage(errorMessage, "error");


    } finally {

        loginButton.disabled = false;

        buttonText.textContent = "SIGN IN TO ACCOUNT";

    }

});