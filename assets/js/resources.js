// Resource Hub: five tabs, each loaded from its own JSON file, with search and filters.

import {
  icon,
  esc,
  loadData,
  renderLoading,
  renderError,
  renderEmpty,
  debounce,
  searchable,
  telHref,
  whatsappHref,
  mailHref
} from "./utils.js";

const WA_TEXT = "Hi, I found your details on A4 WAYPOINT (Leo District 3231 A4). I would like to ask about ";

const CAPACITY_BANDS = [
  { value: "0-50", label: "Up to 50 people", min: 0, max: 50 },
  { value: "51-150", label: "51 to 150 people", min: 51, max: 150 },
  { value: "151-300", label: "151 to 300 people", min: 151, max: 300 },
  { value: "301+", label: "More than 300", min: 301, max: Infinity }
];

const PRICE_ORDER = ["Budget", "Mid-range", "Premium"];

function sampleBadge(item) {
  return item.sample ? '<span class="badge badge-sample" title="Placeholder data, not a real listing">SAMPLE</span>' : "";
}

function contactButtons({ phone, whatsapp, email, subject, extra = "" }) {
  const buttons = [];
  const call = telHref(phone);
  const wa = whatsappHref(whatsapp, WA_TEXT);
  const mail = mailHref(email, subject);
  if (call) buttons.push(`<a class="contact-btn is-call" href="${call}">${icon("phone")}Call</a>`);
  if (wa) buttons.push(`<a class="contact-btn is-whatsapp" href="${wa}" target="_blank" rel="noopener">${icon("message")}WhatsApp</a>`);
  if (mail) buttons.push(`<a class="contact-btn is-mail" href="${mail}">${icon("mail")}Email</a>`);
  if (extra) buttons.push(extra);
  return buttons.length ? `<div class="contact-row">${buttons.join("")}</div>` : "";
}

function mapButton(link) {
  return link ? `<a class="contact-btn" href="${esc(link)}" target="_blank" rel="noopener">${icon("map-pin")}Map</a>` : "";
}

function phoneLine(phone) {
  return phone ? `<li>${icon("phone")}<span class="tabular">${esc(phone)}</span></li>` : "";
}

