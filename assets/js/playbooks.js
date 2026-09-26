// Project Playbooks: card grid with an event type filter, and a detail view
// that opens at playbooks.html#<id> so each playbook has its own link.

import { icon, esc, loadData, renderLoading, renderError, renderEmpty, formatDate, formatRupees, mailHref } from "./utils.js";
import { CONFIG } from "./config.js";

const listIntro = document.querySelector("[data-list-intro]");
const listView = document.querySelector("[data-list-view]");
const detailView = document.querySelector("[data-detail-view]");
const catsBox = document.querySelector("[data-cats]");
const countEl = document.querySelector("[data-count]");
const results = document.querySelector("[data-results]");

let items = [];
let active = "all";

const sampleBadge = (p) => (p.sample ? '<span class="badge badge-sample" title="Sample content, not a real project">SAMPLE</span>' : "");

function list(title, values) {
  if (!values?.length) return "";
  return `
    <section class="pb-section">
      <h2>${esc(title)}</h2>
      <ul>${values.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>
    </section>`;
}

function card(p) {
  return `
    <article class="pb-card card">
      <div class="res-top">
        <span class="badge badge-blue">${esc(p.category)}</span>
        ${sampleBadge(p)}
      </div>
      <h2 class="pb-card-title"><a class="entry-link" href="#${esc(p.id)}">${esc(p.projectName)}</a></h2>
      <p class="pb-meta">${esc(p.club)}${p.date ? `  ·  ${esc(formatDate(p.date))}` : ""}</p>
      <p class="pb-objective">${esc(p.objective)}</p>
      ${
        p.impact?.length
          ? `<dl class="pb-stats pb-stats-sm">${p.impact
              .slice(0, 3)
              .map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`)
              .join("")}</dl>`
          : ""
      }
      <a class="link-arrow" href="#${esc(p.id)}" aria-hidden="true" tabindex="-1">Read the playbook ${icon("arrow-right")}</a>
    </article>`;
}

function renderList() {
  const shown = items.filter((p) => active === "all" || p.category === active);
  countEl.textContent = `${shown.length} ${shown.length === 1 ? "playbook" : "playbooks"}`;
  if (!items.length) {
    renderEmpty(results, { title: "No playbooks yet", text: "Be the first club to share what you learned." });
    return;
  }
  results.innerHTML = `<div class="pb-grid">${shown.map(card).join("")}</div>`;
}

function renderChips() {
  const cats = [...new Set(items.map((p) => p.category).filter(Boolean))].sort();
  if (cats.length < 2) {
    catsBox.hidden = true;
    return;
  }
  catsBox.innerHTML = ["all", ...cats]
    .map(
      (c) => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c === active}">${c === "all" ? "All" : esc(c)} <span class="count">${
        c === "all" ? items.length : items.filter((p) => p.category === c).length
      }</span></button>`
    )
    .join("");
}

function renderDetail(p) {
  const photos = (p.photos || []).filter((ph) => ph.src);
  detailView.innerHTML = `
    <a class="back-link" href="#">${icon("arrow-left")}All playbooks</a>
    <article class="pb-detail card">
      <header class="pb-detail-head">
        <div class="res-badges pb-badges"><span class="badge badge-blue">${esc(p.category)}</span>${sampleBadge(p)}</div>
        <h1 id="pb-title">${esc(p.projectName)}</h1>
        <p class="pb-meta">${esc(p.club)}${p.date ? `  ·  ${esc(formatDate(p.date))}` : ""}</p>
        ${p.sample ? '<p class="notice">' + icon("info") + "<span>This is sample content that shows the playbook format. It is not a real project.</span></p>" : ""}
      </header>

      ${
        p.impact?.length
          ? `<dl class="pb-stats">${p.impact.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join("")}${
              p.budget?.total ? `<div><dt>Budget</dt><dd>${esc(formatRupees(p.budget.total))}</dd></div>` : ""
            }</dl>`
          : ""
      }

      <section class="pb-section">
        <h2>Objective</h2>
        <p>${esc(p.objective)}</p>
      </section>
      ${list("What was done", p.whatWasDone)}
      ${
        p.budget?.total || p.budget?.notes
          ? `<section class="pb-section"><h2>Budget</h2><p>${esc([formatRupees(p.budget.total), p.budget.notes].filter(Boolean).join(". "))}</p></section>`
          : ""
      }
      <div class="pb-two">
        ${list("What worked", p.whatWorked)}
        ${list("What to do differently", p.doDifferently)}
      </div>
      ${
        photos.length
          ? `<section class="pb-section"><h2>Photos</h2><div class="pb-photos">${photos
              .map((ph) => `<img src="${esc(ph.src)}" alt="${esc(ph.alt || "")}" loading="lazy">`)
              .join("")}</div></section>`
          : ""
      }
      ${p.tips?.length ? `<section class="pb-section pb-tips"><h2>${icon("bulb")}Tips for your club</h2><ul>${p.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
    </article>
    <div class="pb-detail-actions">
      <a class="btn btn-primary" href="checklist.html">Build a checklist for your event</a>
      <a class="btn btn-secondary" href="#">See all playbooks</a>
    </div>`;
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  const p = id && items.find((x) => x.id === id);
  if (p) {
    renderDetail(p);
    listIntro.hidden = true;
    listView.hidden = true;
    detailView.hidden = false;
    document.title = `${p.projectName} | Project Playbooks | A4 WAYPOINT`;
    window.scrollTo(0, 0);
    detailView.querySelector("h1").setAttribute("tabindex", "-1");
    detailView.querySelector("h1").focus({ preventScroll: true });
  } else {
    detailView.hidden = true;
    detailView.innerHTML = "";
    listIntro.hidden = false;
    listView.hidden = false;
    document.title = "Project Playbooks | A4 WAYPOINT";
  }
}

catsBox.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cat]");
  if (!chip) return;
  active = chip.dataset.cat;
  catsBox.querySelectorAll("[data-cat]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === active)));
  renderList();
});

// "All playbooks" links clear the hash without jumping to the top of an empty page.
detailView.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#"]');
  if (!link) return;
  event.preventDefault();
  history.pushState(null, "", location.pathname + location.search);
  route();
});

window.addEventListener("hashchange", route);
window.addEventListener("popstate", route);

document.querySelector("[data-share-playbook]").href = mailHref(
  CONFIG.suggestEmail,
  "A4 WAYPOINT: playbook submission",
  [
    "Project name:",
    "Club:",
    "Date:",
    "Event type:",
    "Objective:",
    "What was done:",
    "Budget:",
    "Impact numbers:",
    "What worked:",
    "What to do differently:",
    "Tips for other clubs:",
    "",
    "You can attach 2 or 3 photos."
  ].join("\n")
);

async function start() {
  renderLoading(results, 3);
  try {
    const data = await loadData("playbooks");
    items = Array.isArray(data) ? data : data.items || [];
  } catch (error) {
    renderError(results, error.message, start);
    return;
  }
  renderChips();
  renderList();
  route();
}

start();
