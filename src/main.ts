import "./style.css";
import {
  createNight,
  subscribeToNight,
  addWine,
  updateWine,
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
  const createBtn = document.getElementById("create-btn")!;

  createBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const date = (document.getElementById("date") as HTMLInputElement).value;
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
let editingWineId: string | null = null;

function renderNight(nightId: string) {
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
  const editing = editingWineId
    ? wines.find((w) => w.id === editingWineId)
    : null;

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
            <div class="wine-card${editingWineId === w.id ? " editing" : ""}">
              <div class="wine-dot ${w.color}"></div>
              <div class="wine-info">
                <div class="wine-name">${w.link ? `<a href="${escapeAttr(w.link)}" target="_blank" rel="noopener">${escapeHtml(w.name)}</a>` : escapeHtml(w.name)}</div>
                <div class="wine-person">${escapeHtml(w.person)}</div>
                ${w.notes ? `<div class="wine-notes">${escapeHtml(w.notes)}</div>` : ""}
              </div>
              <div class="wine-actions">
                <button class="btn btn-ghost edit-wine" data-id="${w.id}" title="Rediger">✎</button>
                <button class="btn btn-ghost delete-wine" data-id="${w.id}" title="Slett">&times;</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
      }

      <div class="add-wine-form">
        <h3>${editing ? "Rediger vin" : "Legg til vin"}</h3>
        <div class="form-row">
          <div class="field">
            <label for="wine-name">Vin</label>
            <input type="text" id="wine-name" placeholder="f.eks. Barolo 2019" value="${editing ? escapeAttr(editing.name) : ""}" />
          </div>
          <div class="field">
            <label for="wine-person">Hvem tar med?</label>
            <input type="text" id="wine-person" placeholder="Ditt navn" value="${editing ? escapeAttr(editing.person) : ""}" />
          </div>
        </div>
        <div class="field">
          <label>Type</label>
          <div class="color-picker" id="color-picker">
            ${COLORS.map(
              (c) => `
              <div class="color-option${c.id === (editing ? editing.color : "red") ? " selected" : ""}" data-color="${c.id}">
                <span class="dot" style="background:${c.css}${c.border ? `;border:1px solid ${c.border}` : ""}"></span>
                ${c.label}
              </div>
            `
            ).join("")}
          </div>
        </div>
        <div class="field">
          <label for="wine-link">Lenke (valgfritt)</label>
          <input type="url" id="wine-link" placeholder="f.eks. https://vivino.com/..." value="${editing?.link ? escapeAttr(editing.link) : ""}" />
        </div>
        <div class="field">
          <label for="wine-notes">Notater (valgfritt)</label>
          <input type="text" id="wine-notes" placeholder="f.eks. Fra kjelleren" value="${editing ? escapeAttr(editing.notes || "") : ""}" />
        </div>
        ${
          editing
            ? `
          <div class="form-row">
            <button class="btn btn-primary" id="save-wine-btn">Lagre endringer</button>
            <button class="btn btn-outline" id="cancel-edit-btn" style="width:auto">Avbryt</button>
          </div>
        `
            : `<button class="btn btn-primary" id="add-wine-btn">Legg til</button>`
        }
      </div>
    </div>
    <div class="copied-toast" id="toast">Lenke kopiert!</div>
  `;

  // Remember last used name
  const personInput = document.getElementById(
    "wine-person"
  ) as HTMLInputElement;
  if (!editing) {
    const savedName = localStorage.getItem("vinkveld-name");
    if (savedName) personInput.value = savedName;
  }

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
  let selectedColor: Wine["color"] = editing ? editing.color : "red";
  document.getElementById("color-picker")!.addEventListener("click", (e) => {
    const option = (e.target as HTMLElement).closest(
      ".color-option"
    ) as HTMLElement | null;
    if (!option) return;
    document
      .querySelectorAll(".color-option")
      .forEach((el) => el.classList.remove("selected"));
    option.classList.add("selected");
    selectedColor = option.dataset.color! as Wine["color"];
  });

  function getFormValues() {
    const name = (
      document.getElementById("wine-name") as HTMLInputElement
    ).value.trim();
    const person = personInput.value.trim();
    const link = (
      document.getElementById("wine-link") as HTMLInputElement
    ).value.trim();
    const notes = (
      document.getElementById("wine-notes") as HTMLInputElement
    ).value.trim();
    return { name, person, link, notes, color: selectedColor };
  }

  if (editing) {
    // Save edit
    const saveBtn = document.getElementById("save-wine-btn")!;
    saveBtn.addEventListener("click", async () => {
      const { name, person, link, notes, color } = getFormValues();
      if (!name) {
        (document.getElementById("wine-name") as HTMLInputElement).focus();
        return;
      }
      if (!person) {
        personInput.focus();
        return;
      }
      localStorage.setItem("vinkveld-name", person);
      saveBtn.textContent = "Lagrer...";
      (saveBtn as HTMLButtonElement).disabled = true;
      const wineId = editingWineId!;
      editingWineId = null;
      await updateWine(nightId, wineId, {
        name,
        person,
        color,
        link,
        notes,
      });
    });

    // Cancel edit
    document.getElementById("cancel-edit-btn")!.addEventListener("click", () => {
      editingWineId = null;
      renderNightContent(nightId, night);
    });
  } else {
    // Add wine
    const addBtn = document.getElementById("add-wine-btn")!;
    const nameInput = document.getElementById("wine-name") as HTMLInputElement;

    async function handleAdd() {
      const { name, person, link, notes, color } = getFormValues();
      if (!name) {
        (document.getElementById("wine-name") as HTMLInputElement).focus();
        return;
      }
      if (!person) {
        personInput.focus();
        return;
      }
      localStorage.setItem("vinkveld-name", person);
      addBtn.textContent = "Legger til...";
      (addBtn as HTMLButtonElement).disabled = true;
      await addWine(nightId, { name, person, color, link, notes });
    }

    addBtn.addEventListener("click", handleAdd);
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleAdd();
    });
  }

  // Edit wine
  document.querySelectorAll(".edit-wine").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingWineId = (btn as HTMLElement).dataset.id!;
      renderNightContent(nightId, night);
    });
  });

  // Delete wine
  document.querySelectorAll(".delete-wine").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wineId = (btn as HTMLElement).dataset.id!;
      if (editingWineId === wineId) editingWineId = null;
      removeWine(nightId, wineId);
    });
  });

  // Scroll to form if editing
  if (editing) {
    document.querySelector(".add-wine-form")?.scrollIntoView({ behavior: "smooth" });
  }
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

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Router ---
function route() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  editingWineId = null;

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
