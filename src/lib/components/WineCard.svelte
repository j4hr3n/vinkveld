<script lang="ts">
  import type { Wine } from "$lib/firebase";
  import { stripeColors, colorLabels } from "$lib/colors";

  let {
    wine,
    isEditing = false,
    onEdit,
    onDelete,
    index = 0,
  }: {
    wine: Wine & { id: string };
    isEditing: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    index?: number;
  } = $props();

  const bgTints: Record<string, string> = {
    red: "rgba(92,26,42,0.02)",
    white: "rgba(232,221,138,0.06)",
    rosé: "rgba(232,144,154,0.04)",
    bubbles: "rgba(212,200,168,0.04)",
  };

  let initials = $derived(
    wine.person
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  );
</script>

<div
  class="group relative bg-white/80 backdrop-blur-sm rounded-2xl py-4 pr-5 pl-7 shadow-[0_1px_8px_rgba(92,26,42,0.04)] flex items-start gap-4 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(92,26,42,0.08)] hover:-translate-y-0.5 animate-rise-in overflow-hidden {isEditing ? 'ring-2 ring-wine-light/40' : ''}"
  style="animation-delay: {index * 0.06}s; background: {bgTints[wine.color] ?? 'transparent'}"
>
  <!-- Vertical color stripe -->
  <div
    class="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
    style="background: {stripeColors[wine.color] ?? '#999'}"
  ></div>

  <!-- Initials avatar -->
  <div
    class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[0.7rem] font-bold tracking-wide text-white/90 mt-0.5"
    style="background: {stripeColors[wine.color] ?? '#999'}"
  >
    {initials}
  </div>

  <div class="flex-1 min-w-0">
    <div class="font-semibold text-[0.95rem] leading-snug">
      {#if wine.link}
        <a
          href={wine.link}
          target="_blank"
          rel="noopener"
          class="text-text no-underline hover:text-wine transition-colors duration-200 inline-flex items-center gap-1.5"
        >
          {wine.name}
          <svg class="w-3.5 h-3.5 opacity-40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 3h7v7M13 3L6 10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      {:else}
        {wine.name}
      {/if}
    </div>
    <div class="text-text-light text-[0.85rem] mt-1 flex items-center gap-2">
      <span>{wine.person}</span>
      <span class="text-cream-dark">·</span>
      <span class="text-[0.8rem] opacity-70">{colorLabels[wine.color] ?? wine.color}</span>
    </div>
    {#if wine.notes}
      <div class="text-text-light text-[0.82rem] italic mt-1 font-accent text-base">{wine.notes}</div>
    {/if}
  </div>

  <div class="flex shrink-0 gap-0.5 max-[480px]:opacity-100 opacity-0 transition-all duration-300 group-hover:opacity-100">
    <button
      class="bg-transparent text-text-light p-2 border-none rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-wine/8 hover:text-wine"
      title="Rediger"
      onclick={() => onEdit(wine.id)}
    >
      <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button
      class="bg-transparent text-text-light p-2 border-none rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-500"
      title="Slett"
      onclick={() => onDelete(wine.id)}
    >
      <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</div>
