// Project Starter: turns the guided form into a live, printable Project Brief.
// Nothing is stored; the page warns before leaving with unsaved answers.

import { esc, copyText, toast, formatDate, formatRupees } from "./utils.js";

const form = document.querySelector("[data-starter]");
const brief = document.querySelector("[data-brief]");
const dateError = document.querySelector("[data-date-error]");
const toChecklist = document.querySelector("[data-to-checklist]");
const aiLinks = document.querySelectorAll("[data-ai-link]");

const TYPE_NAMES = {
  "service-project": "Service Project",
  fundraiser: "Fundraiser",
  workshop: "Workshop",
  seminar: "Seminar",
  "awareness-campaign": "Awareness Campaign",
  "club-meeting": "Club Meeting",
  "outdoor-event": "Outdoor Event"
};

const lines = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function values() {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((k) => (data[k] = String(data[k]).trim()));
  return data;
}

function hasContent(v) {
  return Object.values(v).some(Boolean);
}

function dateRange(v) {
  if (v.start && v.end) return `${formatDate(v.start)} to ${formatDate(v.end)}`;
  return formatDate(v.start || v.end);
}

// Each section: [title, value, kind] where kind is "text" or "list".
function sections(v) {
  const budget = [formatRupees(v.budget), v.budgetNotes].filter(Boolean).join(". ");
  return [
    ["Cause or area", v.cause, "text"],
    ["Problem being addressed", v.problem, "text"],
    ["Target beneficiaries", v.beneficiaries, "text"],
    ["Objectives", lines(v.objectives), "list"],
    ["Expected impact", v.impact, "text"],
    ["Estimated budget", budget, "text"],
    ["Team and roles", lines(v.team), "list"],
    ["Timeline", [dateRange(v) && `Dates: ${dateRange(v)}`, ...lines(v.timeline)].filter(Boolean), "list"],
    ["Resources needed", lines(v.resources), "list"],
    ["Partners or CSR support needed", v.partners, "text"]
  ].filter(([, value]) => (Array.isArray(value) ? value.length : value));
}

function render() {
  const v = values();

  const badDates = v.start && v.end && v.end < v.start;
  dateError.textContent = badDates ? "The end date is before the start date." : "";

  if (!hasContent(v)) {
    brief.innerHTML = `
      <div class="brief-empty">
        <p class="brief-empty-title">Your brief appears here</p>
        <p>Start with the project name. Every answer you add shows up in this brief.</p>
      </div>`;
  } else {
    const meta = ["Project brief", v.club, TYPE_NAMES[v.type], dateRange(v)].filter(Boolean);
    brief.innerHTML = `
      <header class="brief-header">
        <h2 class="brief-name">${esc(v.name || "Untitled project")}</h2>
        <p class="brief-meta">${meta.map(esc).join("  ·  ")}</p>
      </header>
      ${sections(v)
        .map(
          ([title, value, kind]) => `
        <section class="brief-section">
          <h3>${esc(title)}</h3>
          ${kind === "list" ? `<ul>${value.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>${esc(value).replace(/\n/g, "<br>")}</p>`}
        </section>`
        )
        .join("")}`;
  }

  const params = new URLSearchParams();
  if (v.type) params.set("type", v.type);
  if (v.name) params.set("name", v.name);
  toChecklist.href = `checklist.html${params.toString() ? `?${params}` : ""}`;

  const ai = new URLSearchParams();
  if (v.name) ai.set("project", v.name);
  if (v.club) ai.set("club", v.club);
  if (v.cause) ai.set("cause", v.cause);
  aiLinks.forEach((link) => {
    const hash = link.getAttribute("href").split("#")[1];
    link.href = `ai-shortcut.html${ai.toString() ? `?${ai}` : ""}#${hash}`;
  });
}

function asText() {
  const v = values();
  const out = [`*PROJECT BRIEF: ${v.name || "Untitled project"}*`];
  const meta = [v.club, TYPE_NAMES[v.type], dateRange(v)].filter(Boolean);
  if (meta.length) out.push(meta.join(" | "));
  sections(v).forEach(([title, value, kind]) => {
    out.push("", `*${title}*`);
    if (kind === "list") value.forEach((item) => out.push(`- ${item}`));
    else out.push(value);
  });
  out.push("", "Made with A4 WAYPOINT, Leo District 3231 A4");
  return out.join("\n");
}

let dirty = false;

form.addEventListener("input", () => {
  dirty = hasContent(values());
  render();
});

form.addEventListener("submit", (event) => event.preventDefault());

document.querySelector("[data-clear-form]").addEventListener("click", () => {
  if (hasContent(values()) && !window.confirm("Clear every answer in the form?")) return;
  form.reset();
  dirty = false;
  render();
  document.getElementById("f-name").focus();
});

document.querySelector("[data-print]").addEventListener("click", () => window.print());

document.querySelector("[data-pdf]").addEventListener("click", () => {
  toast('Choose "Save as PDF" as the printer.');
  setTimeout(() => window.print(), 400);
});

document.querySelector("[data-copy]").addEventListener("click", () => {
  if (!hasContent(values())) {
    toast("Fill in the form first.");
    return;
  }
  copyText(asText(), "Brief copied. Paste it in WhatsApp.");
});

// Links from SHUFFLE carry an idea in the URL: fill those fields to start.
const PREFILL_FIELDS = ["name", "cause", "type", "objectives", "budgetNotes"];
const incoming = new URLSearchParams(location.search);
PREFILL_FIELDS.forEach((field) => {
  const value = incoming.get(field);
  const input = form.elements.namedItem(field);
  if (value && input) input.value = value.slice(0, 500);
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

render();
