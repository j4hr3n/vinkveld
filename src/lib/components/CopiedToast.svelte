<script lang="ts">
  let { visible = false }: { visible: boolean } = $props();
</script>

{#if visible}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in"
  >
    <div class="bg-wine text-white py-3 px-6 rounded-xl shadow-[0_8px_24px_rgba(92,26,42,0.3)] flex items-center gap-2.5 font-medium text-[0.9rem]">
      <svg class="w-4 h-4 text-gold-light" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 8l4 4 6-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Lenke kopiert!
    </div>
  </div>
{/if}
