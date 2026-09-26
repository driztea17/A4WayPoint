// SHUFFLE: a deck of event ideas for clubs with a creative block. Pick
// Service, Leadership, or Fellowship, shuffle, and one card flips over with
// an event name, concept, twist, and budget. Recently shown cards are kept
// in localStorage so they do not come back straight away.

import { icon, esc, loadData, renderError, store } from "./utils.js";

const RECENT_KEY = "a4wp:shuffle:recent";
const RECENT_SIZE = 5;
const MOVE_LINES = ["Your move. 👀", "Okay. Now actually do it. 😌"];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const catsBox = document.querySelector("[data-cats]");
const areasBox = document.querySelector("[data-areas]");
const backsBox = document.querySelector("[data-backs]");
const hero = document.querySelector("[data-hero]");
const heroBack = document.querySelector("[data-hero-back]");
const front = document.querySelector("[data-front]");
const burst = document.querySelector("[data-burst]");
const line = document.querySelector("[data-line]");
const shuffleBtn = document.querySelector("[data-shuffle]");
const doneBtn = document.querySelector("[data-done]");
const againBtn = document.querySelector("[data-again]");
const doneMsg = document.querySelector("[data-done-msg]");
const planLink = document.querySelector("[data-plan]");
const announce = document.querySelector("[data-announce]");

let data;
let cats = {};
let areas = {};
let active = "all";
let activeArea = "all";
let busy = false;
let current = null;

const pad = (n) => String(n).padStart(2, "0");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Service cards take the colour and icon of their Leo service area.
const theme = (card) => (card.category === "service" && areas[card.area]) || cats[card.category];

/* ---------- Card faces ---------- */

// Soft wave pattern for card backs (drawn in white on the category colour).
const WAVES = `
  <svg class="s-waves" viewBox="0 0 300 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 250 C 70 210, 120 300, 190 260 S 280 200, 300 230 L300 420 L0 420 Z" opacity=".18"/>
    <path d="M0 320 C 80 280, 140 360, 210 320 S 285 280, 300 300 L300 420 L0 420 Z" opacity=".16"/>
    <path d="M0 90 C 60 60, 110 130, 180 100 S 270 40, 300 70 L300 0 L0 0 Z" opacity=".12"/>
  </svg>`;

function backMarkup(cat) {
  return `
    ${WAVES}
    <span class="s-back-icon">${icon(cat.icon)}</span>
    <span class="s-back-brand">SHUFFLE</span>
    <span class="s-route" aria-hidden="true"><i></i><i></i><i></i><b></b></span>`;
}

function paintBack(el, cat) {
  el.style.setProperty("--c", cat.color);
  el.classList.toggle("is-dark", cat.id === "wild");
  el.innerHTML = backMarkup(cat);
}

function frontMarkup(card) {
  const cat = cats[card.category];
  const vols = /^\d/.test(card.volunteers) ? `${card.volunteers} volunteers` : card.volunteers;
  return `
    <div class="s-front-top">
      <span class="s-code">SHUFFLE #${pad(card.id)}</span>
      ${card.area && areas[card.area] ? `<span class="s-area">${icon(areas[card.area].icon)}${esc(card.area)}</span>` : ""}
    </div>
    <p class="s-cat">${icon(cat.icon)}${esc(cat.name)}</p>
    <div class="s-body">
      <h2 class="s-title" id="s-title">${esc(card.name)}</h2>
      <p class="s-concept">${esc(card.concept)}</p>
      <p class="s-twist">${icon("sparkles")}<span><strong>Twist:</strong> ${esc(card.twist)}</span></p>
    </div>
    <div class="s-front-foot">
      <div class="s-facts">
        <span class="s-label">Budget</span>
        <span class="s-budget">${esc(card.budget)}</span>
        <span class="s-vols">${icon("users")}${esc(vols)}</span>
      </div>
      <span class="s-big" aria-hidden="true">${pad(card.id)}</span>
    </div>`;
}

