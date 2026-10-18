const profileEditor = document.querySelector("#profile-editor");
const editButton = document.querySelector("#edit-profile-button");
const editForm = document.querySelector("#profile-edit-form");
const closeButton = document.querySelector("#close-editor");
const cancelButton = document.querySelector("#cancel-edit");
const formMessage = document.querySelector("#profile-form-message");
const saveStatus = document.querySelector("#profile-save-status");
const interestInputs = [...document.querySelectorAll('input[name="interests"]')];

function readJson(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

let profile = readJson("spendwise_profile");
let account = readJson("spendwise_account");

function displayName() {
  return account.name || profile.name || "SpendWise Explorer";
}

function renderProfile() {
  const name = displayName();
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const recentSearch = readJson("spendwise_recent_search", null);
  const usage = Number(localStorage.getItem("spendwise_analysis_count")) || (recentSearch ? 1 : 0);

  document.querySelector("#profile-name-heading").textContent = name;
  document.querySelector("#profile-avatar").textContent = name.charAt(0).toUpperCase();
  document.querySelector("#name-value").textContent = name;
  document.querySelector("#email-value").textContent = account.email || "Not added";
  document.querySelector("#usage-value").textContent = usage;
  document.querySelector("#age-value").textContent = profile.ageBand || "Not set";
  document.querySelector("#currency-value").textContent = profile.currency || "INR";
  document.querySelector("#goal-value").textContent = profile.primaryGoal || "Make better spending decisions";

  const list = document.querySelector("#profile-interest-list");
  list.replaceChildren();
  (interests.length ? interests : ["No interests selected yet"]).forEach((interest) => {
    const item = document.createElement("span");
    item.textContent = interest;
    list.appendChild(item);
  });
}

function fillEditor() {
  editForm.elements.name.value = displayName();
  editForm.elements.ageBand.value = profile.ageBand || "13-15";
  editForm.elements.currency.value = profile.currency || "INR";
  editForm.elements.primaryGoal.value = profile.primaryGoal || "Make better decisions";
  const selected = new Set(Array.isArray(profile.interests) ? profile.interests : []);
  interestInputs.forEach((input) => { input.checked = selected.has(input.value); });
}

function openEditor() {
  fillEditor();
  profileEditor.hidden = false;
  editButton.setAttribute("aria-expanded", "true");
  profileEditor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditor() {
  profileEditor.hidden = true;
  editButton.setAttribute("aria-expanded", "false");
  formMessage.textContent = "";
}

interestInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const chosen = interestInputs.filter((item) => item.checked);
    if (chosen.length > 3) {
      input.checked = false;
      formMessage.textContent = "Choose up to three interests.";
    } else {
      formMessage.textContent = "";
    }
  });
});

editButton.addEventListener("click", openEditor);
closeButton.addEventListener("click", closeEditor);
cancelButton.addEventListener("click", closeEditor);

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editForm.checkValidity()) { editForm.reportValidity(); return; }

  const interests = interestInputs.filter((input) => input.checked).map((input) => input.value);
  if (!interests.length) {
    formMessage.textContent = "Choose at least one interest.";
    return;
  }

  account = { ...account, name: editForm.elements.name.value.trim() };
  profile = {
    ...profile,
    name: account.name,
    ageBand: editForm.elements.ageBand.value,
    currency: editForm.elements.currency.value,
    primaryGoal: editForm.elements.primaryGoal.value,
    interests,
    onboardingComplete: true,
  };

  localStorage.setItem("spendwise_account", JSON.stringify(account));
  localStorage.setItem("spendwise_profile", JSON.stringify(profile));
  renderProfile();
  closeEditor();
  saveStatus.textContent = "Your profile changes have been saved.";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderProfile();
