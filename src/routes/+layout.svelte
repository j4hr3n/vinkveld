<script lang="ts">
  import type { Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();
</script>

<div class="max-w-[640px] mx-auto px-4 pt-8 pb-16">
  {@render children()}
</div>
