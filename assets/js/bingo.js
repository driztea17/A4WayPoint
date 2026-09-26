// Leadership Bingo: a 3 x 5 card of club leadership goals. Tap a square to
// cross it off, get a bingo for a full row or column, and download or share
// the card as an image. Progress and the club name stay on this device.

import { esc, loadData, renderError, toast, store } from "./utils.js";

const STORE_KEY = "a4wp:bingo";
const COLS = 3;
const IMG = { w: 1080, h: 1350 };
const INK = { navy: "#0e1440", dark: "#1a2260", lime: "#84c318", cream: "#f3efe6", orange: "#f97316" };

const grid = document.querySelector("[data-grid]");
const tag = document.querySelector("[data-tag]");
const labelEl = document.querySelector("[data-bingo-label]");
const clubInput = document.querySelector("[data-club]");
const countEl = document.querySelector("[data-count]");
const totalEl = document.querySelector("[data-total]");
const linesEl = document.querySelector("[data-lines]");
const bar = document.querySelector("[data-bar]");
const live = document.querySelector("[data-live]");
const shareBtn = document.querySelector("[data-share]");

let data;
let state = store.get(STORE_KEY, { done: [], club: "" });
if (!Array.isArray(state.done)) state = { done: [], club: "" };

const pad = (n) => String(n).padStart(2, "0");
const isDone = (id) => state.done.includes(id);
const save = () => store.set(STORE_KEY, state);

/* ---------- Bingo lines ---------- */

function lines() {
  const ids = data.squares.map((s) => s.id);
  const rows = [];
  for (let i = 0; i < ids.length; i += COLS) rows.push(ids.slice(i, i + COLS));
  const cols = Array.from({ length: COLS }, (_, c) => ids.filter((_, i) => i % COLS === c));
  return [...rows, ...cols].filter((line) => line.length > 1);
}

function completeLines() {
  return lines().filter((line) => line.every(isDone)).length;
}

/* ---------- Card ---------- */

const CROSS = `
  <svg class="bingo-cross" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M14 18 Q 50 52 86 84" pathLength="1"/>
    <path d="M84 16 Q 48 50 16 86" pathLength="1"/>
  </svg>`;

function renderGrid() {
  grid.innerHTML = data.squares
    .map((sq, i) => {
      const row = Math.floor(i / COLS);
      const tone = (row + (i % COLS)) % 2 === 0 ? "is-lime" : "is-dark";
      return `
      <li>
        <button type="button" class="bingo-cell ${tone}" data-id="${sq.id}" aria-pressed="${isDone(sq.id)}">
          <span class="bingo-num" aria-hidden="true">${pad(sq.id)}</span>
          <span class="bingo-text">${esc(sq.text)}</span>
          ${CROSS}
        </button>
      </li>`;
    })
    .join("");
}

function updateTag() {
  tag.textContent = (state.club || "Leo District 3231 A4").toUpperCase();
}

function updateScore(announce) {
  const done = state.done.length;
  const total = data.squares.length;
  const bingos = completeLines();
  countEl.textContent = String(done);
  totalEl.textContent = String(total);
  const pct = Math.round((done / total) * 100);
  bar.setAttribute("aria-valuenow", String(pct));
  bar.firstElementChild.style.width = `${pct}%`;
  linesEl.textContent =
    done === total
      ? "Full house! Every goal is done."
      : bingos
        ? `${bingos} bingo${bingos === 1 ? "" : "s"}! Keep going for a full house.`
        : "No bingo yet. Complete a full row or column.";
  return { bingos, done, total, announce };
}

/* ---------- Image ---------- */

function wrap(ctx, text, maxWidth) {
  const words = text.split(" ");
  const out = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) out.push(line);
  return out;
}

function arcText(ctx, text, cx, cy, radius, centreAngle) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + 3);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = centreAngle - total / radius / 2;
  chars.forEach((c, i) => {
    const w = widths[i];
    angle += w / 2 / radius;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    angle += w / 2 / radius;
  });
}

