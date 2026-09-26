// AI Shortcut: prompt library with category filter, search, fill-in-the-blank
// inputs that update the prompt live, and one-tap copy.

import { icon, esc, loadData, renderLoading, renderError, renderEmpty, copyText, debounce, searchable, param } from "./utils.js";

// Bracketed words that tell the AI what to write, not fields for the member.
const AI_NOTES = new Set(["TO BE FILLED", "TO BE CONFIRMED"]);
const PH = /\[([^\]\n]+)\]/g;

// Values passed from the Project Starter fill these blanks.
const PREFILL = {
  project: ["PROJECT NAME", "PROJECT", "EVENT/PROJECT", "PROJECT/EVENT", "PROJECT IDEA", "EVENT NAME", "EVENT"],
  club: ["CLUB NAME", "CLUB"],
  cause: ["CAUSE"]
};

const catsBox = document.querySelector("[data-cats]");
const searchInput = document.querySelector("[data-search]");
const countEl = document.querySelector("[data-count]");
const results = document.querySelector("[data-results]");
const ruleEl = document.querySelector("[data-rule]");
const clearBlanksBtn = document.querySelector("[data-clear-blanks]");

let data;
let active = "all";
let query = "";
const values = {}; // shared answers by placeholder name, in memory only

function blanks(text) {
  const found = [];
  for (const [, name] of text.matchAll(PH)) {
    if (!AI_NOTES.has(name) && !found.includes(name)) found.push(name);
  }
  return found;
}

function highlighted(text) {
  return esc(text).replace(/\[([^\]\n]+)\]/g, (match, name) => {
    const raw = name.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (AI_NOTES.has(raw)) return `<span class="ph-note">${match}</span>`;
    const value = values[raw];
    return value
      ? `<mark class="ph is-filled" data-ph="${esc(raw)}">${esc(value)}</mark>`
      : `<mark class="ph" data-ph="${esc(raw)}">${match}</mark>`;
  });
}

function filled(text) {
  return text.replace(PH, (match, name) => (!AI_NOTES.has(name) && values[name] ? values[name] : match));
}

function catName(id) {
  return data.categories.find((c) => c.id === id)?.name || id;
}