// "Plan this event" opens the Project Starter with the idea filled in.
function planHref(card) {
  const params = new URLSearchParams({
    name: card.name,
    cause: card.area || cats[card.category].name,
    objectives: `${card.concept}\nTwist: ${card.twist}`,
    budgetNotes: `Shuffle estimate: ${card.budget}`
  });
  if (card.category === "service") params.set("type", "service-project");
  return `project-starter.html?${params}`;
}

/* ---------- Deck ---------- */

function deckColours() {
  if (active === "service") {
    if (activeArea !== "all") return Array(5).fill(areas[activeArea]);
    return ["Hunger", "Environment", "Youth", "Vision", "Childhood Cancer"].map((n) => areas[n]);
  }
  if (active !== "all") return Array(5).fill(cats[active]);
  return ["fellowship", "leadership", "service", "leadership", "fellowship"].map((id) => cats[id]);
}

function buildBacks() {
  backsBox.innerHTML = deckColours()
    .map((_, i) => `<div class="s-card s-deck-card" style="--i:${i}"><div class="s-face s-back"></div></div>`)
    .join("");
  const colours = deckColours();
  backsBox.querySelectorAll(".s-back").forEach((el, i) => paintBack(el, colours[i]));
  if (!current) paintBack(heroBack, deckColours()[2]);
}

function renderChips() {
  const count = (id) => (id === "all" ? data.cards.length : data.cards.filter((c) => c.category === id).length);
  const chips = [{ id: "all", name: "All" }, ...data.categories];
  catsBox.innerHTML = chips
    .map(
      (c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${c.id === active}">
        ${c.icon ? icon(c.icon) : ""}${esc(c.name)} <span class="count">${count(c.id)}</span>
      </button>`
    )
    .join("");
}

function renderAreas() {
  areasBox.hidden = active !== "service";
  if (active !== "service") return;
  const count = (name) => data.cards.filter((c) => c.category === "service" && (name === "all" || c.area === name)).length;
  const chips = [{ name: "all", label: "All areas" }, ...data.serviceAreas.map((a) => ({ ...a, label: a.name }))];
  areasBox.innerHTML = chips
    .map(
      (a) => `<button type="button" class="chip" data-area="${esc(a.name)}" aria-pressed="${a.name === activeArea}"${a.color ? ` style="--area:${a.color}"` : ""}>
        ${a.icon ? icon(a.icon) : ""}${esc(a.label)} <span class="count">${count(a.name)}</span>
      </button>`
    )
    .join("");
}

/* ---------- Picking ---------- */

function pick() {
  const pool = data.cards.filter(
    (c) => (active === "all" || c.category === active) && (active !== "service" || activeArea === "all" || c.area === activeArea)
  );
  const recent = store.get(RECENT_KEY, []);
  let options = pool.filter((c) => !recent.includes(c.id));
  if (!options.length) options = pool.filter((c) => c.id !== current?.id);
  if (!options.length) options = pool;
  const card = options[Math.floor(Math.random() * options.length)];
  store.set(RECENT_KEY, [card.id, ...recent.filter((id) => id !== card.id)].slice(0, RECENT_SIZE));
  return card;
}

/* ---------- Motion ---------- */

function shakeDeck() {
  if (reduced) return Promise.resolve();
  const cards = Array.from(backsBox.children);
  const runs = cards.map((el, i) => {
    const dir = i % 2 ? 1 : -1;
    const dist = 46 + i * 10;
    return el.animate(
      [
        { transform: "none" },
        { transform: `translateX(${dir * dist}px) translateY(-10px) rotate(${dir * 9}deg)` },
        { transform: `translateX(${-dir * dist * 0.4}px) rotate(${-dir * 4}deg)` },
        { transform: "none" }
      ],
      { duration: 460, delay: i * 35, easing: "cubic-bezier(.45,0,.2,1)" }
    ).finished;
  });
  const heroRun = hero.animate(
    [{ transform: "none" }, { transform: "translateY(10px) scale(.96)" }, { transform: "none" }],
    { duration: 520, easing: "ease-in-out" }
  ).finished;
  return Promise.all([...runs, heroRun]);
}

function celebrate() {
  if (reduced) return;
  const colours = ["#84c318", "#f97316", "#6aaef5", "#f6c445", "#ffffff", "#a193f2"];
  burst.innerHTML = "";
  for (let i = 0; i < 14; i += 1) {
    const dot = document.createElement("i");
    dot.style.background = colours[i % colours.length];
    burst.append(dot);
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 150 + Math.random() * 70;
    dot.animate(
      [
        { transform: "translate(-50%, -50%) scale(.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`, opacity: 0 }
      ],
      { duration: 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
    );
  }
  setTimeout(() => (burst.innerHTML = ""), 800);
}

