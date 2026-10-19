/*
  Data contract for a future research/API response:
  {
    product: "Product name",
    currency: "INR",
    manufacturingTotal: 0, // estimated number, not a display string
    retailPrice: 0,
    components: [{ name: "Display", estimatedCost: 0, share: 0 }],
    manufacturingPlants: [{ id: "plant-1", countryCode: "CN", latitude: 0, longitude: 0 }],
    shippingEstimates: [{ originPlantId: "plant-1", destinationCountryCode: "IN", estimatedCost: 0 }],
    confidence: 0, // number from 0 to 100
    sources: [{ name: "Source name", url: "https://..." }],
    updatedAt: "ISO date string"
  }
  Costs stay variables here. No product-specific costs are hard-coded in the UI.
  Plant locations and route shipping estimates are supplied by future research data.
*/

const params = new URLSearchParams(window.location.search);
const analysisApiUrl = "https://spendwise-api.avyuktnjain.workers.dev/analyze";
const profile = readStoredJson("spendwise_profile") || {};
const recentSearch = readStoredJson("spendwise_recent_search") || {};
const requestedProduct = params.get("product") || recentSearch.product || "Your product";
const countryNames = {
  IN: "India", US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", JP: "Japan", CN: "China", SG: "Singapore",
  AE: "United Arab Emirates", BR: "Brazil", MX: "Mexico", KR: "South Korea",
  ZA: "South Africa", NL: "Netherlands", IT: "Italy", ES: "Spain", SE: "Sweden", NZ: "New Zealand",
};
const countryCoordinates = {
  IN: [20.5937, 78.9629], US: [39.8283, -98.5795], GB: [55.3781, -3.436], CA: [56.1304, -106.3468],
  AU: [-25.2744, 133.7751], DE: [51.1657, 10.4515], FR: [46.2276, 2.2137], JP: [36.2048, 138.2529],
  CN: [35.8617, 104.1954], SG: [1.3521, 103.8198], AE: [23.4241, 53.8478], BR: [-14.235, -51.9253],
  MX: [23.6345, -102.5528], KR: [35.9078, 127.7669], ZA: [-30.5595, 22.9375], NL: [52.1326, 5.2913],
  IT: [41.8719, 12.5674], ES: [40.4637, -3.7492], SE: [60.1282, 18.6435], NZ: [-40.9006, 174.886],
};
const selectedCountry = params.get("country") || recentSearch.country || localStorage.getItem("spendwise_search_country") || "";
const marketCurrencies = {
  IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", DE: "EUR", FR: "EUR", JP: "JPY",
  CN: "CNY", SG: "SGD", AE: "AED", BR: "BRL", MX: "MXN", KR: "KRW", ZA: "ZAR",
  NL: "EUR", IT: "EUR", ES: "EUR", SE: "SEK", NZ: "NZD",
};
const currency = params.get("currency") || marketCurrencies[selectedCountry] || profile.currency || "INR";
const currencyLocale = { INR: "en-IN", USD: "en-US", GBP: "en-GB", EUR: "de-DE", AUD: "en-AU", CAD: "en-CA" };

// The future API can replace these nulls with a fresh, product-specific estimate.
const estimate = {
  product: requestedProduct,
  countryCode: selectedCountry,
  currency,
  manufacturingTotal: null,
  totalCostToMarket: null,
  retailPrice: null,
  components: [],
  manufacturingPlants: [],
  shippingEstimates: [],
  shippingCost: null,
  shippingOrigin: null,
  confidence: null,
  sources: [],
  updatedAt: null,
};

