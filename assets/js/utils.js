// Shared helpers used by every feature script.

import { CONFIG } from "./config.js";

const ICONS = "assets/img/icons.svg";

/** Returns the markup for a sprite icon. */
export function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="${ICONS}#i-${name}"></use></svg>`;
}

/** Escapes text before it goes into innerHTML. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Loads data/<name>.json. Throws an Error with a friendly message on failure. */
export async function loadData(name) {
  let response;
  try {
    response = await fetch(`data/${name}.json`, { cache: "no-cache" });
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new Error(`The file data/${name}.json did not load (error ${response.status}).`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`The file data/${name}.json has a formatting mistake. Check commas and quotes.`);
  }
}

/** Renders a loading skeleton into a container. */
export function renderLoading(container, count = 6) {
  container.setAttribute("aria-busy", "true");
  container.innerHTML = `<div class="skeleton-grid" aria-hidden="true">${'<div class="skeleton"></div>'.repeat(count)}</div><p class="visually-hidden">Loading</p>`;
}

/** Renders a friendly error with a retry button. */
export function renderError(container, message, onRetry) {
  container.removeAttribute("aria-busy");
  container.innerHTML = `
    <div class="state state-error" role="alert">
      <span class="icon-tile">${icon("alert")}</span>
      <h3>This section did not load</h3>
      <p>${esc(message)}</p>
      ${onRetry ? '<button type="button" class="btn btn-secondary btn-sm" data-retry>Try again</button>' : ""}
    </div>`;
  if (onRetry) container.querySelector("[data-retry]").addEventListener("click", onRetry);
}

/** Renders an empty state. The action is optional: { label, onClick }. */
export function renderEmpty(container, { title, text, action } = {}) {
  container.removeAttribute("aria-busy");
  container.innerHTML = `
    <div class="state">
      <span class="icon-tile is-blue">${icon("search")}</span>
      <h3>${esc(title || "Nothing matches")}</h3>
      <p>${esc(text || "Try a different search or clear the filters.")}</p>
      ${action ? `<button type="button" class="btn btn-secondary btn-sm" data-empty-action>${esc(action.label)}</button>` : ""}
    </div>`;
  if (action) container.querySelector("[data-empty-action]").addEventListener("click", action.onClick);
}

let toastRegion;

/** Shows a short confirmation message. */
export function toast(message) {
  if (!toastRegion) {
    toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("role", "status");
    toastRegion.setAttribute("aria-live", "polite");
    document.body.append(toastRegion);
  }
  const node = document.createElement("div");
  node.className = "toast";
  node.innerHTML = `${icon("check")}<span>${esc(message)}</span>`;
  toastRegion.append(node);
  setTimeout(() => {
    node.classList.add("is-leaving");
    setTimeout(() => node.remove(), 300);
  }, 2400);
}

/** Copies text to the clipboard, with a fallback for older browsers. */
export async function copyText(text, message = "Copied to clipboard") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("copy failed");
    }
    toast(message);
    return true;
  } catch {
    toast("Copy did not work. Select the text and copy it by hand.");
    return false;
  }
}

/** localStorage wrapper that never throws (private mode, full storage). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable: nothing to remove */
    }
  }
};

export function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lower-case text used for search matching. */
export function searchable(...parts) {
  return parts
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/* Contact links */

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function telHref(phone) {
  const d = digits(phone);
  return d ? `tel:+${d.length === 10 ? CONFIG.whatsappCountryCode + d : d}` : "";
}

export function whatsappHref(number, text = "") {
  let d = digits(number);
  if (!d) return "";
  if (d.length === 10) d = CONFIG.whatsappCountryCode + d;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mailHref(email, subject = "", body = "") {
  if (!email) return "";
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${email}${query ? `?${query}` : ""}`;
}

/** Formats a yyyy-mm-dd date as "12 Oct 2026". */
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Formats a number as Indian rupees. */
export function formatRupees(value) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return "";
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Reads a query string value. */
export function param(name) {
  return new URLSearchParams(location.search).get(name);
}
