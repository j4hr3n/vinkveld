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
</script>

<div class="wine-card" class:editing={isEditing}>
  <div class="wine-dot {wine.color}"></div>
  <div class="wine-info">
    <div class="wine-name">
      {#if wine.link}
        <a href={wine.link} target="_blank" rel="noopener">{wine.name}</a>
      {:else}
        {wine.name}
      {/if}
    </div>
    <div class="wine-person">{wine.person}</div>
    {#if wine.notes}
      <div class="wine-notes">{wine.notes}</div>
    {/if}
  </div>
  <div class="wine-actions">
    <button class="btn btn-ghost" title="Rediger" onclick={() => onEdit(wine.id)}>✎</button>
    <button class="btn btn-ghost" title="Slett" onclick={() => onDelete(wine.id)}>&times;</button>
  </div>
</div>

<style>
  .wine-card {
    background: white;
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .wine-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .wine-dot.red {
    background: #722f37;
  }
  .wine-dot.white {
    background: #f0e68c;
    border: 1px solid #d4c84a;
  }
  .wine-dot.rosé {
    background: #f4a7b0;
  }
  .wine-dot.bubbles {
    background: #e8dcc8;
    border: 1px solid #c4b89a;
  }

  .wine-info {
    flex: 1;
    min-width: 0;
  }

  .wine-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .wine-person {
    color: var(--text-light);
    font-size: 0.9rem;
  }

  .wine-notes {
    color: var(--text-light);
    font-size: 0.85rem;
    font-style: italic;
    margin-top: 0.2rem;
  }

  .wine-name a {
    color: var(--wine);
    text-decoration: none;
    border-bottom: 1px dashed var(--wine-light);
    padding-bottom: 2px;
  }

  .wine-name a:hover {
    border-bottom-style: solid;
  }

  .wine-name:has(a) + .wine-person {
    margin-top: 8px;
  }

  .wine-actions {
    display: flex;
    gap: 0;
    flex-shrink: 0;
    opacity: 0.4;
    transition: opacity 0.2s;
  }

  .wine-card:hover .wine-actions {
    opacity: 1;
  }

  .wine-card.editing {
    border: 1.5px solid var(--wine-light);
  }
</style>