function card(p) {
  const fields = blanks(p.prompt);
  const done = fields.filter((f) => values[f]).length;
  return `
    <article class="prompt-card card" data-prompt="${p.id}">
      <header class="prompt-head">
        <div class="prompt-badges">
          <span class="badge badge-blue">${esc(catName(p.category))}</span>
          <span class="badge">${esc(p.subcategory)}</span>
        </div>
        <h2 class="prompt-title">${esc(p.title)}</h2>
      </header>
      <div class="prompt-body" id="body-${p.id}">
        <div class="prompt-text" data-text>${highlighted(p.prompt)}</div>
      </div>
      <div class="prompt-actions">
        <button type="button" class="btn btn-primary btn-sm" data-copy="${p.id}">${icon("copy")}Copy prompt</button>
        ${
          fields.length
            ? `<button type="button" class="btn btn-secondary btn-sm" data-fill="${p.id}" aria-expanded="false" aria-controls="fill-${p.id}">
                 Fill in the blanks <span class="fill-count" data-fill-count>${done}/${fields.length}</span>
               </button>`
            : ""
        }
        <button type="button" class="btn btn-ghost btn-sm" data-expand="${p.id}" aria-expanded="false" aria-controls="body-${p.id}">Show full prompt</button>
      </div>
      ${
        fields.length
          ? `<div class="fill-panel" id="fill-${p.id}" hidden>
              <p class="hint">Your answers stay on this page and fill every prompt that uses the same blank.</p>
              <div class="fill-grid">
                ${fields
                  .map(
                    (f, i) => `
                  <div class="field">
                    <label for="in-${p.id}-${i}">${esc(f)}</label>
                    <input class="input" id="in-${p.id}-${i}" type="text" data-blank="${esc(f)}" value="${esc(values[f] || "")}" autocomplete="off">
                  </div>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }
    </article>`;
}

function visible() {
  return data.prompts.filter((p) => {
    if (active !== "all" && p.category !== active) return false;
    if (query && !searchable(p.title, p.subcategory, catName(p.category), p.prompt).includes(query)) return false;
    return true;
  });
}

function renderChips() {
  const count = (id) => (id === "all" ? data.prompts.length : data.prompts.filter((p) => p.category === id).length);
  const chips = [{ id: "all", name: "All" }, ...data.categories];
  catsBox.innerHTML = chips
    .map(
      (c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${c.id === active}">
        ${esc(c.name)} <span class="count">${count(c.id)}</span>
      </button>`
    )
    .join("");
}

function render() {
  const list = visible();
  countEl.textContent = `${list.length} ${list.length === 1 ? "prompt" : "prompts"}${active !== "all" ? ` in ${catName(active)}` : ""}`;
  if (!list.length) {
    renderEmpty(results, {
      title: "No prompts match",
      text: "Try another word, or show all categories.",
      action: {
        label: "Show all prompts",
        onClick: () => {
          query = "";
          searchInput.value = "";
          setCategory("all");
        }
      }
    });
    return;
  }
  results.removeAttribute("aria-busy");
  results.innerHTML = `<div class="prompt-grid">${list.map(card).join("")}</div>`;
  markOverflow();
}

// Only offer "Show full prompt" when the text is actually cut off.
function markOverflow() {
  results.querySelectorAll(".prompt-card").forEach((el) => {
    const body = el.querySelector(".prompt-body");
    const btn = el.querySelector("[data-expand]");
    const cut = body.scrollHeight > body.clientHeight + 4;
    btn.hidden = !cut;
    body.classList.toggle("is-cut", cut);
  });
}

function setCategory(id, { updateHash = true } = {}) {
  active = data.categories.some((c) => c.id === id) ? id : "all";
  catsBox.querySelectorAll("[data-cat]").forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.cat === active)));
  if (updateHash) history.replaceState(null, "", `${location.pathname}${location.search}${active === "all" ? "" : `#${active}`}`);
  render();
}

function refreshBlank(name) {
  results.querySelectorAll(".prompt-card").forEach((el) => {
    const p = data.prompts.find((x) => x.id === el.dataset.prompt);
    const fields = blanks(p.prompt);
    if (!fields.includes(name)) return;
    el.querySelector("[data-text]").innerHTML = highlighted(p.prompt);
    el.querySelectorAll(`[data-blank]`).forEach((input) => {
      if (input.dataset.blank === name && input !== document.activeElement) input.value = values[name] || "";
    });
    const counter = el.querySelector("[data-fill-count]");
    if (counter) counter.textContent = `${fields.filter((f) => values[f]).length}/${fields.length}`;
  });
  clearBlanksBtn.hidden = !Object.values(values).some(Boolean);
}

/* ---------- Events ---------- */

catsBox.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cat]");
  if (chip) setCategory(chip.dataset.cat);
});

searchInput.addEventListener(
  "input",
  debounce(() => {
    query = searchInput.value.trim().toLowerCase();
    render();
  }, 150)
);

results.addEventListener("click", (event) => {
  const copyBtn = event.target.closest("[data-copy]");
  if (copyBtn) {
    const p = data.prompts.find((x) => x.id === copyBtn.dataset.copy);
    const text = filled(p.prompt);
    const open = blanks(text).length;
    copyText(text, open ? `Prompt copied. ${open} blank${open === 1 ? "" : "s"} still to fill in your AI tool.` : "Prompt copied. Paste it into your AI tool.");
    return;
  }
  const fillBtn = event.target.closest("[data-fill]");
  if (fillBtn) {
    const panel = document.getElementById(`fill-${fillBtn.dataset.fill}`);
    const open = fillBtn.getAttribute("aria-expanded") !== "true";
    fillBtn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    if (open) panel.querySelector("input")?.focus();
    return;
  }
  const expandBtn = event.target.closest("[data-expand]");
  if (expandBtn) {
    const body = document.getElementById(`body-${expandBtn.dataset.expand}`);
    const open = expandBtn.getAttribute("aria-expanded") !== "true";
    expandBtn.setAttribute("aria-expanded", String(open));
    body.classList.toggle("is-open", open);
    expandBtn.textContent = open ? "Show less" : "Show full prompt";
  }
});

results.addEventListener("input", (event) => {
  const input = event.target.closest("[data-blank]");
  if (!input) return;
  values[input.dataset.blank] = input.value;
  refreshBlank(input.dataset.blank);
});

clearBlanksBtn.addEventListener("click", () => {
  Object.keys(values).forEach((k) => delete values[k]);
  clearBlanksBtn.hidden = true;
  render();
});

window.addEventListener("hashchange", () => setCategory(location.hash.slice(1), { updateHash: false }));
window.addEventListener("resize", debounce(markOverflow, 200));

/* ---------- Start ---------- */

async function start() {
  renderLoading(results, 4);
  try {
    data = await loadData("prompts");
  } catch (error) {
    renderError(results, error.message, start);
    return;
  }

  Object.entries(PREFILL).forEach(([key, names]) => {
    const value = param(key);
    if (value) names.forEach((n) => (values[n] = value.slice(0, 120)));
  });
  clearBlanksBtn.hidden = !Object.values(values).some(Boolean);

  if (data.rule) {
    ruleEl.querySelector("span").textContent = `Golden rule for every prompt: ${data.rule}`;
    ruleEl.hidden = false;
  }

  active = data.categories.some((c) => c.id === location.hash.slice(1)) ? location.hash.slice(1) : "all";
  renderChips();
  render();
}

start();
