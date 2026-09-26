// Hub admin: decrypt a list for editing, encrypt an edited list, and change
// the district passcode. All work happens in the browser.

import { toast } from "./utils.js";
import { keyFromPasscode, createLock, encryptData, decryptData } from "./crypto-core.js";

const LISTS = ["venues", "vendors", "banks", "resource-bank", "csr"];

const unlockCard = document.querySelector("[data-admin-unlock]");
const unlockForm = document.querySelector("[data-unlock-form]");
const unlockError = document.querySelector("[data-unlock-error]");
const tools = document.querySelector("[data-admin-tools]");
const listSelect = document.querySelector("[data-list]");
const fileInput = document.querySelector("[data-file]");
const editError = document.querySelector("[data-edit-error]");
const changeForm = document.querySelector("[data-change-form]");
const changeError = document.querySelector("[data-change-error]");

let key = null;

async function fetchJSON(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`The file ${path} did not load (error ${response.status}).`);
  return response.json();
}

function download(name, value) {
  const blob = new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  unlockError.textContent = "";
  const passcode = unlockForm.passcode.value.trim();
  if (!passcode) {
    unlockError.textContent = "Enter the current passcode.";
    return;
  }
  try {
    const lock = await fetchJSON("data/hub.lock.json");
    key = await keyFromPasscode(passcode, lock);
  } catch (error) {
    unlockError.textContent = error.message;
    return;
  }
  if (!key) {
    unlockError.textContent = "That passcode is not right.";
    unlockForm.passcode.select();
    return;
  }
  unlockForm.reset();
  unlockCard.hidden = true;
  tools.hidden = false;
  tools.querySelector("h2").setAttribute("tabindex", "-1");
  tools.querySelector("h2").focus();
});

document.querySelector("[data-download-plain]").addEventListener("click", async () => {
  editError.textContent = "";
  const name = listSelect.value;
  try {
    const data = await decryptData(await fetchJSON(`data/${name}.enc.json`), key);
    download(`${name}.json`, data);
    toast(`Downloaded ${name}.json`);
  } catch {
    editError.textContent = `Could not open data/${name}.enc.json with this passcode.`;
  }
});

document.querySelector("[data-encrypt]").addEventListener("click", async () => {
  editError.textContent = "";
  const name = listSelect.value;
  const file = fileInput.files[0];
  if (!file) {
    editError.textContent = "Choose the edited .json file first.";
    return;
  }
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (error) {
    editError.textContent = `This file has a formatting mistake: ${error.message}. Check for a missing comma or quote.`;
    return;
  }
  if (!data || !Array.isArray(data.items)) {
    editError.textContent = 'This file must have an "items" list. Start from the readable file you downloaded.';
    return;
  }
  download(`${name}.enc.json`, await encryptData(data, key, name));
  toast(`Created ${name}.enc.json. Upload it to the data folder.`);
});

changeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  changeError.textContent = "";
  const next = changeForm.next.value;
  if (next.length < 10) {
    changeError.textContent = "The new passcode must have at least 10 characters.";
    return;
  }
  if (next !== changeForm.confirm.value) {
    changeError.textContent = "The two passcodes are not the same.";
    return;
  }

  let lists;
  try {
    lists = await Promise.all(LISTS.map(async (name) => [name, await decryptData(await fetchJSON(`data/${name}.enc.json`), key)]));
  } catch {
    changeError.textContent = "One of the data files does not open with the current passcode. Fix that first.";
    return;
  }

  const { lock, key: newKey } = await createLock(next);
  download("hub.lock.json", lock);
  for (const [name, data] of lists) {
    await pause(400);
    download(`${name}.enc.json`, await encryptData(data, newKey, name));
  }
  changeForm.reset();
  toast("6 files created. Upload all of them to the data folder.");
});
