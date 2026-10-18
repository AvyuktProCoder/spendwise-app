const profileForm = document.querySelector("#profile-form");
const steps = [...document.querySelectorAll(".onboarding-step")];
const nextButton = document.querySelector("#next-button");
const backButton = document.querySelector("#back-button");
const stepLabel = document.querySelector("#step-label");
const progressBar = document.querySelector("#progress-bar");
const interestCount = document.querySelector("#interest-count");
const interestInputs = [...document.querySelectorAll('input[name="interests"]')];
let currentStep = 1;

function selectedInterests() {
  return interestInputs.filter((input) => input.checked);
}

function setError(name, message = "") {
  const target = document.querySelector(`[data-error="${name}"]`);
  if (target) target.textContent = message;
}

function validateStep(step) {
  if (step === 1 && !profileForm.elements.ageBand.value) {
    setError("ageBand", "Choose an age range to continue.");
    return false;
  }

  if (step === 2 && selectedInterests().length === 0) {
    setError("interests", "Choose at least one interest to continue.");
    return false;
  }

  if (step === 3 && !profileForm.elements.primaryGoal.value) {
    setError("primaryGoal", "Choose one main goal to finish.");
    return false;
  }

  return true;
}

function showStep(step) {
  currentStep = step;
  steps.forEach((panel) => {
    const isCurrent = Number(panel.dataset.step) === step;
    panel.hidden = !isCurrent;
    panel.classList.toggle("is-active", isCurrent);
  });

  stepLabel.textContent = `Step ${step} of ${steps.length}`;
  progressBar.style.width = `${(step / steps.length) * 100}%`;
  backButton.hidden = step === 1;
  nextButton.textContent = step === steps.length ? "Continue to SpendWise" : "Continue";
  document.querySelector(".onboarding-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

interestInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const chosen = selectedInterests();

    if (chosen.length > 3) {
      input.checked = false;
      setError("interests", "You can choose up to three interests.");
    } else {
      setError("interests");
    }

    const total = selectedInterests().length;
    interestCount.textContent = `${total} of 3 selected`;
  });
});

profileForm.addEventListener("change", (event) => {
  if (event.target.name) setError(event.target.name);
});

nextButton.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;

  if (currentStep < steps.length) {
    showStep(currentStep + 1);
    return;
  }

  let existingProfile = {};
  try {
    existingProfile = JSON.parse(localStorage.getItem("spendwise_profile")) || {};
  } catch {
    existingProfile = {};
  }

  const profile = {
    ...existingProfile,
    ageBand: profileForm.elements.ageBand.value,
    interests: selectedInterests().map((input) => input.value),
    currency: profileForm.elements.currency.value,
    primaryGoal: profileForm.elements.primaryGoal.value,
    onboardingComplete: true,
  };

  localStorage.setItem("spendwise_profile", JSON.stringify(profile));
  window.location.href = "how-it-works.html";
});

backButton.addEventListener("click", () => {
  if (currentStep > 1) showStep(currentStep - 1);
});

showStep(1);