async function drawCard() {
  await Promise.all([document.fonts.load("800 280px Poppins"), document.fonts.load("700 30px Poppins"), document.fonts.load("600 24px Poppins")]);
  const canvas = document.createElement("canvas");
  canvas.width = IMG.w;
  canvas.height = IMG.h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = INK.navy;
  ctx.fillRect(0, 0, IMG.w, IMG.h);

  // Wordmark
  ctx.fillStyle = INK.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let size = 290;
  ctx.font = `800 ${size}px Poppins`;
  while (ctx.measureText(data.title).width > 880 && size > 120) {
    size -= 10;
    ctx.font = `800 ${size}px Poppins`;
  }
  const titleW = ctx.measureText(data.title).width;
  ctx.fillText(data.title, IMG.w / 2, 330);

  // Curved label around the top right of the wordmark
  ctx.fillStyle = INK.lime;
  ctx.font = "700 44px Poppins";
  arcText(ctx, data.label, IMG.w / 2 + titleW / 2 - 150, 250, 130, -Math.PI / 3.2);

  // Grid
  const gx = 90;
  const gy = 385;
  const cw = 300;
  const ch = 164;
  const rows = Math.ceil(data.squares.length / COLS);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(gx, gy, cw * COLS, ch * rows, 40);
  ctx.clip();
  data.squares.forEach((sq, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = gx + col * cw;
    const y = gy + row * ch;
    const lime = (row + col) % 2 === 0;
    const done = isDone(sq.id);
    ctx.fillStyle = lime ? INK.lime : INK.dark;
    ctx.fillRect(x, y, cw, ch);

    ctx.globalAlpha = done ? 0.45 : 0.6;
    ctx.fillStyle = lime ? INK.navy : INK.cream;
    ctx.font = "600 20px Poppins";
    ctx.textAlign = "left";
    ctx.fillText(pad(sq.id), x + 18, y + 32);

    ctx.globalAlpha = done ? 0.45 : 1;
    ctx.textAlign = "center";
    let fs = 30;
    let textLines;
    do {
      ctx.font = `700 ${fs}px Poppins`;
      textLines = wrap(ctx, sq.text, cw - 50);
      fs -= 2;
    } while (textLines.length * fs * 1.2 > ch - 36 && fs > 18);
    const lh = (fs + 2) * 1.18;
    const startY = y + ch / 2 - ((textLines.length - 1) * lh) / 2 + (fs + 2) * 0.35;
    textLines.forEach((t, li) => ctx.fillText(t, x + cw / 2, startY + li * lh));
    ctx.globalAlpha = 1;

    if (done) {
      ctx.strokeStyle = INK.orange;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 42, y + 28);
      ctx.quadraticCurveTo(x + cw / 2, y + ch / 2 + 6, x + cw - 42, y + ch - 26);
      ctx.moveTo(x + cw - 44, y + 26);
      ctx.quadraticCurveTo(x + cw / 2 - 4, y + ch / 2, x + 44, y + ch - 28);
      ctx.stroke();
    }
  });
  ctx.restore();

  // Footer pill and score
  const label = (state.club || "Leo District 3231 A4").toUpperCase();
  ctx.font = "700 28px Poppins";
  ctx.textAlign = "center";
  const pw = Math.min(ctx.measureText(label).width + 90, 900);
  ctx.strokeStyle = INK.cream;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(IMG.w / 2 - pw / 2, 1222, pw, 60, 30);
  ctx.stroke();
  ctx.fillStyle = INK.cream;
  ctx.fillText(label, IMG.w / 2, 1262, 860);

  const bingos = completeLines();
  ctx.font = "600 24px Poppins";
  ctx.globalAlpha = 0.72;
  ctx.fillText(
    `${state.done.length} of ${data.squares.length} done${bingos ? `  ·  ${bingos} bingo${bingos === 1 ? "" : "s"}` : ""}  ·  A4 WAYPOINT`,
    IMG.w / 2,
    1322
  );
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function fileName() {
  const club = (state.club || "leo-district-3231-a4").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `leadership-bingo-${club || "card"}.png`;
}

async function download() {
  const blob = await drawCard();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName();
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  toast("Card downloaded. Share it with your friends!");
}

async function share() {
  const blob = await drawCard();
  const file = new File([blob], fileName(), { type: "image/png" });
  try {
    await navigator.share({
      files: [file],
      title: "Our Leadership Bingo",
      text: `${state.done.length} of ${data.squares.length} leadership goals done. Made with A4 WAYPOINT.`
    });
  } catch (error) {
    if (error.name !== "AbortError") toast("Sharing did not work. Use Download instead.");
  }
}

/* ---------- Events ---------- */

grid.addEventListener("click", (event) => {
  const cell = event.target.closest("[data-id]");
  if (!cell) return;
  const id = Number(cell.dataset.id);
  const before = completeLines();
  state.done = isDone(id) ? state.done.filter((x) => x !== id) : [...state.done, id];
  save();
  cell.setAttribute("aria-pressed", String(isDone(id)));
  const { bingos, done, total } = updateScore();
  const text = data.squares.find((s) => s.id === id).text;
  live.textContent = `${isDone(id) ? "Crossed off" : "Undone"}: ${text}. ${done} of ${total} done.`;
  if (done === total && isDone(id)) toast("Full house! Every leadership goal done.");
  else if (bingos > before) toast("BINGO! A full line is done.");
});

clubInput.addEventListener("input", () => {
  state.club = clubInput.value.trim().slice(0, 40);
  save();
  updateTag();
});

document.querySelector("[data-download]").addEventListener("click", download);
shareBtn.addEventListener("click", share);

document.querySelector("[data-reset]").addEventListener("click", () => {
  if (!state.done.length && !state.club) return;
  if (!window.confirm("Clear every crossed-off square and the club name?")) return;
  state = { done: [], club: "" };
  save();
  clubInput.value = "";
  renderGrid();
  updateTag();
  updateScore();
  toast("Card cleared");
});

/* ---------- Start ---------- */

async function start() {
  try {
    data = await loadData("bingo");
  } catch (error) {
    renderError(grid, error.message, start);
    return;
  }
  labelEl.textContent = data.label;
  state.done = state.done.filter((id) => data.squares.some((s) => s.id === id));
  clubInput.value = state.club || "";
  renderGrid();
  updateTag();
  updateScore();

  try {
    const probe = new File([new Blob(["x"], { type: "image/png" })], "probe.png", { type: "image/png" });
    shareBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch {
    shareBtn.hidden = true;
  }
}

start();
