<script lang="ts">
  import type { Wine } from "$lib/firebase";

  const COLORS: readonly {
    id: string;
    label: string;
    css: string;
    border?: string;
  }[] = [
    { id: "red", label: "Rød", css: "#5c1a2a" },
    { id: "white", label: "Hvit", css: "#e8dd8a", border: "#c8bc5a" },
    { id: "rosé", label: "Rosé", css: "#e8909a" },
    { id: "bubbles", label: "Bobler", css: "#d4c8a8", border: "#b8ac8a" },
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

  const fieldInputClass = "w-full py-3 px-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]";
  const fieldLabelClass = "block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider";
</script>

<div class="relative bg-white/80 backdrop-blur-sm rounded-2xl p-7 max-[480px]:p-5 shadow-[0_4px_24px_rgba(92,26,42,0.06)] border border-cream-dark/60 animate-rise-in overflow-hidden">
  <!-- Top accent line -->
  <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-wine/30 to-transparent"></div>

  <h3 class="text-lg text-wine mb-6 font-semibold font-serif">{editing ? "Rediger vin" : "Legg til vin"}</h3>

  <div class="flex gap-4 max-[480px]:flex-col max-[480px]:gap-0">
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
    <div class="flex gap-3 flex-wrap">
      {#each COLORS as color}
        <button
          type="button"
          class="flex flex-col items-center gap-1.5 py-2.5 px-3 rounded-xl border-[1.5px] cursor-pointer transition-all duration-300 font-[inherit] {selectedColor === color.id ? 'border-wine bg-white shadow-[0_2px_8px_rgba(92,26,42,0.1)]' : 'border-cream-dark bg-cream/40 hover:border-wine-light hover:bg-white/60'}"
          onclick={() => (selectedColor = color.id as Wine["color"])}
        >
          <span
            class="w-5 h-5 rounded-full transition-transform duration-300 {selectedColor === color.id ? 'scale-110' : ''}"
            style="background:{color.css}{color.border ? `;border:1.5px solid ${color.border}` : ''}{selectedColor === color.id ? ';box-shadow:0 2px 6px rgba(0,0,0,0.15)' : ''}"
          ></span>
          <span class="text-[0.75rem] font-medium {selectedColor === color.id ? 'text-wine' : 'text-text-light'}">{color.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="mb-5">
    <label for="wine-link" class={fieldLabelClass}>Lenke <span class="normal-case tracking-normal font-normal opacity-60">(valgfritt)</span></label>
    <input type="url" id="wine-link" placeholder="f.eks. https://vivino.com/..." bind:value={link} class={fieldInputClass} />
  </div>
  <div class="mb-7">
    <label for="wine-notes" class={fieldLabelClass}>Notater <span class="normal-case tracking-normal font-normal opacity-60">(valgfritt)</span></label>
    <input type="text" id="wine-notes" placeholder="f.eks. Fra kjelleren" bind:value={notes} onkeydown={handleKeydown} class={fieldInputClass} />
  </div>

  {#if editing}
    <div class="flex gap-3">
      <button
        class="flex-1 py-3.5 px-6 border-none rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-wine text-white hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] active:scale-[0.98] disabled:opacity-60"
        onclick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Lagrer..." : "Lagre endringer"}
      </button>
      <button
        class="py-3.5 px-5 border-[1.5px] border-cream-dark rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-transparent text-text-light hover:border-wine-light hover:text-wine"
        onclick={onCancel}
      >
        Avbryt
      </button>
    </div>
  {:else}
    <button
      class="w-full py-3.5 px-6 border-none rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-wine text-white hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      onclick={handleSubmit}
      disabled={submitting}
    >
      {submitting ? "Legger til..." : "Legg til"}
    </button>
  {/if}
</div>