const resultCacheStorageKey = "spendwise_research_cache_v2";
const resultCacheKey = JSON.stringify([requestedProduct.trim().replace(/\s+/g, " ").toLowerCase(), selectedCountry, currency]);
const savedResults = readStoredJson(resultCacheStorageKey);
const storedEntry = Array.isArray(savedResults) ? savedResults.find((entry) => entry?.key === resultCacheKey) : null;
const storedEstimate = storedEntry?.estimate;
function hasCompleteEstimate(data) {
  return Number.isFinite(data?.manufacturingTotal)
    && Number.isFinite(data?.retailPrice)
    && Array.isArray(data?.components)
    && data.components.length > 0
    && data.components.every((component) => Number.isFinite(component?.estimatedCost))
    && Array.isArray(data?.sources)
    && data.sources.length > 0;
}
const hasFreshEstimate = storedEstimate && storedEstimate.currency === currency
  && storedEstimate.countryCode === selectedCountry
  && Number.isFinite(storedEstimate.cacheExpiresAt)
  && storedEstimate.cacheExpiresAt > Date.now()
  && storedEstimate.cacheExpiresAt <= Date.now() + 6 * 60 * 60 * 1000
  && hasCompleteEstimate(storedEstimate);
if (hasFreshEstimate) Object.assign(estimate, storedEstimate);

function saveResearchResult() {
  if (!hasCompleteEstimate(estimate)) return;
  try {
    const entries = readStoredJson(resultCacheStorageKey);
    const freshEntries = (Array.isArray(entries) ? entries : []).filter((entry) =>
      entry?.key !== resultCacheKey && entry?.estimate?.cacheExpiresAt > Date.now());
    // Preserve the original expiry when a result came from the Worker cache.
    const cacheExpiresAt = Number.isFinite(estimate.cacheExpiresAt)
      ? Math.min(estimate.cacheExpiresAt, Date.now() + 6 * 60 * 60 * 1000)
      : Date.now() + 6 * 60 * 60 * 1000;
    freshEntries.unshift({ key: resultCacheKey, estimate: { ...estimate, cacheExpiresAt } });
    localStorage.setItem(resultCacheStorageKey, JSON.stringify(freshEntries.slice(0, 20)));
  } catch { /* Storage may be full or disabled; the current result still displays. */ }
}

