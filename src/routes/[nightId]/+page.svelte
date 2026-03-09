<script lang="ts">
  import { page } from "$app/state";
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import { subscribeToNight, addWine, updateWine, removeWine, type WineNight, type Wine } from "$lib/firebase";
  import WineCard from "$lib/components/WineCard.svelte";
  import WineForm from "$lib/components/WineForm.svelte";
  import CopiedToast from "$lib/components/CopiedToast.svelte";

  let nightId = $derived(page.params.nightId);
  let night = $state<WineNight | null | undefined>(undefined);
  let editingWineId = $state<string | null>(null);
  let toastVisible = $state(false);

  let formElement = $state<HTMLDivElement | null>(null);

  let wines = $derived.by(() => {
    if (!night?.wines) return [];
    const list = Object.entries(night.wines).map(([id, w]) => ({ ...w, id }));
    const colorOrder: Record<string, number> = { bubbles: 0, rosé: 1, white: 2, red: 3 };
    list.sort((a, b) => (colorOrder[a.color] ?? 99) - (colorOrder[b.color] ?? 99));
    return list;
  });

  let editingWine = $derived(editingWineId ? wines.find((w) => w.id === editingWineId) ?? null : null);

  let shareUrl = $derived(typeof window !== "undefined" ? window.location.href : "");

  onMount(() => {
    const unsubscribe = subscribeToNight(nightId, (data) => {
      night = data;
    });
    return unsubscribe;
  });

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    toastVisible = true;
    setTimeout(() => (toastVisible = false), 1500);
  }

  async function handleAdd(data: { name: string; person: string; color: Wine["color"]; link: string; notes: string }) {
    await addWine(nightId, data);
  }

  async function handleEdit(data: { name: string; person: string; color: Wine["color"]; link: string; notes: string }) {
    if (!editingWineId) return;
    const wineId = editingWineId;
    editingWineId = null;
    await updateWine(nightId, wineId, data);
  }

  function handleDelete(wineId: string) {
    if (editingWineId === wineId) editingWineId = null;
    removeWine(nightId, wineId);
  }

  function startEdit(wineId: string) {
    editingWineId = wineId;
    // Scroll to form after state updates
    setTimeout(() => formElement?.scrollIntoView({ behavior: "smooth" }), 0);
  }
</script>

<svelte:head>
  <title>{night?.title ?? "Vinkveld"}</title>
</svelte:head>

{#if night === undefined}
  <div class="loading">
    <div class="spinner"></div>
    <p>Laster vinkveld...</p>
  </div>
{:else if night === null}
  <div class="error-page">
    <h1>Fant ikke vinkveldet</h1>
    <p>Kanskje lenken er feil?</p>
    <p><a href="{base}/">Lag et nytt vinkveld</a></p>
  </div>
{:else}
  <div class="night-page">
    <div class="night-header">
      <h1>{night.title}</h1>
      <div class="date">{formatDate(night.date)}</div>
      <div class="share-bar">
        <input type="text" value={shareUrl} readonly />
        <button class="btn btn-outline btn-small" onclick={copyLink}>Kopier lenke</button>
      </div>
    </div>

    {#if wines.length === 0}
      <div class="empty-state">
        <div class="icon">🍷</div>
        <p>Ingen viner ennå — legg til den første!</p>
      </div>
    {:else}
      <div class="wine-list">
        {#each wines as wine (wine.id)}
          <WineCard
            {wine}
            isEditing={editingWineId === wine.id}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        {/each}
      </div>
    {/if}

    <div bind:this={formElement}>
      {#key editingWineId}
        <WineForm
          editing={editingWine}
          onSubmit={editingWine ? handleEdit : handleAdd}
          onCancel={() => (editingWineId = null)}
        />
      {/key}
    </div>
  </div>

  <CopiedToast visible={toastVisible} />
{/if}

<style>
  .night-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-top: 2rem;
  }

  .night-header h1 {
    font-size: 2.2rem;
    color: var(--wine);
    margin-bottom: 0.3rem;
  }

  .date {
    color: var(--text-light);
    font-size: 1.05rem;
  }

  .share-bar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
  }

  .share-bar input {
    flex: 1;
    max-width: 320px;
    padding: 0.5rem 0.75rem;
    border: 1.5px solid var(--cream-dark);
    border-radius: 8px;
    font-size: 0.85rem;
    background: white;
    color: var(--text-light);
    font-family: monospace;
  }

  .wine-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-light);
  }

  .empty-state .icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    font-size: 1rem;
  }

  .error-page {
    text-align: center;
    padding-top: 6rem;
  }

  .error-page h1 {
    color: var(--wine);
    margin-bottom: 0.5rem;
  }

  .error-page a {
    color: var(--wine);
  }

  .loading {
    text-align: center;
    padding: 4rem;
    color: var(--text-light);
  }

  .spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--cream-dark);
    border-top-color: var(--wine);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-bottom: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .night-header h1 {
      font-size: 1.8rem;
    }
    .share-bar {
      flex-direction: column;
    }
    .share-bar input {
      max-width: 100%;
    }
  }
</style>
