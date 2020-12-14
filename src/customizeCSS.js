let root = document.documentElement;

const customizeCssForm = document.getElementById("customizeCssForm");

const customizeCssFormPrimaryColor = document.getElementById(
  "customizeCssFormPrimaryColor"
);
const customizeCssFormSpacing = document.getElementById(
  "customizeCssFormSpacing"
);

customizeCssForm.addEventListener("submit", (e) => {
  e.preventDefault();
  root.style.setProperty("--primary-color", customizeCssFormPrimaryColor.value);
  root.style.setProperty("--spacing-factor", customizeCssFormSpacing.value);
});
