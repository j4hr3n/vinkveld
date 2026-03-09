import "./style.css";
import {
  createNight,
  subscribeToNight,
  addWine,
  removeWine,
  type WineNight,
  type Wine,
} from "./firebase.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;

const COLORS: readonly {
  id: string;
  label: string;
  css: string;
  border?: string;
}[] = [
  { id: "red", label: "Rød", css: "#722f37" },
  { id: "white", label: "Hvit", css: "#f0e68c", border: "#d4c84a" },
  { id: "rosé", label: "Rosé", css: "#f4a7b0" },
  { id: "orange", label: "Oransje", css: "#e8a856" },
  { id: "bubbles", label: "Bobler", css: "#e8dcc8", border: "#c4b89a" },
];

function getRoute(): { page: "home" | "night" | "error"; id?: string } {
  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") return { page: "home" };
  const match = hash.match(/^#\/(.+)$/);
  if (match) return { page: "night", id: match[1] };
  return { page: "error" };
}

function navigate(path: string) {
  window.location.hash = path;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// --- Home Page ---
function renderHome() {
  app.innerHTML = `
    <div class="home">
      <h1>Vinkveld</h1>
      <p class="tagline">Planlegg vinkveldens lineup</p>
      <div class="create-form">
        <h2>Nytt vinkveld</h2>
        <div class="field">
          <label for="title">Tittel</label>
          <input type="text" id="title" placeholder="f.eks. Vinkveld hos Christoffer" />
        </div>
        <div class="field">
          <label for="date">Dato</label>
          <input type="date" id="date" value="${todayStr()}" />
        </div>
        <button class="btn btn-primary" id="create-btn">Opprett vinkveld</button>
      </div>
    </div>
  `;

  const titleInput = document.getElementById("title") as HTMLInputElement;
  const dateInput = document.getElementById("date") as HTMLInputElement;
  const createBtn = document.getElementById("create-btn")!;

  createBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const date = dateInput.value;
    if (!title) {
      titleInput.focus();
      return;
    }
    createBtn.textContent = "Oppretter...";
    (createBtn as HTMLButtonElement).disabled = true;
    const id = await createNight(title, date);
    navigate(`/${id}`);
  });

  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createBtn.click();
  });
}

// --- Night Page ---
let unsubscribe: (() => void) | null = null;

