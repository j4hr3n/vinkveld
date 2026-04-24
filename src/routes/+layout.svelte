<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { isAdminEnabled, onAdminChange } from "$lib/admin";
  import AdminAccess from "$lib/components/AdminAccess.svelte";
  import "../app.css";

  let { children }: { children: Snippet } = $props();
  let isAdmin = $state(false);

  onMount(() => {
    isAdmin = isAdminEnabled();
    return onAdminChange((active) => {
      isAdmin = active;
    });
  });
</script>

<div class="max-w-[620px] mx-auto px-5 pt-8 pb-20 relative">
  {@render children()}
  <AdminAccess active={isAdmin} />
</div>
