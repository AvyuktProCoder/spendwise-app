const searchForm = document.querySelector("#product-search");
const productInput = document.querySelector("#product-query");
const countryInput = document.querySelector("#search-country");
const searchStatus = document.querySelector("#search-status");
const profileSummary = document.querySelector("#profile-summary");
const goalTitle = document.querySelector("#goal-title");
const goalCopy = document.querySelector("#goal-copy");
const currencyCopy = document.querySelector("#currency-copy");

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

const savedSearch = readStoredJson("spendwise_recent_search");
if (savedSearch?.country) countryInput.value = savedSearch.country;
else if (profile.country) countryInput.value = profile.country;

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
  const activityId = SpendWiseActivity.start(product, country);
  window.location.href = `analysis.html?product=${encodeURIComponent(product)}&country=${encodeURIComponent(country)}&activity=${encodeURIComponent(activityId)}`;
});
