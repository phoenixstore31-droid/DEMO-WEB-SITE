import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SUPABASE CONFIG
const SUPABASE_URL = "https://zzxzrrntyvqbhyzuhaso.supabase.co";

// Supabase Dashboard -> Project Settings -> API Keys
// Current project's Publishable key paste here.
const SUPABASE_KEY = "sb_publishable_7NpKLvkhQsF3LvPsrXNQdg_z6mIRnDO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENT HELPER
const el = (id) => document.getElementById(id);

// ELEMENTS
const loading = el("profileLoading");
const errorBox = el("profileError");
const errorMessage = el("profileErrorMessage");

const nameElement = el("profileName");
const emailElement = el("profileEmail");
const phoneElement = el("infoPhone");
const avatarElement = el("profileAvatar");

const userIdElement = el("profileUserId");
const infoUserId = el("infoUserId");

const joinedElement = el("infoJoinedDate");
const fullNameElement = el("infoFullName");
const infoEmailElement = el("infoEmail");

const walletElement = el("profileWalletBalance");
const rewardsElement = el("profileRewardPoints");
const spentElement = el("profileTotalSpent");

const editModal = el("editProfileModal");
const passwordModal = el("passwordModal");

const editForm = el("editProfileForm");
const passwordForm = el("changePasswordForm");

const toastElement = el("profileToast");

// CURRENT USER
let currentUser = null;

// LOADING
function showLoading(show) {
    if (loading) {
        loading.style.display = show ? "flex" : "none";
    }
}

// ERROR
function showError(message) {
    if (errorBox) {
        if (errorMessage) {
            errorMessage.textContent = message;
        }

        errorBox.style.display = "flex";
    } else {
        alert(message);
    }
}

// HIDE ERROR
function hideError() {
    if (errorBox) {
        errorBox.style.display = "none";
    }
}

// TOAST
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

// MODAL
function openModal(modal) {
    if (modal) {
        modal.classList.add("show");
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove("show");
    }
}

// PROFILE IMAGE
function setProfileAvatar(avatar, name) {
    if (!avatarElement) return;

    avatarElement.innerHTML = "";

    if (avatar) {
        const image = document.createElement("img");

        image.src = avatar;
        image.alt = name;
        image.referrerPolicy = "no-referrer";

        image.onerror = () => {
            avatarElement.innerHTML = '<i class="fas fa-user"></i>';
        };

        avatarElement.appendChild(image);
    } else {
        avatarElement.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// LOAD PROFILE
async function loadProfile() {
    showLoading(true);
    hideError();

    try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        const user = data.user;

        if (!user) {
            window.location.replace("register.html");
            return;
        }

        currentUser = user;

        const metadata = user.user_metadata || {};

        const fullName =
            metadata.full_name ||
            metadata.name ||
            user.email?.split("@")[0] ||
            "BIG STORE User";

        const email = user.email || "No email";

        const phone = metadata.phone || "Not added";

        const avatar =
            metadata.avatar_url ||
            metadata.picture ||
            "";

        const joinedDate = user.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : "Not available";

        // HERO DETAILS
        if (nameElement) nameElement.textContent = fullName;
        if (emailElement) emailElement.textContent = email;

        if (userIdElement) {
            userIdElement.textContent = user.id;
        }

        // PERSONAL INFORMATION
        if (fullNameElement) {
            fullNameElement.textContent = fullName;
        }

        if (infoEmailElement) {
            infoEmailElement.textContent = email;
        }

        if (phoneElement) {
            phoneElement.textContent = phone;
        }

        if (joinedElement) {
            joinedElement.textContent = joinedDate;
        }

        if (infoUserId) {
            infoUserId.textContent = user.id;
        }

        // GOOGLE PROFILE PHOTO
        setProfileAvatar(avatar, fullName);

        // ACCOUNT STATUS
        const accountStatus = el("accountStatus");

        if (accountStatus) {
            accountStatus.textContent = "Verified Account";
        }

        // WALLET PLACEHOLDERS
        // Real database connection pending.
        if (walletElement) {
            walletElement.textContent = "LKR 0.00";
        }

        if (rewardsElement) {
            rewardsElement.textContent = "0";
        }

        if (spentElement) {
            spentElement.textContent = "LKR 0.00";
        }

    } catch (error) {
        console.error("Profile Error:", error);

        showError(
            error.message === "Invalid API key"
                ? "Supabase API key is invalid. Please check your project settings."
                : "Unable to load profile. Please try again."
        );

    } finally {
        showLoading(false);
    }
}

// EDIT PROFILE OPEN
function openEditProfile() {
    if (!currentUser) return;

    const metadata = currentUser.user_metadata || {};

    const nameInput = el("editFullName");
    const phoneInput = el("editPhone");

    if (nameInput) {
        nameInput.value =
            metadata.full_name ||
            metadata.name ||
            "";
    }

    if (phoneInput) {
        phoneInput.value = metadata.phone || "";
    }

    openModal(editModal);
}

// EDIT PROFILE BUTTONS
el("editProfileBtn")?.addEventListener("click", openEditProfile);

el("editPersonalInfoBtn")?.addEventListener("click", openEditProfile);

el("closeEditModal")?.addEventListener("click", () => {
    closeModal(editModal);
});

el("cancelEditBtn")?.addEventListener("click", () => {
    closeModal(editModal);
});

el("closeModalOverlay")?.addEventListener("click", () => {
    closeModal(editModal);
});

// SAVE PROFILE
editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = el("editFullName")?.value.trim();
    const phone = el("editPhone")?.value.trim();

    if (!name) {
        showToast("Please enter your full name.");
        return;
    }

    const saveButton = el("saveProfileBtn");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: name,
                name: name,
                phone: phone
            }
        });

        if (error) throw error;

        showToast("Profile updated successfully!");

        closeModal(editModal);

        await loadProfile();

    } catch (error) {
        console.error("Update Error:", error);
        showToast(error.message || "Profile update failed.");

    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML =
                '<i class="fas fa-check"></i> Save Changes';
        }
    }
});

// CHANGE PASSWORD
el("changePasswordBtn")?.addEventListener("click", () => {
    const provider = currentUser?.app_metadata?.provider;

    if (provider === "google") {
        showToast("Google account password must be managed through Google.");
        return;
    }

    openModal(passwordModal);
});

el("closePasswordModal")?.addEventListener("click", () => {
    closeModal(passwordModal);
});

el("cancelPasswordBtn")?.addEventListener("click", () => {
    closeModal(passwordModal);
});

el("closePasswordOverlay")?.addEventListener("click", () => {
    closeModal(passwordModal);
});

// UPDATE PASSWORD
passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = el("newPassword")?.value;
    const confirmPassword = el("confirmPassword")?.value;

    if (!password || password.length < 6) {
        showToast("Password must contain at least 6 characters.");
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
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        showToast("Password updated successfully!");

        passwordForm.reset();
        closeModal(passwordModal);

    } catch (error) {
        console.error("Password Error:", error);
        showToast(error.message || "Password update failed.");

    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<i class="fas fa-lock"></i> Update Password';
        }
    }
});

// LOGOUT
async function logout() {
    const confirmed = confirm("Are you sure you want to sign out?");

    if (!confirmed) return;

    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        window.location.replace("register.html");

    } catch (error) {
        console.error("Logout Error:", error);
        showToast("Unable to sign out. Please try again.");
    }
}

el("logoutBtn")?.addEventListener("click", logout);

// RETRY
el("retryProfileBtn")?.addEventListener("click", loadProfile);

// AUTH LISTENER
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
        window.location.replace("register.html");
    }
});

// INITIAL LOAD
loadProfile();