function readStoredJson(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function formatMoney(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(currencyLocale[estimate.currency] || undefined, {
    style: "currency",
    currency: estimate.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function distanceKm(start, end) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const [lat1, lon1] = start.map(radians);
  const [lat2, lon2] = end.map(radians);
  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;
  const arc = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function resolveManufacturingRoute(data, destinationCode) {
  const destination = countryCoordinates[destinationCode];
  const plants = Array.isArray(data.manufacturingPlants) ? data.manufacturingPlants : [];
  if (!destination || plants.length === 0) return null;

  const localPlant = plants.find((plant) => plant.countryCode === destinationCode);
  if (localPlant) return { plant: localPlant, shippingCost: 0, local: true };

  const nearbyPlants = plants
    .filter((plant) => Number.isFinite(plant.latitude) && Number.isFinite(plant.longitude))
    .map((plant) => ({ plant, distance: distanceKm(destination, [plant.latitude, plant.longitude]) }))
    .sort((a, b) => a.distance - b.distance);
  const nearestPlant = nearbyPlants[0]?.plant;
  if (!nearestPlant) return null;

  const route = (Array.isArray(data.shippingEstimates) ? data.shippingEstimates : []).find((item) =>
    item.originPlantId === nearestPlant.id && item.destinationCountryCode === destinationCode
  );

  return {
    plant: nearestPlant,
    shippingCost: typeof route?.estimatedCost === "number" ? route.estimatedCost : null,
    local: false,
  };
}

function applyMarketShipping(data, destinationCode) {
  // Preserve a complete market estimate supplied by the research API.
  if (typeof data.totalCostToMarket === "number") return;

  const route = resolveManufacturingRoute(data, destinationCode);
  data.shippingCost = null;
  data.shippingOrigin = null;
  data.totalCostToMarket = null;
  data.components = (Array.isArray(data.components) ? data.components : [])
    .filter((item) => item.name !== "Shipping to market");

  if (!route) return;
  data.shippingOrigin = route.plant.countryCode;

  if (route.local) {
    data.totalCostToMarket = typeof data.manufacturingTotal === "number" ? data.manufacturingTotal : null;
    return;
  }

  if (typeof route.shippingCost !== "number") return;
  data.shippingCost = route.shippingCost;
  data.totalCostToMarket = typeof data.manufacturingTotal === "number"
    ? data.manufacturingTotal + route.shippingCost
    : null;
  data.components.push({ name: "Shipping to market", estimatedCost: route.shippingCost, share: 0 });
}

function renderComponents(components) {
  const list = document.querySelector("#parts-list");
  list.replaceChildren();

  if (!Array.isArray(components) || components.length === 0) {
    const empty = document.createElement("div");
    empty.className = "parts-empty";
    const symbol = document.createElement("span");
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = "◌";
    const title = document.createElement("strong");
    title.textContent = "Cost details will appear here";
    const description = document.createElement("p");
    description.textContent = Number.isFinite(estimate.retailPrice)
      ? "This search found a retail price, but no supported manufacturing cost breakdown. Try a more specific model or search again later."
      : "A supported manufacturing cost breakdown has not been found yet. Try a more specific model or search again later.";
    empty.append(symbol, title, description);
    list.appendChild(empty);
    return;
  }

  components.forEach((component) => {
    const row = document.createElement("div");
    row.className = "part-row";
    const info = document.createElement("div");
    info.className = "part-info";
    const name = document.createElement("strong");
    name.textContent = component.name || "Component";
    const bar = document.createElement("span");
    bar.className = "part-bar";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, Math.max(0, Number(component.share) || 0))}%`;
    bar.appendChild(fill);
    info.append(name, bar);
    const cost = document.createElement("strong");
    cost.className = "part-cost";
    cost.textContent = formatMoney(component.estimatedCost);
    row.append(info, cost);
    list.appendChild(row);
  });
}

function renderAnalysis() {
  applyMarketShipping(estimate, selectedCountry);
  document.title = `${estimate.product} analysis | SpendWise`;
  document.querySelector("#analysis-title").textContent = estimate.product;
  document.querySelector("#analysis-intro").textContent = `Explore how the estimated build cost of ${estimate.product} compares with its price on the shelf.`;
  document.querySelector("#market-country").textContent = countryNames[selectedCountry] || "Not selected";
  document.querySelector("#manufacturing-total").textContent = formatMoney(estimate.totalCostToMarket);
  document.querySelector("#retail-price").textContent = formatMoney(estimate.retailPrice);

  const difference = typeof estimate.retailPrice === "number" && typeof estimate.manufacturingTotal === "number"
    ? estimate.retailPrice - estimate.manufacturingTotal
    : null;
  document.querySelector("#price-difference").textContent = formatMoney(difference);
  document.querySelector("#parts-total").textContent = formatMoney(estimate.totalCostToMarket);
  document.querySelector("#build-caption").textContent = estimate.totalCostToMarket == null ? "Waiting for a source-backed estimate" : "Estimated cost for the selected market";
  document.querySelector("#retail-caption").textContent = estimate.retailPrice == null ? "Waiting for a current market price" : "Current typical selling price";
  document.querySelector("#difference-caption").textContent = difference == null ? "Retail price minus estimated manufacturing cost" : "This difference also supports the wider business";

  renderComponents(estimate.components);

  const sourceNote = document.querySelector("#source-note");
  if (Array.isArray(estimate.sources) && estimate.sources.length) {
    sourceNote.replaceChildren();
    const summary = document.createElement("span");
    summary.textContent = `${estimate.sources.length} source${estimate.sources.length === 1 ? "" : "s"} used for this estimate:`;
    const sourceList = document.createElement("ul");
    estimate.sources.forEach((source) => {
      let parsedUrl;
      try { parsedUrl = new URL(source.url); } catch { return; }
      if (parsedUrl.protocol !== "https:") return;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = parsedUrl.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.name || parsedUrl.hostname;
      item.appendChild(link);
      sourceList.appendChild(item);
    });
    sourceNote.append(summary, sourceList);
  } else {
    sourceNote.textContent = "Sources and confidence will appear here with each researched result.";
  }

  const confidence = Number.isFinite(estimate.confidence) ? Math.min(100, Math.max(0, estimate.confidence)) : null;
  document.querySelector("#confidence-value").textContent = confidence == null ? "—" : `${confidence}%`;
  document.querySelector("#confidence-bar").style.width = confidence == null ? "0%" : `${confidence}%`;

  if (estimate.updatedAt) {
    const updatedAt = new Date(estimate.updatedAt);
    document.querySelector("#updated-note").textContent = Number.isNaN(updatedAt.getTime())
      ? "Estimate date not available."
      : `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(updatedAt)}.`;
  }

  if (hasCompleteEstimate(estimate)) {
    document.querySelector("#data-status").innerHTML = "<span aria-hidden=\"true\"></span> Estimate loaded";
    document.querySelector("#data-status").classList.add("is-loaded");
  } else if (typeof estimate.manufacturingTotal === "number" || typeof estimate.retailPrice === "number") {
    document.querySelector("#data-status").innerHTML = '<span aria-hidden="true"></span> Partial estimate — breakdown unavailable';
    document.querySelector("#data-status").classList.remove("is-loaded");
  }
}

renderAnalysis();
if (hasFreshEstimate) {
  document.querySelector("#data-status").innerHTML = '<span aria-hidden="true"></span> Recent estimate loaded';
} else if (storedEstimate && (Number.isFinite(storedEstimate.manufacturingTotal) || Number.isFinite(storedEstimate.retailPrice))) {
  document.querySelector("#data-status").innerHTML = '<span aria-hidden="true"></span> Previous result was incomplete — researching again';
}

async function loadProductResearch() {
  const dataStatus = document.querySelector("#data-status");
  dataStatus.innerHTML = '<span aria-hidden="true"></span> Researching product…';
  dataStatus.classList.remove("is-loaded");
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 285000);
  const progress = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    dataStatus.innerHTML = `<span aria-hidden="true"></span> Researching product… ${elapsed}s`;
    if (elapsed >= 20) {
      document.querySelector("#source-note").textContent = "Still waiting for the research result. A new product search can take a few minutes; recent saved results load faster.";
    }
  }, 1000);

  try {
    const response = await fetch(analysisApiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: requestedProduct,
        country: countryNames[selectedCountry] || selectedCountry,
        countryCode: selectedCountry,
        currency,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Research request failed.");

    Object.assign(estimate, result, { countryCode: selectedCountry, currency });
    saveResearchResult();
    renderAnalysis();
    if (!hasCompleteEstimate(estimate)) {
      dataStatus.classList.remove("is-loaded");
    }
    if (!Number.isFinite(estimate.manufacturingTotal) && !Number.isFinite(estimate.retailPrice)) {
      dataStatus.innerHTML = '<span aria-hidden="true"></span> Insufficient evidence';
    } else if (!hasCompleteEstimate(estimate)) {
      dataStatus.innerHTML = '<span aria-hidden="true"></span> Partial estimate — breakdown unavailable';
    }
  } catch (error) {
    dataStatus.innerHTML = '<span aria-hidden="true"></span> Research unavailable';
    document.querySelector("#source-note").textContent = error.name === "AbortError"
      ? "The research request took too long. Please try again with the exact product model."
      : error.message || "Could not load a researched estimate. Please try again.";
  } finally {
    clearTimeout(timeout);
    clearInterval(progress);
  }
}

if (!hasFreshEstimate && requestedProduct !== "Your product" && selectedCountry) loadProductResearch();
