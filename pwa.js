if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("./sw.js", document.currentScript?.src || location.href))
      .catch((error) => console.error("SpendWise offline support could not start:", error));
  });
}
