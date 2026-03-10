<script lang="ts">
  let { message = "", visible = false }: { message: string; visible: boolean } = $props();
</script>

{#if visible}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in"
  >
    <div class="bg-wine-dark text-white py-3 px-6 rounded-xl shadow-[0_8px_24px_rgba(61,15,26,0.4)] flex items-center gap-2.5 font-medium text-[0.9rem]">
      <svg class="w-4 h-4 text-red-300 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v3.5" stroke-linecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
      </svg>
      {message}
    </div>
  </div>
{/if}
