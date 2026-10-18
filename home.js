const searchForm = document.querySelector("#product-search");
const productInput = document.querySelector("#product-query");
const countryInput = document.querySelector("#search-country");
const searchStatus = document.querySelector("#search-status");
const chipContainer = document.querySelector("#interest-chips");
const profileSummary = document.querySelector("#profile-summary");
const goalTitle = document.querySelector("#goal-title");
const goalCopy = document.querySelector("#goal-copy");
const currencyCopy = document.querySelector("#currency-copy");
const recentCard = document.querySelector("#recent-card");
const recentAction = document.querySelector("#recent-action");

const defaultCategories = ["Phones", "Gaming", "Fashion", "Headphones"];
const currencyDetails = { INR: "₹ INR", USD: "$ USD", EUR: "€ EUR", GBP: "£ GBP" };
const goalDetails = {
  understand: { title: "Understand what you are paying for", copy: "Break prices into parts, services, and brand costs before deciding what feels fair." },
  alternatives: { title: "Find a smarter alternative", copy: "Compare products that cover what you need without stretching your budget." },
  save: { title: "Make room for bigger goals", copy: "Turn careful product choices into money you can save for something important." },
};

function readStoredJson(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

const profile = readStoredJson("spendwise_profile") || {};
const selectedGoal = goalDetails[profile.primaryGoal] || {
  title: "Spend with more confidence",
  copy: "Compare the real value of products before deciding what deserves your money.",
};
const selectedCurrency = currencyDetails[profile.currency] || "₹ INR";

goalTitle.textContent = selectedGoal.title;
goalCopy.textContent = selectedGoal.copy;
currencyCopy.textContent = selectedCurrency;
profileSummary.textContent = `${selectedGoal.title} · ${profile.currency || "INR"}`;

const savedInterests = Array.isArray(profile.interests) ? profile.interests : [];
const categories = [...new Set([...savedInterests, ...defaultCategories])].slice(0, 4);
categories.forEach((category) => {
  const chip = document.createElement("button");
  chip.className = "interest-chip";
  chip.type = "button";
  chip.textContent = category;
  chip.addEventListener("click", () => {
    productInput.value = category;
    productInput.focus();
    searchStatus.textContent = `Try entering a specific ${category.toLowerCase()} product.`;
  });
  chipContainer.appendChild(chip);
});

function renderRecentActivity(item) {
  if (!item || !item.product) return;
  const date = new Date(item.date);
  const readableDate = Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  recentCard.classList.add("has-activity");
  recentCard.querySelector("h3").textContent = item.product;
  recentCard.querySelector("p").textContent = `${readableDate} · Ready for a deeper cost breakdown`;
  recentAction.textContent = "Open";
}

const savedSearch = readStoredJson("spendwise_recent_search");
if (savedSearch?.country) countryInput.value = savedSearch.country;
else if (profile.country) countryInput.value = profile.country;
renderRecentActivity(savedSearch);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const product = productInput.value.trim();
  if (!product) {
    searchStatus.textContent = "Enter a product name to get started.";
    productInput.focus();
    return;
  }
  if (!countryInput.value) {
    searchStatus.textContent = "Choose a country so we can check the right market prices.";
    countryInput.focus();
    return;
  }
  const country = countryInput.value;
  const recentItem = { product, country, date: new Date().toISOString() };
  localStorage.setItem("spendwise_recent_search", JSON.stringify(recentItem));
  localStorage.setItem("spendwise_search_country", country);
  const usageCount = Number(localStorage.getItem("spendwise_analysis_count")) || 0;
  localStorage.setItem("spendwise_analysis_count", String(usageCount + 1));
  renderRecentActivity(recentItem);
  window.location.href = `analysis.html?product=${encodeURIComponent(product)}&country=${encodeURIComponent(country)}`;
});

recentAction.addEventListener("click", () => {
  const recentItem = readStoredJson("spendwise_recent_search");
  if (recentItem && recentItem.product) {
    const country = recentItem.country || localStorage.getItem("spendwise_search_country") || "";
    window.location.href = `analysis.html?product=${encodeURIComponent(recentItem.product)}&country=${encodeURIComponent(country)}`;
    return;
  }
  productInput.scrollIntoView({ behavior: "smooth", block: "center" });
  productInput.focus();
});