const CATEGORIES = {
  venues: {
    file: "venues",
    noun: ["venue", "venues"],
    description: "Halls, turfs, and banquet halls that district clubs have used.",
    searchPlaceholder: "Search venues or areas",
    search: (v) => searchable(v.name, v.area, v.type, v.address, v.notes),
    filters: [
      { key: "area", label: "Area", get: (v) => v.area },
      { key: "type", label: "Type", get: (v) => v.type },
      {
        key: "capacity",
        label: "Capacity",
        allLabel: "Any capacity",
        showIf: (items) => items.some((v) => Number(v.capacity) > 0),
        options: CAPACITY_BANDS.map(({ value, label }) => ({ value, label })),
        match: (v, value) => {
          const band = CAPACITY_BANDS.find((b) => b.value === value);
          const cap = Number(v.capacity) || 0;
          return band ? cap >= band.min && cap <= band.max : true;
        }
      }
    ],
    card: (v) => `
      <article class="res-card card">
        <div class="res-top">
          <span class="icon-tile is-blue">${icon("building")}</span>
          <div class="res-badges"><span class="badge">${esc(v.type)}</span>${sampleBadge(v)}</div>
        </div>
        <h3>${esc(v.name)}</h3>
        <ul class="res-meta">
          <li>${icon("map-pin")}${esc(v.area)}</li>
          ${Number(v.capacity) > 0 ? `<li>${icon("users")}Up to ${esc(v.capacity)} people</li>` : ""}
          ${v.approxCost ? `<li>${icon("rupee")}${esc(v.approxCost)}</li>` : ""}
          ${phoneLine(v.phone)}
        </ul>
        ${v.address ? `<p class="res-address">${esc(v.address)}</p>` : ""}
        ${v.notes ? `<p class="res-notes">${esc(v.notes)}</p>` : ""}
        ${contactButtons({ phone: v.phone, whatsapp: v.whatsapp, email: v.email, subject: `Venue enquiry: ${v.name}`, extra: mapButton(v.mapLink) })}
      </article>`
  },

  vendors: {
    file: "vendors",
    noun: ["vendor", "vendors"],
    description: "Club pins, food, water, stationery, and club supplies.",
    searchPlaceholder: "Search vendors or services",
    search: (v) => searchable(v.name, v.contactName, v.category, v.area, v.address, v.notes),
    filters: [
      { key: "category", label: "Service", get: (v) => v.category },
      { key: "area", label: "Area", get: (v) => v.area },
      { key: "priceRange", label: "Price range", get: (v) => v.priceRange, order: PRICE_ORDER }
    ],
    card: (v) => `
      <article class="res-card card">
        <div class="res-top">
          <span class="icon-tile">${icon("store")}</span>
          <div class="res-badges"><span class="badge">${esc(v.category)}</span>${sampleBadge(v)}</div>
        </div>
        <h3>${esc(v.name)}</h3>
        <ul class="res-meta">
          ${v.contactName ? `<li>${icon("users")}${esc(v.contactName)}</li>` : ""}
          <li>${icon("map-pin")}${esc(v.area)}</li>
          ${v.priceRange ? `<li>${icon("rupee")}${esc(v.priceRange)}</li>` : ""}
          ${phoneLine(v.phone)}
        </ul>
        ${v.address ? `<p class="res-address">${esc(v.address)}</p>` : ""}
        ${v.notes ? `<p class="res-notes">${esc(v.notes)}</p>` : ""}
        ${contactButtons({ phone: v.phone, whatsapp: v.whatsapp, email: v.email, subject: `Enquiry for a Leo event: ${v.name}` })}
      </article>`
  },

  banks: {
    file: "banks",
    noun: ["bank branch", "bank branches"],
    description: "Branches near our clubs for opening a club account. FD rates change often: always confirm with the branch.",
    searchPlaceholder: "Search banks or areas",
    search: (v) => searchable(v.name, v.area, v.address, v.contactName),
    filters: [
      { key: "area", label: "Area", get: (v) => v.area },
      { key: "bank", label: "Bank", allLabel: "All banks", get: (v) => v.name.split(",")[0] }
    ],
    card: (v) => `
      <article class="res-card card">
        <div class="res-top">
          <span class="icon-tile is-lime">${icon("wallet")}</span>
          <div class="res-badges"><span class="badge">${esc(v.area)}</span>${sampleBadge(v)}</div>
        </div>
        <h3>${esc(v.name)}</h3>
        <ul class="res-meta">
          ${v.contactName ? `<li>${icon("users")}${esc(v.contactName)}${v.designation ? `, ${esc(v.designation)}` : ""}</li>` : ""}
          ${phoneLine(v.phone)}
        </ul>
        ${v.address ? `<p class="res-address">${esc(v.address)}</p>` : ""}
        ${
          v.minBalance || v.fdRate
            ? `<dl class="res-facts">
                ${v.minBalance ? `<div><dt>Minimum balance</dt><dd>${esc(v.minBalance)}</dd></div>` : ""}
                ${v.fdRate ? `<div><dt>FD rate (confirm with branch)</dt><dd>${esc(v.fdRate)}</dd></div>` : ""}
              </dl>`
            : ""
        }
        ${contactButtons({ phone: v.phone, whatsapp: "", email: "", extra: mapButton(v.mapLink) })}
      </article>`
  },

  "resource-bank": {
    file: "resource-bank",
    noun: ["resource", "resources"],
    description: "Templates, guides, and documents you can copy and use.",
    searchPlaceholder: "Search templates and guides",
    search: (v) => searchable(v.title, v.type, v.description),
    filters: [{ key: "type", label: "Type", get: (v) => v.type }],
    card: (v) => `
      <article class="res-card card">
        <div class="res-top">
          <span class="icon-tile is-lime">${icon(v.type === "Link" ? "external" : v.type === "Guide" ? "book" : "file")}</span>
          <div class="res-badges"><span class="badge">${esc(v.type)}</span>${sampleBadge(v)}</div>
        </div>
        <h3>${esc(v.title)}</h3>
        ${v.description ? `<p class="res-notes">${esc(v.description)}</p>` : ""}
        ${v.link ? `<div class="contact-row"><a class="contact-btn" href="${esc(v.link)}" target="_blank" rel="noopener">${icon("external")}Open<span class="visually-hidden"> ${esc(v.title)} (opens in a new tab)</span></a></div>` : ""}
      </article>`
  },

  csr: {
    file: "csr",
    noun: ["company", "companies"],
    description: "Industries near our district to approach for CSR support. Check each company's CSR policy before you write to them.",
    searchPlaceholder: "Search companies or areas",
    search: (v) => searchable(v.organisation, v.area, v.sector, v.focusAreas, v.description, v.notes),
    filters: [
      { key: "area", label: "Area", get: (v) => v.area },
      { key: "sector", label: "Sector", get: (v) => v.sector },
      { key: "focus", label: "Focus area", get: (v) => v.focusAreas }
    ],
    card: (v) => `
      <article class="res-card card">
        <div class="res-top">
          <span class="icon-tile is-navy">${icon("briefcase")}</span>
          <div class="res-badges">${v.area ? `<span class="badge">${esc(v.area)}</span>` : ""}${v.sector ? `<span class="badge">${esc(v.sector)}</span>` : ""}${sampleBadge(v)}</div>
        </div>
        <h3>${esc(v.organisation)}</h3>
        ${v.description ? `<p class="res-notes">${esc(v.description)}</p>` : ""}
        ${
          v.focusAreas?.length
            ? `<ul class="tag-list" aria-label="Focus areas">${v.focusAreas.map((f) => `<li class="badge badge-blue">${esc(f)}</li>`).join("")}</ul>`
            : ""
        }
        ${v.notes ? `<p class="res-notes">${esc(v.notes)}</p>` : ""}
        ${contactButtons({
          phone: v.phone,
          whatsapp: "",
          email: v.email,
          subject: "CSR partnership enquiry from Leo District 3231 A4",
          extra: [
            v.website ? `<a class="contact-btn" href="${esc(v.website)}" target="_blank" rel="noopener">${icon("external")}Website</a>` : "",
            v.applicationLink ? `<a class="contact-btn" href="${esc(v.applicationLink)}" target="_blank" rel="noopener">${icon("external")}Apply</a>` : ""
          ].join("")
        })}
      </article>`
  }
};

