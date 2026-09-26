// Event Checklist Generator: builds a checklist from data/checklists.json,
// saves ticks and custom items per event type in localStorage, and prints or
// copies the result.

import { icon, esc, loadData, renderError, copyText, toast, store, formatDate, param } from "./utils.js";

const LAST_KEY = "a4wp:checklist:last";
const stateKey = (typeId) => `a4wp:checklist:${typeId}`;

const setup = document.querySelector("[data-setup]");
const typesBox = document.querySelector("[data-types]");
const phasesBox = document.querySelector("[data-phases]");
const metaEl = document.querySelector("[data-meta]");
const overallBox = document.querySelector("[data-overall]");
const overallCount = document.querySelector("[data-overall-count]");
const overallBar = document.querySelector("[data-overall-bar]");
const actions = document.querySelector("[data-actions]");
const live = document.querySelector("[data-live]");

let config;
let type = null;
let state = null;

/* ---------- State ---------- */

let idCounter = 0;
const newId = () => `i${Date.now().toString(36)}${(idCounter++).toString(36)}`;

function freshState(t) {
  const items = {};
  config.phases.forEach(({ id }) => {
    const texts = [...(config.base[id] || []), ...(t.items?.[id] || [])];
    items[id] = texts.map((text) => ({ id: newId(), text, done: false, custom: false }));
  });
  return { v: 1, eventName: "", eventDate: "", items };
}

function save() {
  store.set(stateKey(type.id), state);
}

function counts(phaseId) {
  const list = phaseId ? state.items[phaseId] || [] : Object.values(state.items).flat();
  return { done: list.filter((i) => i.done).length, total: list.length };
}

/* ---------- Rendering ---------- */

function renderTypes() {
  typesBox.innerHTML = config.eventTypes
    .map(
      (t) => `
      <label class="type-option">
        <input type="radio" name="eventType" value="${esc(t.id)}">
        <span class="type-card">
          <span class="type-icon">${icon(t.icon || "clipboard")}</span>
          <span class="type-name">${esc(t.name)}</span>
        </span>
      </label>`
    )
    .join("");
}

function itemRow(phaseId, item) {
  return `
    <li class="check-item${item.done ? " is-done" : ""}" data-item="${item.id}">
      <label class="check-label">
        <input type="checkbox" class="check-input" data-toggle="${phaseId}:${item.id}"${item.done ? " checked" : ""}>
        <span class="check-box" aria-hidden="true">${icon("check")}</span>
        <span class="print-box" aria-hidden="true">${item.done ? "☑" : "☐"}</span>
        <span class="check-text">${esc(item.text)}</span>
        ${item.custom ? '<span class="badge badge-blue check-tag">Added</span>' : ""}
      </label>
      <button type="button" class="icon-btn no-print" data-delete="${phaseId}:${item.id}" aria-label="Delete item: ${esc(item.text)}">${icon("trash")}</button>
    </li>`;
}

function renderPhases() {
  phasesBox.innerHTML = config.phases
    .map((phase) => {
      const list = state.items[phase.id] || [];
      return `
      <section class="phase" id="phase-${phase.id}" aria-labelledby="phase-title-${phase.id}">
        <div class="phase-head">
          <h3 id="phase-title-${phase.id}">${esc(phase.title)}</h3>
          <span class="phase-count" data-phase-count="${phase.id}"></span>
        </div>
        <div class="progress" role="progressbar" aria-label="${esc(phase.title)} progress" aria-valuemin="0" aria-valuemax="100" data-phase-bar="${phase.id}"><div class="progress-bar"></div></div>
        <ul class="check-list" data-list="${phase.id}">
          ${list.length ? list.map((item) => itemRow(phase.id, item)).join("") : '<li class="check-empty">No items. Add your own below.</li>'}
        </ul>
        <form class="add-item no-print" data-add="${phase.id}">
          <label class="visually-hidden" for="add-${phase.id}">Add an item to ${esc(phase.title)}</label>
          <input class="input" id="add-${phase.id}" type="text" placeholder="Add your own item" maxlength="160" autocomplete="off">
          <button type="submit" class="btn btn-secondary btn-sm">${icon("plus")}Add</button>
        </form>
      </section>`;
    })
    .join("");
  updateProgress();
}

function setBar(bar, done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  bar.setAttribute("aria-valuenow", String(pct));
  bar.firstElementChild.style.setProperty("--p", String(pct / 100));
  bar.classList.toggle("is-complete", total > 0 && done === total);
}

function updateProgress() {
  config.phases.forEach(({ id }) => {
    const { done, total } = counts(id);
    const countEl = phasesBox.querySelector(`[data-phase-count="${id}"]`);
    if (countEl) {
      countEl.textContent = `${done}/${total}`;
      countEl.classList.toggle("is-complete", total > 0 && done === total);
    }
    const bar = phasesBox.querySelector(`[data-phase-bar="${id}"]`);
    if (bar) setBar(bar, done, total);
  });
  const { done, total } = counts();
  overallCount.textContent = `${done} of ${total}`;
  setBar(overallBar, done, total);
  overallBox.classList.toggle("is-complete", total > 0 && done === total);
}

function renderMeta() {
  const parts = [type.name];
  if (state.eventName) parts.unshift(state.eventName);
  if (state.eventDate) parts.push(formatDate(state.eventDate));
  metaEl.textContent = parts.join("  ·  ");
}

