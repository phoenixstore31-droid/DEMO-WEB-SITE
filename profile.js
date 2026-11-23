import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================================
// BIG STORE - SUPABASE CONNECTION
// =====================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://tvhgxlqqeklrdlgbkosa.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

// ==========================================
// ELEMENT HELPER
// ==========================================

const el = (id) => document.getElementById(id);

// ==========================================
// ELEMENTS
// ==========================================

const loading = el("profileLoading");
const errorBox = el("profileError");
const errorMessage = el("profileErrorMessage");

const editModal = el("editProfileModal");
const passwordModal = el("passwordModal");

const editForm = el("editProfileForm");
const passwordForm = el("changePasswordForm");

const toastElement = el("profileToast");

// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;
let currentProfile = null;

// ==========================================
// UI HELPERS
// ==========================================

function showLoading(show) {

if (loading) {
    loading.style.display = show ? "block" : "none";
}

}

function showError(message) {

if (errorMessage) {
    errorMessage.textContent = message;
}

if (errorBox) {
    errorBox.style.display = "block";
}

}

function hideError() {

if (errorBox) {
    errorBox.style.display = "none";
}

}

function showToast(message) {

if (!toastElement) {
    alert(message);
    return;
}

toastElement.textContent = message;

toastElement.classList.add("show");

clearTimeout(window.bigStoreToastTimer);

window.bigStoreToastTimer = setTimeout(() => {

    toastElement.classList.remove("show");

}, 3000);

}

function openModal(modal) {

if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

}

function closeModal(modal) {

if (modal) {
    modal.classList.remove("show");
}

if (
    !editModal?.classList.contains("show") &&
    !passwordModal?.classList.contains("show")
) {
    document.body.style.overflow = "";
}

}

// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(amount) {

const value = Number(amount);

if (!Number.isFinite(value)) {
    return "LKR 0.00";
}

return "LKR " + value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

}

// ==========================================
// PROFILE AVATAR
// ==========================================

function setProfileAvatar(avatar, name) {

const avatarElement = el("profileAvatar");

if (!avatarElement) return;

avatarElement.innerHTML = "";

if (avatar) {

    const image = document.createElement("img");

    image.src = avatar;
    image.alt = name || "Profile";
    image.referrerPolicy = "no-referrer";

    image.onerror = () => {

        avatarElement.innerHTML =
            '<i class="fas fa-user"></i>';

    };

    avatarElement.appendChild(image);

} else {

    avatarElement.innerHTML =
        '<i class="fas fa-user"></i>';

}

}

// ==========================================
// LOAD PROFILE FROM DATABASE
// ==========================================

