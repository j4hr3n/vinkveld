<script lang="ts">
  let { visible = false }: { visible: boolean } = $props();
</script>

<div class="copied-toast" class:show={visible}>Lenke kopiert!</div>

<style>
  .copied-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--wine-dark);
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .copied-toast.show {
    opacity: 1;
  }
</style>