function selectType(typeId, { focus = false } = {}) {
  const t = config.eventTypes.find((e) => e.id === typeId);
  if (!t) return;
  type = t;
  state = store.get(stateKey(t.id));
  if (!state || !state.items) state = freshState(t);
  store.set(LAST_KEY, t.id);

  const radio = typesBox.querySelector(`input[value="${t.id}"]`);
  if (radio) radio.checked = true;
  setup.eventName.value = state.eventName || "";
  setup.eventDate.value = state.eventDate || "";

  overallBox.hidden = false;
  actions.hidden = false;
  renderMeta();
  renderPhases();
  if (focus) document.getElementById("checklist-title").scrollIntoView({ block: "start" });
}

/* ---------- Text export ---------- */

function asText() {
  const lines = [`*EVENT CHECKLIST: ${state.eventName || type.name}*`];
  const info = [`Type: ${type.name}`];
  if (state.eventDate) info.push(`Date: ${formatDate(state.eventDate)}`);
  const { done, total } = counts();
  info.push(`Done: ${done}/${total}`);
  lines.push(info.join(" | "), "");
  config.phases.forEach((phase) => {
    const c = counts(phase.id);
    lines.push(`*${phase.title}* (${c.done}/${c.total})`);
    (state.items[phase.id] || []).forEach((item) => lines.push(`${item.done ? "☑" : "☐"} ${item.text}`));
    lines.push("");
  });
  lines.push("Made with A4 WAYPOINT, Leo District 3231 A4");
  return lines.join("\n");
}

/* ---------- Events ---------- */

typesBox.addEventListener("change", (event) => {
  if (event.target.name === "eventType") selectType(event.target.value);
});

setup.addEventListener("input", (event) => {
  if (!state) return;
  if (event.target.name === "eventName") state.eventName = event.target.value.trim();
  if (event.target.name === "eventDate") state.eventDate = event.target.value;
  save();
  renderMeta();
});

setup.addEventListener("submit", (event) => event.preventDefault());

phasesBox.addEventListener("change", (event) => {
  const toggle = event.target.closest("[data-toggle]");
  if (!toggle) return;
  const [phaseId, itemId] = toggle.dataset.toggle.split(":");
  const item = state.items[phaseId].find((i) => i.id === itemId);
  item.done = toggle.checked;
  const row = toggle.closest(".check-item");
  row.classList.toggle("is-done", item.done);
  row.querySelector(".print-box").textContent = item.done ? "☑" : "☐";
  save();
  updateProgress();
  const { done, total } = counts();
  live.textContent = `${done} of ${total} done.`;
  if (total && done === total) toast("Checklist complete. Great work!");
});

phasesBox.addEventListener("click", (event) => {
  const del = event.target.closest("[data-delete]");
  if (!del) return;
  const [phaseId, itemId] = del.dataset.delete.split(":");
  const list = state.items[phaseId];
  const index = list.findIndex((i) => i.id === itemId);
  const [removed] = list.splice(index, 1);
  save();
  renderPhases();
  const next = list[index] || list[index - 1];
  const target = next
    ? phasesBox.querySelector(`[data-toggle="${phaseId}:${next.id}"]`)
    : phasesBox.querySelector(`#add-${phaseId}`);
  target?.focus();
  live.textContent = `Deleted: ${removed.text}`;
});

phasesBox.addEventListener("submit", (event) => {
  const addForm = event.target.closest("[data-add]");
  if (!addForm) return;
  event.preventDefault();
  const input = addForm.querySelector("input");
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  const phaseId = addForm.dataset.add;
  state.items[phaseId].push({ id: newId(), text, done: false, custom: true });
  save();
  renderPhases();
  phasesBox.querySelector(`#add-${phaseId}`).focus();
  live.textContent = `Added: ${text}`;
});

document.querySelector("[data-print]").addEventListener("click", () => window.print());

document.querySelector("[data-pdf]").addEventListener("click", () => {
  toast('Choose "Save as PDF" as the printer.');
  setTimeout(() => window.print(), 400);
});

document.querySelector("[data-copy]").addEventListener("click", () => copyText(asText(), "Checklist copied. Paste it in WhatsApp."));

document.querySelector("[data-reset]").addEventListener("click", () => {
  if (!window.confirm(`Reset the ${type.name} checklist? This clears your ticks, added items, and the event name and date.`)) return;
  store.remove(stateKey(type.id));
  selectType(type.id);
  toast("Checklist reset");
});

/* ---------- Start ---------- */

async function start() {
  try {
    config = await loadData("checklists");
  } catch (error) {
    renderError(phasesBox, error.message, start);
    typesBox.innerHTML = "";
    return;
  }
  renderTypes();

  const fromLink = param("type");
  const initial = config.eventTypes.some((t) => t.id === fromLink) ? fromLink : store.get(LAST_KEY);
  if (initial && config.eventTypes.some((t) => t.id === initial)) {
    selectType(initial);
    const name = param("name");
    if (fromLink && name && !state.eventName) {
      state.eventName = name.slice(0, 120);
      setup.eventName.value = state.eventName;
      save();
      renderMeta();
    }
  } else {
    phasesBox.innerHTML = `
      <div class="state">
        <span class="icon-tile">${icon("clipboard")}</span>
        <h3>Pick an event type</h3>
        <p>Choose one of the seven event types to build your checklist.</p>
      </div>`;
  }

  if (location.hash.startsWith("#phase-")) {
    document.querySelector(location.hash)?.scrollIntoView({ block: "start" });
  }
}

start();