/* ---------- Elements ---------- */

const panel = document.getElementById("resource-panel");
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const form = panel.querySelector("[data-filters]");
const searchInput = panel.querySelector("[data-search]");
const selectsBox = panel.querySelector("[data-selects]");
const countEl = panel.querySelector("[data-count]");
const clearBtn = panel.querySelector("[data-clear]");
const results = panel.querySelector("[data-results]");
const descEl = panel.querySelector("[data-desc]");

const cache = {};
const filterState = {};
let active = "venues";
let loadToken = 0;

/* ---------- Filters and results ---------- */

function optionsFor(filter, items) {
  if (filter.options) return filter.options;
  const values = new Set();
  items.forEach((item) => {
    const value = filter.get(item);
    (Array.isArray(value) ? value : [value]).filter(Boolean).forEach((v) => values.add(v));
  });
  let list = Array.from(values);
  list = filter.order
    ? list.sort((a, b) => filter.order.indexOf(a) - filter.order.indexOf(b))
    : list.sort((a, b) => a.localeCompare(b));
  return list.map((v) => ({ value: v, label: v }));
}

function buildSelects(config, items) {
  const state = filterState[active];
  selectsBox.innerHTML = config.filters
    .map((f) => {
      if (f.showIf && !f.showIf(items)) return "";
      const options = optionsFor(f, items);
      if (options.length < 2) return "";
      const id = `filter-${active}-${f.key}`;
      const opts = options
        .map((o) => `<option value="${esc(o.value)}"${state.filters[f.key] === o.value ? " selected" : ""}>${esc(o.label)}</option>`)
        .join("");
      return `<div class="filter-select">
        <label class="visually-hidden" for="${id}">${esc(f.label)}</label>
        <select class="select" id="${id}" data-filter="${f.key}">
          <option value="">${esc(f.allLabel || `All ${f.label.toLowerCase()}s`)}</option>${opts}
        </select>
      </div>`;
    })
    .join("");
}

