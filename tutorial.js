const tutorialSteps = [...document.querySelectorAll("[data-tutorial-step]")];
const tutorialDots = [...document.querySelectorAll(".tutorial-progress span")];
const tutorialBack = document.querySelector("#tutorial-back");
const tutorialNext = document.querySelector("#tutorial-next");
let tutorialStep = 1;

function showTutorialStep(step) {
  tutorialStep = step;
  tutorialSteps.forEach((panel) => {
    const active = Number(panel.dataset.tutorialStep) === step;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  tutorialDots.forEach((dot, index) => dot.classList.toggle("is-active", index < step));
  tutorialBack.hidden = step === 1;
  tutorialNext.textContent = step === tutorialSteps.length ? "Get started" : "Next";
}

tutorialNext.addEventListener("click", () => {
  if (tutorialStep < tutorialSteps.length) {
    showTutorialStep(tutorialStep + 1);
    return;
  }
  localStorage.setItem("spendwise_tutorial_complete", "true");
  window.location.href = "home.html";
});

tutorialBack.addEventListener("click", () => showTutorialStep(tutorialStep - 1));
