<script lang="ts">
  import type { Wine } from "$lib/firebase";

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

  let {
    editing = null,
    onSubmit,
    onCancel,
  }: {
    editing: (Wine & { id: string }) | null;
    onSubmit: (data: { name: string; person: string; color: Wine["color"]; link: string; notes: string }) => Promise<void>;
    onCancel?: () => void;
  } = $props();

  let name = $state(editing?.name ?? "");
  let person = $state(editing?.person ?? "");
  let selectedColor = $state<Wine["color"]>(editing?.color ?? "red");
  let link = $state(editing?.link ?? "");
  let notes = $state(editing?.notes ?? "");
  let submitting = $state(false);

  let nameInput = $state<HTMLInputElement | null>(null);
  let personInput = $state<HTMLInputElement | null>(null);

  // Load saved name for new wines
  if (!editing) {
    const savedName = localStorage.getItem("vinkveld-name");
    if (savedName) person = savedName;
  }

  async function handleSubmit() {
    if (!name.trim()) {
      nameInput?.focus();
      return;
    }
    if (!person.trim()) {
      personInput?.focus();
      return;
    }
    submitting = true;
    localStorage.setItem("vinkveld-name", person.trim());
    await onSubmit({
      name: name.trim(),
      person: person.trim(),
      color: selectedColor,
      link: link.trim(),
      notes: notes.trim(),
    });
    if (!editing) {
      name = "";
      link = "";
      notes = "";
    }
    submitting = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }
</script>

<div class="add-wine-form">
  <h3>{editing ? "Rediger vin" : "Legg til vin"}</h3>
  <div class="form-row">
    <div class="field">
      <label for="wine-name">Vin</label>
      <input
        type="text"
        id="wine-name"
        placeholder="f.eks. Barolo 2019"
        bind:value={name}
        bind:this={nameInput}
        onkeydown={handleKeydown}
      />
    </div>
    <div class="field">
      <label for="wine-person">Hvem tar med?</label>
      <input
        type="text"
        id="wine-person"
        placeholder="Ditt navn"
        bind:value={person}
        bind:this={personInput}
      />
    </div>
  </div>
  <div class="field">
    <label>Type</label>
    <div class="color-picker">
      {#each COLORS as color}
        <button
          type="button"
          class="color-option"
          class:selected={selectedColor === color.id}
          onclick={() => (selectedColor = color.id as Wine["color"])}
        >
          <span
            class="dot"
            style="background:{color.css}{color.border ? `;border:1px solid ${color.border}` : ''}"
          ></span>
          {color.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="field">
    <label for="wine-link">Lenke (valgfritt)</label>
    <input type="url" id="wine-link" placeholder="f.eks. https://vivino.com/..." bind:value={link} />
  </div>
  <div class="field">
    <label for="wine-notes">Notater (valgfritt)</label>
    <input type="text" id="wine-notes" placeholder="f.eks. Fra kjelleren" bind:value={notes} />
  </div>
  {#if editing}
    <div class="form-row">
      <button class="btn btn-primary" onclick={handleSubmit} disabled={submitting}>
        {submitting ? "Lagrer..." : "Lagre endringer"}
      </button>
      <button class="btn btn-outline" style="width:auto" onclick={onCancel}>Avbryt</button>
    </div>
  {:else}
    <button class="btn btn-primary" onclick={handleSubmit} disabled={submitting}>
      {submitting ? "Legger til..." : "Legg til"}
    </button>
  {/if}
</div>

<style>
  .add-wine-form {
    background: white;
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .add-wine-form h3 {
    font-size: 1.1rem;
    color: var(--wine);
    margin-bottom: 1.25rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
  }

  .form-row .field {
    flex: 1;
  }

  .color-picker {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .color-option {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: 20px;
    border: 1.5px solid var(--cream-dark);
    background: var(--cream);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    color: inherit;
  }

  .color-option:hover {
    border-color: var(--wine-light);
  }

  .color-option.selected {
    border-color: var(--wine);
    background: white;
  }

  .color-option .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  @media (max-width: 480px) {
    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
</style>
