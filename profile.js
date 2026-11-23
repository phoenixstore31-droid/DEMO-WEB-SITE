// ==================================================
// BIG STORE - PROFILE SYSTEM
// SUPABASE AUTHENTICATION & PROFILE MANAGEMENT
// ==================================================


// ==================================================
// 1. SUPABASE CONNECTION
// ==================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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


// ==================================================
// 2. GLOBAL VARIABLES
// ==================================================

let currentUser = null;
let currentProfile = null;


// ==================================================
// 3. HTML ELEMENT HELPER
// ==================================================

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {

    const element = getElement(id);

    if (element) {
        element.textContent = value ?? "";
    }

}


// ==================================================
// 4. FORMAT FUNCTIONS
// ==================================================

function formatMoney(value) {

    const amount = Number(value || 0);

    return "Rs. " + amount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


function formatNumber(value) {

    return Number(value || 0).toLocaleString("en-LK", {
        maximumFractionDigits: 2
    });

}


function formatDate(date) {

    if (!date) {
        return "Not available";
    }

    const formattedDate = new Date(date);

    if (isNaN(formattedDate.getTime())) {
        return "Not available";
    }

    return formattedDate.toLocaleDateString("en-LK", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}


// ==================================================
// 5. TOAST NOTIFICATION
// ==================================================

function showToast(message, type = "success") {

    const toast = getElement("profileToast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;

    toast.className = "profile-toast show " + type;

    clearTimeout(toast.toastTimer);

    toast.toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}


// ==================================================
// 6. ERROR MESSAGE
// ==================================================

function showProfileError(message) {

    const loading = getElement("profileLoading");
    const errorBox = getElement("profileError");
    const errorMessage = getElement("profileErrorMessage");

    if (loading) {
        loading.style.display = "none";
    }

    if (errorBox) {
        errorBox.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    console.error("PROFILE ERROR:", message);

}


// ==================================================
// 7. LOADING SCREEN
// ==================================================

function hideProfileLoading() {

    const loading = getElement("profileLoading");

    if (loading) {
        loading.style.display = "none";
    }

}


// ==================================================
// 8. INITIALIZE PROFILE
// ==================================================

async function initializeProfile() {

    try {

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session) {

            window.location.replace("login.html");

            return;

        }

        await loadProfile();

    } catch (error) {

        console.error("Initialization Error:", error);

        showProfileError(error.message);

    }

}


// ==================================================
// 9. LOAD USER PROFILE
// ==================================================

async function loadProfile() {

    try {

        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!userData.user) {

            window.location.replace("login.html");

            return;

        }

        currentUser = userData.user;

        const userId = currentUser.id;


        // ==========================================
        // GET PROFILE FROM SUPABASE
        // ==========================================

        const { data: profile, error: profileError } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    username,
                    email,
                    created_at,
                    avatar_url,
                    wallet_balance,
                    total_orders,
                    total_spent,
                    reward_points,
                    is_reseller,
                    reseller_plan_id,
                    reseller_status,
                    reseller_started_at,
                    reseller_expires_at
                `)
                .eq("id", userId)
                .maybeSingle();


        if (profileError) {
            throw profileError;
        }

        if (!profile) {

            showProfileError(
                "Your profile was not found. Please contact support."
            );

            return;

        }

        currentProfile = profile;


        // ==========================================
        // DISPLAY PROFILE INFORMATION
        // ==========================================

        displayProfile(profile);


        // ==========================================
        // DISPLAY PROFILE STATS
        // ==========================================

        displayProfileStats(profile);


        hideProfileLoading();

        const errorBox = getElement("profileError");

        if (errorBox) {
            errorBox.style.display = "none";
        }

    } catch (error) {

        console.error("PROFILE ERROR:", error);

        showProfileError(error.message);

    }

}


// ==================================================
// 10. DISPLAY PROFILE
// ==================================================

function displayProfile(profile) {

    const username =
        profile.username ||
        currentUser.user_metadata?.username ||
        currentUser.user_metadata?.full_name ||
        "BIG STORE User";

    const email =
        profile.email ||
        currentUser.email ||
        "Not available";

    const phone =
        currentUser.user_metadata?.phone ||
        "Not available";


    // PROFILE NAME

    setText("profileName", username);

    setText("infoFullName", username);


    // EMAIL

    setText("profileEmail", email);

    setText("infoEmail", email);


    // PHONE

    setText("infoPhone", phone);


    // USER ID

    setText("profileUserId", currentUser.id);

    setText("infoUserId", currentUser.id);


    // JOINED DATE

    const joinedDate = formatDate(
        profile.created_at || currentUser.created_at
    );

    setText("infoJoinedDate", joinedDate);


    // ACCOUNT STATUS

    setText("accountStatus", "Active Account");


    // PROFILE AVATAR

    const avatar = getElement("profileAvatar");

    if (avatar) {

        const avatarURL = profile.avatar_url;

        if (avatarURL) {

            if (avatar.tagName === "IMG") {

                avatar.src = avatarURL;

            } else {

                avatar.style.backgroundImage =
                    `url("${avatarURL}")`;

                avatar.style.backgroundSize = "cover";

                avatar.style.backgroundPosition = "center";

            }

        }

    }


    // EDIT FORM

    const editName = getElement("editFullName");

    if (editName) {
        editName.value = username;
    }


    const editPhone = getElement("editPhone");

    if (editPhone) {
        editPhone.value =
            currentUser.user_metadata?.phone || "";
    }

}


// ==================================================
// 11. DISPLAY PROFILE STATISTICS
// ==================================================

function displayProfileStats(profile) {

    // WALLET BALANCE

    setText(
        "profileWalletBalance",
        formatMoney(profile.wallet_balance)
    );


    // REWARD POINTS

    setText(
        "profileRewardPoints",
        formatNumber(profile.reward_points)
    );


    // TOTAL SPENT

    setText(
        "profileTotalSpent",
        formatMoney(profile.total_spent)
    );


    // TOTAL ORDERS - OPTIONAL ELEMENT

    setText(
        "profileTotalOrders",
        formatNumber(profile.total_orders)
    );

}


// ==================================================
// 12. OPEN EDIT PROFILE MODAL
// ==================================================

function openEditModal() {

    const modal = getElement("editProfileModal");

    if (!modal) return;

    if (currentProfile) {
        displayProfile(currentProfile);
    }

    modal.classList.add("show");

}


// ==================================================
// 13. CLOSE EDIT PROFILE MODAL
// ==================================================

function closeEditModal() {

    const modal = getElement("editProfileModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


// ==================================================
// 14. SAVE PROFILE
// ==================================================

async function saveProfile(event) {

    event.preventDefault();

    if (!currentUser) {
        showToast("Please login again.", "error");
        return;
    }


    const usernameInput = getElement("editFullName");

    const phoneInput = getElement("editPhone");

    const saveButton = getElement("saveProfileBtn");


    const username = usernameInput?.value.trim();

    const phone = phoneInput?.value.trim() || "";


    if (!username) {

        showToast("Please enter your username.", "error");

        return;

    }


    if (username.length < 3) {

        showToast(
            "Username must contain at least 3 characters.",
            "error"
        );

        return;

    }


    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }


    try {

        // UPDATE PROFILES TABLE

        const { data: updatedProfile, error: profileError } =
            await supabase
                .from("profiles")
                .update({
                    username: username
                })
                .eq("id", currentUser.id)
                .select()
                .single();


        if (profileError) {
            throw profileError;
        }


        // UPDATE AUTH USER METADATA

        const { error: authError } =
            await supabase.auth.updateUser({

                data: {
                    username: username,
                    full_name: username,
                    phone: phone
                }

            });


        if (authError) {
            throw authError;
        }


        // UPDATE LOCAL DATA

        currentProfile = {
            ...currentProfile,
            ...updatedProfile
        };


        const { data: userData } =
            await supabase.auth.getUser();

        if (userData?.user) {
            currentUser = userData.user;
        }


        // REFRESH DISPLAY

        displayProfile(currentProfile);


        closeEditModal();

        showToast("Profile updated successfully!", "success");


    } catch (error) {

        console.error("UPDATE PROFILE ERROR:", error);

        showToast(error.message, "error");

    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent = "Save Changes";

        }

    }

}


// ==================================================
// 15. OPEN PASSWORD MODAL
// ==================================================

function openPasswordModal() {

    const modal = getElement("passwordModal");

    if (modal) {
        modal.classList.add("show");
    }

}


// ==================================================
// 16. CLOSE PASSWORD MODAL
// ==================================================

function closePasswordModal() {

    const modal = getElement("passwordModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


// ==================================================
// 17. CHANGE PASSWORD
// ==================================================

async function changePassword(event) {

    event.preventDefault();

    const newPassword = getElement("newPassword")?.value;

    const confirmPassword = getElement("confirmPassword")?.value;

    const updateButton = getElement("updatePasswordBtn");


    if (!newPassword || !confirmPassword) {

        showToast("Please fill all password fields.", "error");

        return;

    }


    if (newPassword.length < 6) {

        showToast(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;

    }


    if (newPassword !== confirmPassword) {

        showToast("Passwords do not match.", "error");

        return;

    }


    // CHECK LOGIN PROVIDER

    const providers =
        currentUser?.app_metadata?.providers || [];

    if (
        providers.includes("google") &&
        !providers.includes("email")
    ) {

        showToast(
            "Google accounts cannot change passwords here.",
            "error"
        );

        return;

    }


    if (updateButton) {

        updateButton.disabled = true;

        updateButton.textContent = "Updating...";

    }


    try {

        const { error } = await supabase.auth.updateUser({

            password: newPassword

        });


        if (error) {
            throw error;
        }


        const form = getElement("changePasswordForm");

        if (form) {
            form.reset();
        }


        closePasswordModal();

        showToast("Password changed successfully!", "success");


    } catch (error) {

        console.error("PASSWORD ERROR:", error);

        showToast(error.message, "error");

    } finally {

        if (updateButton) {

            updateButton.disabled = false;

            updateButton.textContent = "Update Password";

        }

    }

}


// ==================================================
// 18. LOGOUT
// ==================================================

async function logoutUser() {

    const confirmed = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) return;


    try {

        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.replace("login.html");


    } catch (error) {

        console.error("LOGOUT ERROR:", error);

        showToast(error.message, "error");

    }

}


// ==================================================
// 19. BUTTON EVENTS
// ==================================================

function setupEvents() {


    // EDIT PROFILE BUTTON

    getElement("editProfileBtn")
        ?.addEventListener("click", openEditModal);


    getElement("editPersonalInfoBtn")
        ?.addEventListener("click", openEditModal);


    // CLOSE EDIT MODAL

    getElement("closeEditModal")
        ?.addEventListener("click", closeEditModal);


    getElement("cancelEditBtn")
        ?.addEventListener("click", closeEditModal);


    getElement("closeModalOverlay")
        ?.addEventListener("click", closeEditModal);


    // SAVE PROFILE

    getElement("editProfileForm")
        ?.addEventListener("submit", saveProfile);


    // PASSWORD MODAL

    getElement("changePasswordBtn")
        ?.addEventListener("click", openPasswordModal);


    getElement("closePasswordModal")
        ?.addEventListener("click", closePasswordModal);


    getElement("cancelPasswordBtn")
        ?.addEventListener("click", closePasswordModal);


    getElement("closePasswordOverlay")
        ?.addEventListener("click", closePasswordModal);


    // CHANGE PASSWORD

    getElement("changePasswordForm")
        ?.addEventListener("submit", changePassword);


    // LOGOUT

    getElement("logoutBtn")
        ?.addEventListener("click", logoutUser);


    // RETRY PROFILE

    getElement("retryProfileBtn")
        ?.addEventListener("click", () => {

            const errorBox = getElement("profileError");

            if (errorBox) {
                errorBox.style.display = "none";
            }

            const loading = getElement("profileLoading");

            if (loading) {
                loading.style.display = "block";
            }

            loadProfile();

        });


    // CLOSE MODALS ON ESCAPE

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeEditModal();

            closePasswordModal();

        }

    });

}


// ==================================================
// 20. AUTH STATE LISTENER
// ==================================================

supabase.auth.onAuthStateChange((event, session) => {

    if (event === "SIGNED_OUT") {

        window.location.replace("login.html");

    }

});


// ==================================================
// 21. START PROFILE SYSTEM
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

    setupEvents();

    initializeProfile();

});


// ==================================================
// BIG STORE PROFILE SYSTEM COMPLETED
// ==================================================