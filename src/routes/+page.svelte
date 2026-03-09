<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { createNight } from "$lib/firebase";

  let title = $state("");
  let date = $state(new Date().toISOString().split("T")[0]);
  let creating = $state(false);

  let titleInput = $state<HTMLInputElement | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      titleInput?.focus();
      return;
    }
    creating = true;
    const id = await createNight(title.trim(), date);
    goto(`${base}/${id}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleCreate();
  }
</script>

<svelte:head>
  <title>Vinkveld</title>
</svelte:head>

<div class="home">
  <h1>Vinkveld</h1>
  <p class="tagline">Planlegg vinkveldens lineup</p>
  <div class="create-form">
    <h2>Nytt vinkveld</h2>
    <div class="field">
      <label for="title">Tittel</label>
      <input
        type="text"
        id="title"
        placeholder="f.eks. Vinkveld hos Christoffer"
        bind:value={title}
        bind:this={titleInput}
        onkeydown={handleKeydown}
      />
    </div>
    <div class="field">
      <label for="date">Dato</label>
      <input type="date" id="date" bind:value={date} />
    </div>
    <button class="btn btn-primary" onclick={handleCreate} disabled={creating}>
      {creating ? "Oppretter..." : "Opprett vinkveld"}
    </button>
  </div>
</div>

<style>
  .home {
    text-align: center;
    padding-top: 4rem;
  }

  .home h1 {
    font-size: 3rem;
    color: var(--wine);
    margin-bottom: 0.25rem;
  }

  .tagline {
    color: var(--text-light);
    margin-bottom: 3rem;
    font-size: 1.1rem;
  }

  .create-form {
    background: white;
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    text-align: left;
  }

  .create-form h2 {
    font-size: 1.3rem;
    color: var(--wine);
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    .home h1 {
      font-size: 2.2rem;
    }
  }
</style>
