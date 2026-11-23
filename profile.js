// ==========================================
// BIG STORE - PROFILE SYSTEM
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
// DOM ELEMENT HELPER
// ==========================================

const $ = (id) => document.getElementById(id);


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentUser = null;
let currentProfile = null;


// ==========================================
// CURRENCY FORMAT
// ==========================================

function formatCurrency(amount) {

    const value = Number(amount || 0);

    return "LKR " + value.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(date) {

    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

}


// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message, type = "success") {

    const toast = $("profileToast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;

    toast.className = "profile-toast show " + type;

    clearTimeout(window.profileToastTimer);

    window.profileToastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}


// ==========================================
// LOADING / ERROR
// ==========================================

function showLoading() {

    if ($("profileLoading")) {
        $("profileLoading").style.display = "flex";
    }

    if ($("profileError")) {
        $("profileError").style.display = "none";
    }

}


function hideLoading() {

    if ($("profileLoading")) {
        $("profileLoading").style.display = "none";
    }

}


function showError(message) {

    hideLoading();

    if ($("profileError")) {
        $("profileError").style.display = "block";
    }

    if ($("profileErrorMessage")) {
        $("profileErrorMessage").textContent = message;
    }

}


// ==========================================
// LOAD AUTHENTICATED USER
// ==========================================

async function loadCurrentUser() {

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {

        window.location.replace("login.html");

        return null;

    }

    currentUser = data.user;

    return data.user;

}


// ==========================================
// LOAD PROFILE FROM SUPABASE
// ==========================================

async function loadProfile() {

    showLoading();

    try {

        // Get authenticated user

        const user = await loadCurrentUser();

        if (!user) return;


        // Get profile

        const { data, error } = await supabase

            .from("profiles")

            .select(`
                id,
                username,
                email,
                avatar_url,
                phone,
                wallet_balance,
                total_orders,
                total_spent,
                reward_points,
                is_reseller,
                reseller_status,
                reseller_expires_at,
                created_at
            `)

            .eq("id", user.id)

            .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            throw new Error(
                "Your profile was not found. Please contact support."
            );

        }


        currentProfile = data;


        // Display profile

        displayProfile(user, data);


        hideLoading();


    } catch (error) {

        console.error("Profile Loading Error:", error);

        showError(error.message || "Unable to load your profile.");

    }

}


// ==========================================
// DISPLAY PROFILE
// ==========================================

function displayProfile(user, profile) {

    const username =
        profile.username ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "User";


    const email = user.email || profile.email || "";

    const phone = profile.phone || "Not added";

    const userId = user.id;


    // ======================================
    // PROFILE HEADER
    // ======================================

    if ($("profileName")) {

        $("profileName").textContent = username;

    }


    if ($("profileEmail")) {

        $("profileEmail").textContent = email;

    }


    if ($("profileUserId")) {

        $("profileUserId").textContent = userId;

    }


    // ======================================
    // PROFILE AVATAR
    // ======================================

    const avatar = $("profileAvatar");

    if (avatar) {

        if (profile.avatar_url) {

            avatar.src = profile.avatar_url;

            avatar.style.display = "block";

            avatar.onerror = () => {

                avatar.removeAttribute("src");

                avatar.alt = username;

            };

        } else {

            avatar.removeAttribute("src");

            avatar.alt = username;

        }

    }


    // ======================================
    // ACCOUNT STATUS
    // ======================================

    if ($("accountStatus")) {

        $("accountStatus").textContent =
            user.email_confirmed_at ? "Verified Account" : "Unverified Account";

    }


    // ======================================
    // WALLET BALANCE
    // ======================================

    if ($("profileWalletBalance")) {

        $("profileWalletBalance").textContent =
            formatCurrency(profile.wallet_balance);

    }


    // ======================================
    // REWARD POINTS
    // ======================================

    if ($("profileRewardPoints")) {

        $("profileRewardPoints").textContent =
            Number(profile.reward_points || 0).toFixed(2);

    }


    // ======================================
    // TOTAL SPENT
    // ======================================

    if ($("profileTotalSpent")) {

        $("profileTotalSpent").textContent =
            formatCurrency(profile.total_spent);

    }


    // ======================================
    // PERSONAL INFORMATION
    // ======================================

    if ($("infoFullName")) {

        $("infoFullName").textContent = username;

    }


    if ($("infoEmail")) {

        $("infoEmail").textContent = email;

    }


    if ($("infoPhone")) {

        $("infoPhone").textContent = phone;

    }


    if ($("infoJoinedDate")) {

        $("infoJoinedDate").textContent =
            formatDate(profile.created_at);

    }


    if ($("infoUserId")) {

        $("infoUserId").textContent = userId;

    }


    // ======================================
    // RESELLER STATUS
    // ======================================

    const resellerStatus = profile.reseller_status;

    const resellerActive =
        profile.is_reseller === true &&
        resellerStatus === "active" &&
        (
            !profile.reseller_expires_at ||
            new Date(profile.reseller_expires_at) > new Date()
        );

    // Optional element if available in HTML

    if ($("resellerStatus")) {

        $("resellerStatus").textContent =
            resellerActive ? "Active Reseller" : "Regular User";

    }


}


// ==========================================
// OPEN MODAL
// ==========================================

function openModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.add("active");

    modal.style.display = "flex";

}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("active");

    modal.style.display = "none";

}


// ==========================================
// EDIT PROFILE MODAL
// ==========================================

function openEditProfile() {

    if (!currentProfile) return;

    if ($("editFullName")) {

        $("editFullName").value =
            currentProfile.username || "";

    }

    if ($("editPhone")) {

        $("editPhone").value =
            currentProfile.phone || "";

    }

    openModal("editProfileModal");

}


// ==========================================
// CLOSE EDIT MODAL
// ==========================================

function closeEditProfile() {

    closeModal("editProfileModal");

}


// ==========================================
// SAVE PROFILE
// ==========================================

async function saveProfile(event) {

    event.preventDefault();

    if (!currentUser) return;

    const username = $("editFullName")?.value.trim() || "";

    const phone = $("editPhone")?.value.trim() || "";


    if (username.length < 3) {

        showToast("Username must contain at least 3 characters.", "error");

        return;

    }


    const saveButton = $("saveProfileBtn");

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent = "Saving...";

    }


    try {

        // Update permitted profile columns only

        const { error } = await supabase

            .from("profiles")

            .update({

                username: username,

                phone: phone

            })

            .eq("id", currentUser.id);


        if (error) {

            throw error;

        }


        // Update local user metadata too

        const { error: authError } = await supabase.auth.updateUser({

            data: {

                username: username

            }

        });


        if (authError) {

            console.warn("Metadata update warning:", authError.message);

        }


        // Reload profile

        closeEditProfile();

        await loadProfile();

        showToast("Profile updated successfully!", "success");


    } catch (error) {

        console.error("Profile Update Error:", error);

        showToast(error.message || "Unable to update profile.", "error");

    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent = "Save Changes";

        }

    }

}


// ==========================================
// PASSWORD MODAL
// ==========================================

function openPasswordModal() {

    if ($("changePasswordForm")) {

        $("changePasswordForm").reset();

    }

    openModal("passwordModal");

}


function closePasswordModal() {

    closeModal("passwordModal");

}


// ==========================================
// CHANGE PASSWORD
// ==========================================

async function changePassword(event) {

    event.preventDefault();

    const newPassword = $("newPassword")?.value || "";

    const confirmPassword = $("confirmPassword")?.value || "";


    if (newPassword.length < 8) {

        showToast("Password must contain at least 8 characters.", "error");

        return;

    }


    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {

        showToast("Password must contain letters and numbers.", "error");

        return;

    }


    if (newPassword !== confirmPassword) {

        showToast("Passwords do not match.", "error");

        return;

    }


    const updateButton = $("updatePasswordBtn");

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


        closePasswordModal();

        showToast("Password updated successfully!", "success");


    } catch (error) {

        console.error("Password Update Error:", error);

        showToast(error.message || "Unable to update password.", "error");

    } finally {

        if (updateButton) {

            updateButton.disabled = false;

            updateButton.textContent = "Update Password";

        }

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

    const logoutButton = $("logoutBtn");

    if (logoutButton) {

        logoutButton.disabled = true;

    }


    try {

        const { error } = await supabase.auth.signOut();

        if (error) {

            throw error;

        }

        window.location.replace("login.html");


    } catch (error) {

        console.error("Logout Error:", error);

        showToast("Unable to logout. Please try again.", "error");

        if (logoutButton) {

            logoutButton.disabled = false;

        }

    }

}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {


    // Edit Profile

    $("editProfileBtn")?.addEventListener("click", openEditProfile);

    $("editPersonalInfoBtn")?.addEventListener("click", openEditProfile);


    // Close Edit Modal

    $("closeEditModal")?.addEventListener("click", closeEditProfile);

    $("closeModalOverlay")?.addEventListener("click", closeEditProfile);

    $("cancelEditBtn")?.addEventListener("click", closeEditProfile);


    // Save Profile

    $("editProfileForm")?.addEventListener("submit", saveProfile);


    // Change Password

    $("changePasswordBtn")?.addEventListener("click", openPasswordModal);


    // Close Password Modal

    $("closePasswordModal")?.addEventListener("click", closePasswordModal);

    $("closePasswordOverlay")?.addEventListener("click", closePasswordModal);

    $("cancelPasswordBtn")?.addEventListener("click", closePasswordModal);


    // Update Password

    $("changePasswordForm")?.addEventListener("submit", changePassword);


    // Logout

    $("logoutBtn")?.addEventListener("click", logoutUser);


    // Retry

    $("retryProfileBtn")?.addEventListener("click", loadProfile);


    // ESC key

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeEditProfile();

            closePasswordModal();

        }

    });


}


// ==========================================
// BOTTOM NAVIGATION
// ==========================================

function setupBottomNavigation() {

    const navItems = document.querySelectorAll(
        ".big-store-bottom-nav .nav-item"
    );

    navItems.forEach(item => {

        const href = item.getAttribute("href");

        if (href === "profile.html") {

            item.classList.add("active");

        } else {

            item.classList.remove("active");

        }

    });

}


// ==========================================
// INITIALIZE PROFILE
// ==========================================

async function initializeProfile() {

    setupEventListeners();

    setupBottomNavigation();

    await loadProfile();

}


// ==========================================
// START
// ==========================================

initializeProfile();