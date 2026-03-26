<script lang="ts">
  import { untrack } from "svelte";
  import type { Wine } from "$lib/firebase";
  import { stripeColors, colorLabels, bgTints } from "$lib/colors";
  import { getInitials } from "$lib/utils";

  let {
    wine,
    isEditing = false,
    completed = false,
    hidePersonField = false,
    isPastEvent = false,
    onEdit,
    onDelete,
    index = 0,
    currentUser = '',
    onRate,
  }: {
    wine: Wine & { id: string };
    isEditing: boolean;
    completed?: boolean;
    hidePersonField?: boolean;
    isPastEvent?: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    index?: number;
    currentUser?: string;
    onRate?: (wineId: string, score: number) => void;
  } = $props();

  let confirmingDelete = $state(false);
  let initials = $derived(getInitials(wine.person ?? ""));

  // Rating input — initialise from persisted value
  let ratingInput = $state<string>(
    untrack(() => wine.ratings?.[currentUser] != null ? String(wine.ratings[currentUser]) : '')
  );

  // Keep in sync when Firebase pushes an update for this user's score
  $effect(() => {
    const persisted = wine.ratings?.[currentUser];
    ratingInput = persisted != null ? String(persisted) : '';
  });

  function submitRating() {
    const val = parseInt(ratingInput, 10);
    if (isNaN(val)) return;
    const clamped = Math.min(100, Math.max(50, val));
    ratingInput = String(clamped);
    onRate?.(wine.id, clamped);
  }

  function handleRatingKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }

  let ratingEntries = $derived(wine.ratings ? Object.entries(wine.ratings) : []);

  let avgRating = $derived.by(() => {
    if (!ratingEntries.length) return null;
    const sum = ratingEntries.reduce((acc, [, score]) => acc + score, 0);
    return Math.round(sum / ratingEntries.length);
  });

  function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 40%, 35%)`;
  }

  let showRatingSection = $derived(
    (isPastEvent && !completed && currentUser !== '') ||
    (completed && ratingEntries.length > 0)
  );
</script>

<div
  class="group relative bg-white/80 backdrop-blur-sm rounded-2xl py-4 pr-5 pl-7 shadow-[0_1px_8px_rgba(92,26,42,0.04)] flex flex-col transition-all duration-300 hover:shadow-[0_6px_20px_rgba(92,26,42,0.08)] hover:-translate-y-0.5 animate-rise-in overflow-hidden {isEditing ? 'ring-2 ring-wine-light/40' : ''}"
  style="animation-delay: {index * 0.06}s; background: {bgTints[wine.color] ?? 'transparent'}"
>
  <!-- Vertical color stripe -->
  <div
    class="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
    style="background: {stripeColors[wine.color] ?? '#999'}"
  ></div>

  <!-- Top row: avatar + info + actions -->
  <div class="flex items-start gap-4">
    {#if !hidePersonField}
      <!-- Initials avatar -->
      <div
        class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[0.7rem] font-bold tracking-wide text-white/90 mt-0.5"
        style="background: {stripeColors[wine.color] ?? '#999'}"
      >
        {initials}
      </div>
    {/if}

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
        {#if !hidePersonField && wine.person}
          <span>{wine.person}</span>
          <span class="text-cream-dark">·</span>
        {/if}
        <span class="text-[0.8rem] opacity-70">{colorLabels[wine.color] ?? wine.color}</span>
      </div>
      {#if wine.notes}
        <div class="text-text-light text-[0.82rem] italic mt-1 font-accent text-base">{wine.notes}</div>
      {/if}
    </div>

    {#if !completed}{#if confirmingDelete}
      <div class="flex shrink-0 items-center gap-2 animate-fade-in">
        <span class="text-[0.8rem] text-text-light whitespace-nowrap">Slette?</span>
        <button
          class="bg-wine-dark text-white/90 px-3 py-1 border-none rounded-lg text-[0.78rem] font-medium cursor-pointer transition-all duration-200 hover:bg-wine-dark/90 hover:text-white"
          onclick={() => onDelete(wine.id)}
        >
          Slett
        </button>
        <button
          class="bg-cream-dark/60 text-text-light px-3 py-1 border-none rounded-lg text-[0.78rem] font-medium cursor-pointer transition-all duration-200 hover:bg-cream-dark hover:text-text"
          onclick={() => (confirmingDelete = false)}
        >
          Avbryt
        </button>
      </div>
    {:else}
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
          class="bg-transparent text-text-light p-2 border-none rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-wine/8 hover:text-wine"
          title="Slett"
          onclick={() => (confirmingDelete = true)}
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    {/if}{/if}
  </div>

  <!-- Rating section -->
  {#if showRatingSection}
    <div class="mt-3 pt-3 ml-13 border-t border-wine/10">
      {#if !completed && currentUser}
        <!-- Ongoing: personal score input -->
        <div class="flex items-center gap-2.5">
          <span class="text-[0.75rem] font-medium text-text-light uppercase tracking-wider">Din score</span>
          <input
            type="number"
            min="50"
            max="100"
            step="1"
            bind:value={ratingInput}
            onblur={submitRating}
            onkeydown={handleRatingKeydown}
            class="w-16 text-center py-1 px-2 border-[1.5px] border-cream-dark rounded-lg text-[0.9rem] font-semibold font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-200 text-wine [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="–"
          />
          <span class="text-[0.72rem] text-text-light opacity-40">/ 100</span>
        </div>
      {:else if completed && ratingEntries.length > 0}
        <!-- Completed: all scores revealed + average -->
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {#each ratingEntries as [person, score]}
            <span class="inline-flex items-baseline gap-1 text-[0.82rem]">
              <span class="font-semibold" style="color: {getAvatarColor(person)}">{person}</span>
              <span class="text-text-light font-medium">{score}</span>
            </span>
          {/each}
          {#if ratingEntries.length > 1}
            <span class="text-cream-dark/60 text-[0.75rem]">·</span>
            <span class="text-[0.88rem] font-bold text-wine">Gj.snitt {avgRating}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