function renderNight(nightId: string) {
  // Clean up previous subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Laster vinkveld...</p>
    </div>
  `;

  unsubscribe = subscribeToNight(nightId, (night) => {
    if (!night) {
      renderNotFound();
      return;
    }
    renderNightContent(nightId, night);
  });
}

function renderNightContent(nightId: string, night: WineNight) {
  const wines = night.wines
    ? Object.entries(night.wines).map(([id, w]) => ({ ...w, id }))
    : [];
  wines.sort(
    (a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()
  );

  const shareUrl = window.location.href;

  // Group by person
  const byPerson = new Map<string, (Wine & { id: string })[]>();
  for (const w of wines) {
    const list = byPerson.get(w.person) || [];
    list.push(w);
    byPerson.set(w.person, list);
  }

  app.innerHTML = `
    <div class="night-page">
      <div class="night-header">
        <h1>${escapeHtml(night.title)}</h1>
        <div class="date">${formatDate(night.date)}</div>
        <div class="share-bar">
          <input type="text" value="${shareUrl}" readonly id="share-url" />
          <button class="btn btn-outline btn-small" id="copy-btn">Kopier lenke</button>
        </div>
      </div>

      ${
        wines.length === 0
          ? `
        <div class="empty-state">
          <div class="icon">🍷</div>
          <p>Ingen viner ennå — legg til den første!</p>
        </div>
      `
          : `
        <div class="wine-list">
          ${wines
            .map(
              (w) => `
            <div class="wine-card">
              <div class="wine-dot ${w.color}"></div>
              <div class="wine-info">
                <div class="wine-name">${escapeHtml(w.name)}</div>
                <div class="wine-person">${escapeHtml(w.person)}</div>
                ${w.notes ? `<div class="wine-notes">${escapeHtml(w.notes)}</div>` : ""}
              </div>
              <button class="btn btn-ghost delete-wine" data-id="${w.id}">&times;</button>
            </div>
          `
            )
            .join("")}
        </div>
      `
      }

      <div class="add-wine-form">
        <h3>Legg til vin</h3>
        <div class="form-row">
          <div class="field">
            <label for="wine-name">Vin</label>
            <input type="text" id="wine-name" placeholder="f.eks. Barolo 2019" />
          </div>
          <div class="field">
            <label for="wine-person">Hvem tar med?</label>
            <input type="text" id="wine-person" placeholder="Ditt navn" />
          </div>
        </div>
        <div class="field">
          <label>Type</label>
          <div class="color-picker" id="color-picker">
            ${COLORS.map(
              (c) => `
              <div class="color-option${c.id === "red" ? " selected" : ""}" data-color="${c.id}">
                <span class="dot" style="background:${c.css}${c.border ? `;border:1px solid ${c.border}` : ""}"></span>
                ${c.label}
              </div>
            `
            ).join("")}
          </div>
        </div>
        <div class="field">
          <label for="wine-notes">Notater (valgfritt)</label>
          <input type="text" id="wine-notes" placeholder="f.eks. Fra kjelleren" />
        </div>
        <button class="btn btn-primary" id="add-wine-btn">Legg til</button>
      </div>
    </div>
    <div class="copied-toast" id="toast">Lenke kopiert!</div>
  `;

  // Remember last used name
  const personInput = document.getElementById(
    "wine-person"
  ) as HTMLInputElement;
  const savedName = localStorage.getItem("vinkveld-name");
  if (savedName) personInput.value = savedName;

  // Copy URL
  document.getElementById("copy-btn")!.addEventListener("click", () => {
    const urlInput = document.getElementById("share-url") as HTMLInputElement;
    urlInput.select();
    navigator.clipboard.writeText(urlInput.value);
    const toast = document.getElementById("toast")!;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1500);
  });

  // Color picker
  let selectedColor = "red";
  document.getElementById("color-picker")!.addEventListener("click", (e) => {
    const option = (e.target as HTMLElement).closest(
      ".color-option"
    ) as HTMLElement | null;
    if (!option) return;
    document
      .querySelectorAll(".color-option")
      .forEach((el) => el.classList.remove("selected"));
    option.classList.add("selected");
    selectedColor = option.dataset.color!;
  });

  // Add wine
  const addBtn = document.getElementById("add-wine-btn")!;
  const nameInput = document.getElementById("wine-name") as HTMLInputElement;

  async function handleAdd() {
    const name = nameInput.value.trim();
    const person = personInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    if (!person) {
      personInput.focus();
      return;
    }
    localStorage.setItem("vinkveld-name", person);
    addBtn.textContent = "Legger til...";
    (addBtn as HTMLButtonElement).disabled = true;
    const notes = (
      document.getElementById("wine-notes") as HTMLInputElement
    ).value.trim();
    await addWine(nightId, {
      name,
      person,
      color: selectedColor as Wine["color"],
      notes,
    });
    // The subscription will re-render the page
  }

  addBtn.addEventListener("click", handleAdd);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdd();
  });

  // Delete wine
  document.querySelectorAll(".delete-wine").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wineId = (btn as HTMLElement).dataset.id!;
      removeWine(nightId, wineId);
    });
  });
}

function renderNotFound() {
  app.innerHTML = `
    <div class="error-page">
      <h1>Fant ikke vinkveldet</h1>
      <p>Kanskje lenken er feil?</p>
      <p><a href="#/">Lag et nytt vinkveld</a></p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Router ---
function route() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const { page, id } = getRoute();
  switch (page) {
    case "home":
      renderHome();
      break;
    case "night":
      renderNight(id!);
      break;
    default:
      renderNotFound();
  }
}

window.addEventListener("hashchange", route);
route();
