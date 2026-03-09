<script lang="ts">
  import type { Wine } from "$lib/firebase";

  let {
    wine,
    isEditing = false,
    onEdit,
    onDelete,
  }: {
    wine: Wine & { id: string };
    isEditing: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  } = $props();

  const dotColors: Record<string, string> = {
    red: "bg-wine",
    white: "bg-[#f0e68c] border border-[#d4c84a]",
    rosé: "bg-[#f4a7b0]",
    bubbles: "bg-[#e8dcc8] border border-[#c4b89a]",
  };

  let hasLink = $derived(!!wine.link);
</script>

<div class="group bg-white rounded-xl py-4 px-5 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex items-start gap-3 {isEditing ? 'border-[1.5px] border-wine-light' : ''}">
  <div class="w-3 h-3 rounded-full shrink-0 mt-[5px] {dotColors[wine.color] ?? ''}"></div>
  <div class="flex-1 min-w-0">
    <div class="font-semibold">
      {#if wine.link}
        <a href={wine.link} target="_blank" rel="noopener" class="text-wine no-underline border-b border-dashed border-wine-light pb-0.5 hover:border-solid">{wine.name}</a>
      {:else}
        {wine.name}
      {/if}
    </div>
    <div class="text-text-light text-[0.9rem] {hasLink ? 'mt-2' : ''}">{wine.person}</div>
    {#if wine.notes}
      <div class="text-text-light text-[0.85rem] italic mt-0.5">{wine.notes}</div>
    {/if}
  </div>
  <div class="flex shrink-0 opacity-40 transition-opacity duration-200 group-hover:opacity-100">
    <button
      class="bg-transparent text-wine-light py-[0.3rem] px-[0.6rem] border-none rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 hover:bg-wine/8"
      title="Rediger"
      onclick={() => onEdit(wine.id)}
    >✎</button>
    <button
      class="bg-transparent text-wine-light py-[0.3rem] px-[0.6rem] border-none rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 hover:bg-wine/8"
      title="Slett"
      onclick={() => onDelete(wine.id)}
    >&times;</button>
  </div>
</div>