function matches(config, item, state) {
  if (state.query && !config.search(item).includes(state.query)) return false;
  return config.filters.every((f) => {
    const value = state.filters[f.key];
    if (!value) return true;
    if (f.match) return f.match(item, value);
    const itemValue = f.get(item);
    return Array.isArray(itemValue) ? itemValue.includes(value) : itemValue === value;
  });
}

function hasActiveFilters(state) {
  return Boolean(state.query) || Object.values(state.filters).some(Boolean);
}

function clearFilters() {
  filterState[active] = { query: "", filters: {} };
  searchInput.value = "";
  selectsBox.querySelectorAll("select").forEach((s) => (s.value = ""));
  render();
  searchInput.focus();
}

function render() {
  const config = CATEGORIES[active];
  const items = cache[active] || [];
  const state = filterState[active];
  const list = items.filter((item) => matches(config, item, state));
  const [one, many] = config.noun;
  const filtered = hasActiveFilters(state);

  countEl.textContent = filtered
    ? `${list.length} of ${items.length} ${items.length === 1 ? one : many}`
    : `${items.length} ${items.length === 1 ? one : many}`;
  clearBtn.hidden = !filtered;

  if (!items.length) {
    renderEmpty(results, {
      title: `No ${many} yet`,
      text: "Know a good one? Use Suggest a resource to add it for every club."
    });
    return;
  }

  if (!list.length) {
    renderEmpty(results, {
      title: `No ${many} match`,
      text: "Try a shorter search word, or clear the filters to see everything.",
      action: { label: "Clear filters", onClick: clearFilters }
    });
    return;
  }

  results.removeAttribute("aria-busy");
  results.innerHTML = `<div class="res-grid">${list.map(config.card).join("")}</div>`;
}

async function show(key, { focusTab = false, updateHash = true } = {}) {
  if (!CATEGORIES[key]) key = "venues";
  active = key;
  const config = CATEGORIES[key];
  filterState[key] ??= { query: "", filters: {} };

  tabs.forEach((tab) => {
    const selected = tab.dataset.tab === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) {
      panel.setAttribute("aria-labelledby", tab.id);
      if (focusTab) tab.focus();
    }
  });

  if (updateHash) history.replaceState(null, "", `#${key}`);
  descEl.textContent = config.description;
  searchInput.placeholder = config.searchPlaceholder;
  searchInput.value = filterState[key].query;
  selectsBox.innerHTML = "";
  countEl.textContent = "";
  clearBtn.hidden = true;

  if (!cache[key]) {
    const token = ++loadToken;
    renderLoading(results, 3);
    try {
      const data = await loadData(config.file);
      cache[key] = Array.isArray(data) ? data : data.items || [];
    } catch (error) {
      if (token === loadToken) renderError(results, error.message, () => show(key, { updateHash: false }));
      return;
    }
    if (token !== loadToken || active !== key) return;
  }

  buildSelects(config, cache[key]);
  render();
}

/* ---------- Events ---------- */

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => show(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    let next = null;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      show(next.dataset.tab, { focusTab: true });
    }
  });
});

form.addEventListener("submit", (event) => event.preventDefault());

searchInput.addEventListener(
  "input",
  debounce(() => {
    filterState[active].query = searchInput.value.trim().toLowerCase();
    render();
  }, 120)
);

selectsBox.addEventListener("change", (event) => {
  const select = event.target.closest("[data-filter]");
  if (!select) return;
  filterState[active].filters[select.dataset.filter] = select.value;
  render();
});

clearBtn.addEventListener("click", clearFilters);

window.addEventListener("hashchange", () => {
  const key = location.hash.slice(1);
  if (CATEGORIES[key] && key !== active) show(key, { updateHash: false });
});

/* ---------- Start ---------- */

show(location.hash.slice(1) || "venues", { updateHash: Boolean(location.hash) });
