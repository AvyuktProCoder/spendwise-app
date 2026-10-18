const authMode = document.body.dataset.authMode;
const authForm = document.querySelector(".auth-form");
const alternativeAuthButton = document.querySelector("[data-auth-entry]");

function hasCompletedProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem("spendwise_profile"));
    return profile?.onboardingComplete === true;
  } catch {
    return false;
  }
}

function continueAfterAuthentication() {
  if (authMode === "login" && hasCompletedProfile()) {
    window.location.href = "home.html";
    return;
  }

  window.location.href = "profile-onboarding.html";
}

function saveAccountDetails() {
  if (authMode !== "signup" || !authForm) return;
  const name = authForm.elements.username?.value.trim();
  const email = authForm.elements.email?.value.trim();
  localStorage.setItem("spendwise_account", JSON.stringify({ name, email }));
}

authForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!authForm.checkValidity()) {
    authForm.reportValidity();
    return;
  }

  saveAccountDetails();
  continueAfterAuthentication();
});

alternativeAuthButton?.addEventListener("click", continueAfterAuthentication);
