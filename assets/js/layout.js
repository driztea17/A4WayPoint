// Shared page chrome: mobile menu, header shadow, footer social links and year.

import { CONFIG } from "./config.js";

function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("mobile-nav");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  window.matchMedia("(min-width: 960px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

function initHeaderShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initSocialLinks() {
  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = CONFIG.social[link.dataset.social];
    const item = link.closest("li") || link;
    if (url) {
      link.href = url;
      item.hidden = false;
    } else {
      item.hidden = true;
    }
  });
}

// "Suggest a resource" links open the form from config.js, or a pre-filled email.
function initSuggestLinks() {
  const links = document.querySelectorAll("[data-suggest]");
  if (!links.length) return;
  const body = [
    "Hi A4 WAYPOINT team,",
    "",
    "I would like to suggest a resource.",
    "",
    "Category (Venue / Vendor / Resource Bank / Industry CSR):",
    "Name:",
    "Area:",
    "Contact number or email:",
    "Approx cost or price range:",
    "Why it is useful:",
    "",
    "Suggested by (name and club):"
  ].join("\n");
  const href = CONFIG.suggestFormUrl
    ? CONFIG.suggestFormUrl
    : `mailto:${CONFIG.suggestEmail}?subject=${encodeURIComponent("A4 WAYPOINT: resource suggestion")}&body=${encodeURIComponent(body)}`;
  links.forEach((link) => {
    link.href = href;
    if (CONFIG.suggestFormUrl) {
      link.target = "_blank";
      link.rel = "noopener";
    }
  });
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

initMobileMenu();
initHeaderShadow();
initSocialLinks();
initSuggestLinks();
initYear();
