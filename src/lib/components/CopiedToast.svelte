<script lang="ts">
  let { visible = false }: { visible: boolean } = $props();
</script>

<div class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-wine-dark text-white py-[0.6rem] px-[1.2rem] rounded-lg text-[0.9rem] transition-opacity duration-300 pointer-events-none {visible ? 'opacity-100' : 'opacity-0'}">
  Lenke kopiert!
</div>
