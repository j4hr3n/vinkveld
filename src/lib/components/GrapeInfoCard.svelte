<script lang="ts">
    import type { Grape } from "$lib/grapes";

    let { grape, expanded = false }: { grape: Grape; expanded?: boolean } = $props();

    let open = $state(false);

    $effect(() => {
        open = expanded;
    });
</script>

<div class="rounded-xl border border-cream-dark/60 bg-white/80 overflow-hidden transition-all duration-300">
    <button
        onclick={() => (open = !open)}
        class="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer font-[inherit] text-left transition-colors duration-200 hover:bg-cream/40"
    >
        <span
            class="w-3 h-3 rounded-full shrink-0"
            style="background: {grape.color === 'red' ? '#5c1a2a' : '#e8dd8a'}; {grape.color === 'white' ? 'border: 1px solid #c8bc5a' : ''}"
        ></span>
        <span class="font-semibold text-wine text-sm flex-1">{grape.name}</span>
        <svg
            class="w-3.5 h-3.5 text-text-light shrink-0 transition-transform duration-300 {open ? 'rotate-180' : ''}"
            viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
        >
            <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>

    <div class="grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] {open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
        <div class="overflow-hidden">
            <div class="px-4 pb-4 pt-1 space-y-3 text-sm">
                <p class="text-text leading-relaxed">{grape.description}</p>

                <div>
                    <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider mb-1.5">Smaksprofil</div>
                    <div class="flex flex-wrap gap-1.5">
                        {#each grape.flavorProfile as flavor}
                            <span class="px-2 py-0.5 rounded-full bg-wine/5 text-wine/80 text-[0.75rem] font-medium">{flavor}</span>
                        {/each}
                    </div>
                </div>

                <div>
                    <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider mb-1.5">Passer til</div>
                    <div class="flex flex-wrap gap-1.5">
                        {#each grape.foodPairings as pairing}
                            <span class="px-2 py-0.5 rounded-full bg-gold/10 text-text text-[0.75rem] font-medium">{pairing}</span>
                        {/each}
                    </div>
                </div>

                <div>
                    <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider mb-1.5">Kjente regioner</div>
                    <p class="text-text-light text-[0.82rem]">{grape.regions.join(" \u00b7 ")}</p>
                </div>
            </div>
        </div>
    </div>
</div>
