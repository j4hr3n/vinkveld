<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div id="app">
  {@render children()}
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(:root) {
    --wine: #722f37;
    --wine-light: #a4434d;
    --wine-dark: #4a1e24;
    --cream: #faf6f1;
    --cream-dark: #f0e8de;
    --text: #2c2c2c;
    --text-light: #666;
    --gold: #c4a35a;
    --radius: 12px;
  }

  :global(body) {
    font-family: "Inter", system-ui, sans-serif;
    background: var(--cream);
    color: var(--text);
    min-height: 100vh;
  }

  :global(h1, h2, h3) {
    font-family: "Playfair Display", Georgia, serif;
  }

  #app {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
  }

  :global(.field) {
    margin-bottom: 1.25rem;
  }

  :global(.field label) {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-light);
    margin-bottom: 0.4rem;
  }

  :global(.field input) {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border: 1.5px solid var(--cream-dark);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
    background: var(--cream);
  }

  :global(.field input:focus) {
    outline: none;
    border-color: var(--wine-light);
  }

  :global(.btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  :global(.btn-primary) {
    background: var(--wine);
    color: white;
    width: 100%;
    justify-content: center;
  }

  :global(.btn-primary:hover) {
    background: var(--wine-dark);
  }

  :global(.btn-small) {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  :global(.btn-outline) {
    background: transparent;
    border: 1.5px solid var(--wine-light);
    color: var(--wine);
  }

  :global(.btn-outline:hover) {
    background: var(--wine);
    color: white;
  }

  :global(.btn-ghost) {
    background: transparent;
    color: var(--wine-light);
    padding: 0.3rem 0.6rem;
  }

  :global(.btn-ghost:hover) {
    background: rgba(114, 47, 55, 0.08);
  }
</style>
