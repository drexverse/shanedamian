const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");
const themeGlyph = themeToggle.querySelector(".theme-glyph");
const colorSchemePreference = window.matchMedia("(prefers-color-scheme: dark)");
const menuToggle = document.querySelector("#menu-toggle");
const navLinks = document.querySelector("#nav-links");
const themeModes = ["system", "light", "dark"];
const themePreferenceVersion = "2";

let themePreference = "system";
try {
  const savedTheme = localStorage.getItem("shane-theme");
  const savedVersion = localStorage.getItem("shane-theme-version");
  if (savedVersion !== themePreferenceVersion) {
    localStorage.setItem("shane-theme", "system");
    localStorage.setItem("shane-theme-version", themePreferenceVersion);
  } else if (themeModes.includes(savedTheme)) {
    themePreference = savedTheme;
  }
} catch {}

function updateThemeControl() {
  const isDark = themePreference === "dark" || (themePreference === "system" && colorSchemePreference.matches);
  root.dataset.theme = isDark ? "dark" : "light";
  themeGlyph.textContent = themePreference === "system" ? "◐" : isDark ? "◑" : "☼";
  const nextMode = themeModes[(themeModes.indexOf(themePreference) + 1) % themeModes.length];
  const themeName = themePreference[0].toUpperCase() + themePreference.slice(1);
  const nextThemeName = nextMode[0].toUpperCase() + nextMode.slice(1);
  themeToggle.setAttribute("aria-label", `Theme: ${themeName}. Activate to switch to ${nextThemeName}.`);
  themeToggle.title = `Theme: ${themeName}`;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#070a12" : "#f7f8fc";
}

themeToggle.addEventListener("click", () => {
  themePreference = themeModes[(themeModes.indexOf(themePreference) + 1) % themeModes.length];
  updateThemeControl();
  try {
    localStorage.setItem("shane-theme", themePreference);
    localStorage.setItem("shane-theme-version", themePreferenceVersion);
  } catch {}
});
function handleColorSchemeChange() {
  if (themePreference === "system") updateThemeControl();
}

if (typeof colorSchemePreference.addEventListener === "function") {
  colorSchemePreference.addEventListener("change", handleColorSchemeChange);
} else {
  colorSchemePreference.addListener(handleColorSchemeChange);
}
window.addEventListener("focus", handleColorSchemeChange);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) handleColorSchemeChange();
});
updateThemeControl();

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("is-open", !isOpen);
});
navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    navLinks.classList.remove("is-open");
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 2}deg`);
      card.style.setProperty("--tilt-y", `${x * 2}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  const requiredFields = [...contactForm.querySelectorAll("[data-error]")];
  const submitButton = contactForm.querySelector(".submit-button");
  const submitLabel = submitButton.querySelector(".submit-label");
  const formStatus = contactForm.querySelector("#form-status");
  let isProcessing = false;

  function validateContactField(field) {
    const value = field.value.trim();
    const fieldName = field.labels[0].textContent.replace("*", "").trim().toLowerCase();
    let errorMessage = "";

    if (field.required && !value) {
      errorMessage = `Please enter your ${fieldName}.`;
    } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMessage = "Please enter a valid email address.";
    }

    field.setAttribute("aria-invalid", String(Boolean(errorMessage)));
    field.closest(".form-field").classList.toggle("has-error", Boolean(errorMessage));
    document.querySelector(`#${field.dataset.error}`).textContent = errorMessage;
    return !errorMessage;
  }

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateContactField(field);
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isProcessing) return;

    const isValid = requiredFields.map(validateContactField).every(Boolean);
    if (!isValid) {
      formStatus.textContent = "Please review the highlighted fields.";
      requiredFields.find((field) => field.getAttribute("aria-invalid") === "true").focus();
      return;
    }

    const formData = new FormData(contactForm);
    const senderName = String(formData.get("name")).trim();
    const senderEmail = String(formData.get("email")).trim();
    const subject = String(formData.get("subject") || "").trim() || `A note from ${senderName}`;
    const message = String(formData.get("message")).trim();
    const body = `Name: ${senderName}\nEmail: ${senderEmail}\n\n${message}`;
    const mailtoUrl = `mailto:don.damianz@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    isProcessing = true;
    submitButton.disabled = true;
    submitLabel.textContent = "Opening email...";
    formStatus.textContent = "MESSAGE READY. Your email app should open with your message; send it there to complete delivery.";
    window.location.href = mailtoUrl;

    window.setTimeout(() => {
      isProcessing = false;
      submitButton.disabled = false;
      submitLabel.textContent = "Send message";
    }, 1500);
  });
}

const mediaFilters = document.querySelector("#media-filters");
if (mediaFilters) {
  const mediaItems = [...document.querySelectorAll(".media-entry[data-category]")];

  mediaFilters.addEventListener("click", (event) => {
    const selectedFilter = event.target.closest("button[data-filter]");
    if (!selectedFilter || !mediaFilters.contains(selectedFilter)) return;

    const activeCategory = selectedFilter.dataset.filter;
    mediaFilters.querySelectorAll("button[data-filter]").forEach((button) => {
      const isActive = button === selectedFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    mediaItems.forEach((item) => {
      item.hidden = activeCategory !== "all" && item.dataset.category !== activeCategory;
    });
  });
}
