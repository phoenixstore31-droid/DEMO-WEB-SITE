import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================
// BIG STORE - SUPABASE CONNECTION
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

const registerForm = document.getElementById("registerForm");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerButton = document.getElementById("registerButton");
const buttonText = document.getElementById("buttonText");
const messageBox = document.getElementById("message");

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

document.querySelectorAll(".toggle-password").forEach(button => {

    button.addEventListener("click", () => {

        const target = document.getElementById(button.dataset.target);

        if (target.type === "password") {

            target.type = "text";
            button.textContent = "HIDE";

        } else {

            target.type = "password";
            button.textContent = "SHOW";

        }

    });

});

// ==========================================
// REGISTER FUNCTION
// ==========================================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    messageBox.className = "message";

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Username validation

    if (username.length < 3) {

        showMessage("Username must contain at least 3 characters.", "error");
        return;

    }

    if (password.length < 8) {

        showMessage("Password must contain at least 8 characters.", "error");
        return;

    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {

        showMessage("Password must contain both letters and numbers.", "error");
        return;

    }

    if (password !== confirmPassword) {

        showMessage("Passwords do not match.", "error");
        return;

    }

    // Loading

    registerButton.disabled = true;
    buttonText.textContent = "CREATING ACCOUNT...";

    try {

        // Supabase Registration

        const { data, error } = await supabase.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {
                    username: username
                },

                emailRedirectTo: `${window.location.origin}/login.html`

            }

        });

        if (error) {
            throw error;
        }

        // Check existing account response

        if (data.user && data.user.identities && data.user.identities.length === 0) {

            showMessage(
                "Unable to create a new account with these details. Please try another email.",
                "error"
            );

            return;

        }

        // Email verification message

        if (!data.session) {

            registerForm.reset();

            showMessage(
                "Registration successful! Please check your email and click the verification link to activate your BIG STORE account.",
                "success"
            );

        } else {

            showMessage(
                "Your BIG STORE account has been created successfully!",
                "success"
            );

        }

    } catch (error) {

        console.error("Registration Error:", error);

        showMessage(
            error.message || "Registration failed. Please try again.",
            "error"
        );

    } finally {

        registerButton.disabled = false;
        buttonText.textContent = "CREATE ACCOUNT";

    }

});