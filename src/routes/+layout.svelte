<script lang="ts">
  import type { Snippet } from "svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();
</script>

<div class="max-w-[620px] mx-auto px-5 pt-8 pb-20 relative">
  {@render children()}
</div>