/* ---------- Flow ---------- */

function setButtons(state) {
  shuffleBtn.hidden = state !== "idle";
  doneBtn.hidden = state !== "revealed";
  againBtn.hidden = state === "idle";
  doneMsg.hidden = state !== "done";
  planLink.hidden = state === "idle";
}

async function shuffle() {
  if (busy) return;
  busy = true;
  [shuffleBtn, againBtn, doneBtn].forEach((b) => (b.disabled = true));
  hero.classList.add("is-busy");

  if (hero.classList.contains("is-flipped")) {
    hero.classList.remove("is-flipped");
    hero.setAttribute("aria-hidden", "true");
    if (!reduced) await wait(320);
  }

  line.textContent = "Shuffling...";
  const card = pick();
  await shakeDeck();

  current = card;
  paintBack(heroBack, theme(card));
  front.style.setProperty("--c", theme(card).color);
  front.style.setProperty("--ink", theme(card).ink);
  front.innerHTML = frontMarkup(card);

  if (!reduced) {
    hero.animate([{ transform: "none" }, { transform: "translateY(-18px) scale(1.04)" }, { transform: "none" }], {
      duration: 620,
      easing: "cubic-bezier(.2,.8,.2,1)"
    });
  }
  hero.classList.add("is-flipped");
  hero.setAttribute("aria-hidden", "false");
  if (!reduced) await wait(420);
  celebrate();

  line.textContent = MOVE_LINES[Math.floor(Math.random() * MOVE_LINES.length)];
  planLink.href = planHref(card);
  announce.textContent = `Card ${pad(card.id)}, ${cats[card.category].name}${card.area ? `, ${card.area}` : ""}: ${card.name}. ${card.concept} Twist: ${card.twist} Budget: ${card.budget}. ${card.volunteers} volunteers.`;
  setButtons("revealed");
  [shuffleBtn, againBtn, doneBtn].forEach((b) => (b.disabled = false));
  hero.classList.remove("is-busy");
  hero.focus({ preventScroll: true });
  busy = false;
}

function done() {
  setButtons("done");
  line.textContent = "";
  announce.textContent = "Nice. One creative block down.";
  againBtn.focus();
}

/* ---------- Events ---------- */

catsBox.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cat]");
  if (!chip || busy) return;
  active = chip.dataset.cat;
  activeArea = "all";
  catsBox.querySelectorAll("[data-cat]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === active)));
  renderAreas();
  buildBacks();
  if (!current) line.textContent = "Your next idea is hiding in the deck.";
});

areasBox.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-area]");
  if (!chip || busy) return;
  activeArea = chip.dataset.area;
  areasBox.querySelectorAll("[data-area]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.area === activeArea)));
  buildBacks();
});

shuffleBtn.addEventListener("click", shuffle);
againBtn.addEventListener("click", shuffle);
doneBtn.addEventListener("click", done);

/* ---------- Start ---------- */

async function start() {
  try {
    data = await loadData("shuffle");
  } catch (error) {
    renderError(document.querySelector("[data-deck]"), error.message, () => location.reload());
    shuffleBtn.hidden = true;
    return;
  }
  data.categories.forEach((c) => (cats[c.id] = c));
  (data.serviceAreas || []).forEach((a) => (areas[a.name] = a));
  renderChips();
  buildBacks();
  setButtons("idle");
}

start();
