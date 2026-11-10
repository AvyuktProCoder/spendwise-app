const activityList = document.querySelector("#activity-list");
const entries = SpendWiseActivity.list();

if (!entries.length) {
  const empty = document.createElement("div");
  empty.className = "activity-empty";
  empty.textContent = "No product searches yet. Search for a product from the dashboard to see it here.";
  activityList.appendChild(empty);
} else {
  entries.forEach((entry) => {
    const row = document.createElement("a");
    row.className = "activity-row";
    row.href = `analysis.html?history=${encodeURIComponent(entry.id)}`;
    const content = document.createElement("span");
    const product = document.createElement("strong");
    product.textContent = entry.product;
    const details = document.createElement("small");
    const date = new Date(entry.createdAt);
    const when = Number.isNaN(date.getTime()) ? "Previous search"
      : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
    const state = SpendWiseActivity.isExpired(entry) ? "Timed out"
      : entry.result ? "Saved result" : entry.status === "failed" ? "No saved result" : "Research in progress";
    details.textContent = `${when} · ${entry.country || "Market unknown"} · ${state}`;
    content.append(product, details);
    const arrow = document.createElement("span");
    arrow.className = "activity-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    row.append(content, arrow);
    activityList.appendChild(row);
  });
}