async function loadProfile() {

showLoading(true);
hideError();

try {

    // GET AUTHENTICATED USER

    const {
        data: authData,
        error: authError
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {

        window.location.replace("login.html");

        return;

    }

    currentUser = user;

    const metadata = user.user_metadata || {};


    // ==================================
    // FETCH PROFILE TABLE
    // ==================================

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {

        throw new Error(
            "Your profile was not found in the database. Please contact support."
        );

    }

    currentProfile = profile;


    // ==================================
    // PROFILE DETAILS
    // ==================================

    const fullName =
        profile.full_name ||
        metadata.full_name ||
        metadata.name ||
        "BIG STORE User";

    const email =
        user.email ||
        profile.email ||
        "No email";

    const phone =
        metadata.phone ||
        "Not added";

    const avatar =
        metadata.avatar_url ||
        metadata.picture ||
        "";

    const joinedDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString(
            "en-LK",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        )
        : "Not available";


    // ==================================
    // HERO INFORMATION
    // ==================================

    if (el("profileName")) {
        el("profileName").textContent = fullName;
    }

    if (el("profileEmail")) {
        el("profileEmail").textContent = email;
    }

    if (el("profileUserId")) {
        el("profileUserId").textContent = user.id;
    }

    if (el("accountStatus")) {
        el("accountStatus").textContent = "Active Account";
    }


    // ==================================
    // PERSONAL INFORMATION
    // ==================================

    if (el("infoFullName")) {
        el("infoFullName").textContent = fullName;
    }

    if (el("infoEmail")) {
        el("infoEmail").textContent = email;
    }

    if (el("infoPhone")) {
        el("infoPhone").textContent = phone;
    }

    if (el("infoJoinedDate")) {
        el("infoJoinedDate").textContent = joinedDate;
    }

    if (el("infoUserId")) {
        el("infoUserId").textContent = user.id;
    }


    // ==================================
    // AVATAR
    // ==================================

    setProfileAvatar(avatar, fullName);


    // ==================================
    // LOAD WALLET BALANCE
    // ==================================

    await loadWalletBalance(user.id);


    // ==================================
    // REWARDS AND TOTAL SPENT
    // ==================================

    if (el("profileRewardPoints")) {
        el("profileRewardPoints").textContent =
            "Not available";
    }

    if (el("profileTotalSpent")) {
        el("profileTotalSpent").textContent =
            "Not available";
    }


} catch (error) {

    console.error("PROFILE ERROR:", error);

    showError(
        error.message ||
        "Unable to load your profile. Please try again."
    );

} finally {

    showLoading(false);

}

}

// ==========================================
// LOAD WALLET BALANCE
// ==========================================

async function loadWalletBalance(userId) {

const walletElement = el("profileWalletBalance");

if (walletElement) {
    walletElement.textContent = "Loading...";
}

const {
    data,
    error
} = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

if (error) {

    console.error("WALLET ERROR:", error);

    if (walletElement) {
        walletElement.textContent = "Unavailable";
    }

    return;

}

if (!data) {

    if (walletElement) {
        walletElement.textContent = "LKR 0.00";
    }

    return;

}

if (walletElement) {

    walletElement.textContent =
        formatCurrency(data.balance);

}

}

// ==========================================
// OPEN EDIT PROFILE
// ==========================================

function openEditProfile() {

if (!currentUser || !currentProfile) return;

const metadata = currentUser.user_metadata || {};

const nameInput = el("editFullName");
const phoneInput = el("editPhone");

if (nameInput) {

    nameInput.value =
        currentProfile.full_name || "";

}

if (phoneInput) {

    phoneInput.value =
        metadata.phone || "";

}

openModal(editModal);

}

el("editProfileBtn")?.addEventListener(
"click",
openEditProfile
);

el("editPersonalInfoBtn")?.addEventListener(
"click",
openEditProfile
);

// ==========================================
// CLOSE EDIT MODAL
// ==========================================

el("closeEditModal")?.addEventListener("click", () => {

closeModal(editModal);

});

el("cancelEditBtn")?.addEventListener("click", () => {

closeModal(editModal);

});

el("closeModalOverlay")?.addEventListener("click", () => {

closeModal(editModal);

});

// ==========================================
// SAVE PROFILE
// ==========================================

editForm?.addEventListener("submit", async (event) => {

event.preventDefault();

if (!currentUser) return;

const name = el("editFullName")?.value.trim();

const phone = el("editPhone")?.value.trim() || "";

if (!name) {

    showToast("Please enter your full name.");

    return;

}

if (name.length > 100) {

    showToast("Name is too long.");

    return;

}

const button = el("saveProfileBtn");

if (button) {

    button.disabled = true;

    button.innerHTML = "Saving...";

}

try {

    // UPDATE DATABASE PROFILE

    const {
        data: updatedProfile,
        error: databaseError
    } = await supabase
        .from("profiles")
        .update({
            full_name: name
        })
        .eq("id", currentUser.id)
        .select("id, full_name, email, created_at")
        .single();

    if (databaseError) throw databaseError;


    // UPDATE AUTH METADATA

    const {
        data: authUpdate,
        error: authError
    } = await supabase.auth.updateUser({
        data: {
            full_name: name,
            name: name,
            phone: phone
        }
    });

    if (authError) {

        console.error(
            "Auth metadata update error:",
            authError
        );

        showToast(
            "Name saved. Contact information update failed."
        );

    } else {

        currentUser = authUpdate.user;

        showToast("Profile updated successfully!");

    }


    currentProfile = updatedProfile;

    closeModal(editModal);

    await loadProfile();

} catch (error) {

    console.error("PROFILE UPDATE ERROR:", error);

    if (
        error.code === "42501" ||
        error.message?.toLowerCase().includes("row-level security")
    ) {

        showToast(
            "Database permission required. Please check profile UPDATE policy."
        );

    } else {

        showToast(
            error.message || "Profile update failed."
        );

    }

} finally {

    if (button) {

        button.disabled = false;

        button.innerHTML =
            '<i class="fas fa-check"></i> Save Changes';

    }

}

});

// ==========================================
// CHANGE PASSWORD
// ==========================================

el("changePasswordBtn")?.addEventListener("click", () => {

if (!currentUser) return;

const provider =
    currentUser.app_metadata?.provider;

if (provider === "google") {

    showToast(
        "Google account password must be managed through Google."
    );

    return;

}

openModal(passwordModal);

});

// ==========================================
// CLOSE PASSWORD MODAL
// ==========================================

el("closePasswordModal")?.addEventListener("click", () => {

closeModal(passwordModal);

});

el("cancelPasswordBtn")?.addEventListener("click", () => {

closeModal(passwordModal);

});

el("closePasswordOverlay")?.addEventListener("click", () => {

closeModal(passwordModal);

});

// ==========================================
// UPDATE PASSWORD
// ==========================================

passwordForm?.addEventListener("submit", async (event) => {

event.preventDefault();

const password = el("newPassword")?.value;

const confirmPassword = el("confirmPassword")?.value;

if (!password || password.length < 6) {

    showToast(
        "Password must contain at least 6 characters."
    );

    return;

}

if (password !== confirmPassword) {

    showToast("Passwords do not match.");

    return;

}

const button = el("updatePasswordBtn");

if (button) {

    button.disabled = true;

    button.textContent = "Updating...";

}

try {

    const {
        error
    } = await supabase.auth.updateUser({
        password: password
    });

    if (error) throw error;

    showToast("Password updated successfully!");

    passwordForm.reset();

    closeModal(passwordModal);

} catch (error) {

    console.error("PASSWORD ERROR:", error);

    showToast(
        error.message || "Password update failed."
    );

} finally {

    if (button) {

        button.disabled = false;

        button.innerHTML =
            '<i class="fas fa-lock"></i> Update Password';

    }

}

});

// ==========================================
// LOGOUT
// ==========================================

async function logout() {

const confirmed = confirm(
    "Are you sure you want to sign out?"
);

if (!confirmed) return;

const button = el("logoutBtn");

if (button) {

    button.disabled = true;

    button.textContent = "Signing out...";

}

try {

    const {
        error
    } = await supabase.auth.signOut();

    if (error) throw error;

    window.location.replace("login.html");

} catch (error) {

    console.error("LOGOUT ERROR:", error);

    showToast("Unable to sign out. Please try again.");

    if (button) {
        button.disabled = false;
        button.innerHTML =
            '<i class="fas fa-right-from-bracket"></i> Sign Out';
    }

}

}

el("logoutBtn")?.addEventListener("click", logout);

// ==========================================
// RETRY
// ==========================================

el("retryProfileBtn")?.addEventListener("click", loadProfile);

// ==========================================
// CLOSE MODALS WITH ESCAPE
// ==========================================

document.addEventListener("keydown", (event) => {

if (event.key === "Escape") {

    closeModal(editModal);

    closeModal(passwordModal);

}

});

// ==========================================
// AUTH INITIALIZATION
// ==========================================

async function initializeProfile() {

const {
    data,
    error
} = await supabase.auth.getSession();

if (error) {

    console.error("SESSION ERROR:", error);

    showError("Unable to verify your login session.");

    showLoading(false);

    return;

}

if (!data.session) {

    window.location.replace("login.html");

    return;

}

await loadProfile();

}

// ==========================================
// AUTH STATE LISTENER
// ==========================================

supabase.auth.onAuthStateChange((event) => {

if (event === "SIGNED_OUT") {

    window.location.replace("login.html");

}

});

// ==========================================
// START
// ==========================================

initializeProfile();