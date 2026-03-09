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

  const fieldInputClass = "w-full py-[0.7rem] px-[0.9rem] border-[1.5px] border-cream-dark rounded-lg text-base font-[inherit] transition-colors duration-200 bg-cream focus:outline-none focus:border-wine-light";
  const fieldLabelClass = "block text-[0.85rem] font-medium text-text-light mb-1.5";
</script>

<div class="bg-white rounded-xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
  <h3 class="text-[1.1rem] text-wine mb-5 font-serif">{editing ? "Rediger vin" : "Legg til vin"}</h3>
  <div class="flex gap-3 max-[480px]:flex-col max-[480px]:gap-0">
    <div class="flex-1 mb-5">
      <label for="wine-name" class={fieldLabelClass}>Vin</label>
      <input
        type="text"
        id="wine-name"
        placeholder="f.eks. Barolo 2019"
        bind:value={name}
        bind:this={nameInput}
        onkeydown={handleKeydown}
        class={fieldInputClass}
      />
    </div>
    <div class="flex-1 mb-5">
      <label for="wine-person" class={fieldLabelClass}>Hvem tar med?</label>
      <input
        type="text"
        id="wine-person"
        placeholder="Ditt navn"
        bind:value={person}
        bind:this={personInput}
        class={fieldInputClass}
      />
    </div>
  </div>
  <div class="mb-5">
    <label class={fieldLabelClass}>Type</label>
    <div class="flex gap-2 flex-wrap">
      {#each COLORS as color}
        <button
          type="button"
          class="flex items-center gap-[0.35rem] py-[0.35rem] px-[0.65rem] rounded-[20px] border-[1.5px] text-[0.85rem] cursor-pointer transition-all duration-200 font-[inherit] text-inherit {selectedColor === color.id ? 'border-wine bg-white' : 'border-cream-dark bg-cream hover:border-wine-light'}"
          onclick={() => (selectedColor = color.id as Wine["color"])}
        >
          <span
            class="w-[10px] h-[10px] rounded-full"
            style="background:{color.css}{color.border ? `;border:1px solid ${color.border}` : ''}"
          ></span>
          {color.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="mb-5">
    <label for="wine-link" class={fieldLabelClass}>Lenke (valgfritt)</label>
    <input type="url" id="wine-link" placeholder="f.eks. https://vivino.com/..." bind:value={link} class={fieldInputClass} />
  </div>
  <div class="mb-5">
    <label for="wine-notes" class={fieldLabelClass}>Notater (valgfritt)</label>
    <input type="text" id="wine-notes" placeholder="f.eks. Fra kjelleren" bind:value={notes} class={fieldInputClass} />
  </div>
  {#if editing}
    <div class="flex gap-3">
      <button
        class="inline-flex items-center justify-center gap-2 py-3 px-6 border-none rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 bg-wine text-white w-full hover:bg-wine-dark"
        onclick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Lagrer..." : "Lagre endringer"}
      </button>
      <button
        class="inline-flex items-center gap-2 py-3 px-6 border-[1.5px] border-wine-light rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 bg-transparent text-wine w-auto hover:bg-wine hover:text-white"
        onclick={onCancel}
      >
        Avbryt
      </button>
    </div>
  {:else}
    <button
      class="inline-flex items-center justify-center gap-2 py-3 px-6 border-none rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 bg-wine text-white w-full hover:bg-wine-dark"
      onclick={handleSubmit}
      disabled={submitting}
    >
      {submitting ? "Legger til..." : "Legg til"}
    </button>
  {/if}
</div>
