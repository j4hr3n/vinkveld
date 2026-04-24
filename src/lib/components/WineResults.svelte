<script lang="ts">
    import { getWineRatingEntries, type Wine } from "$lib/firebase";

    let { wines }: { wines: (Wine & { id: string })[] } = $props();

    let ranked = $derived.by(() => {
        return wines
            .map((w) => {
                const entries = getWineRatingEntries(w.ratings);
                const avg = entries.length
                    ? Math.round(entries.reduce((sum, rating) => sum + rating.score, 0) / entries.length)
                    : null;
                return { ...w, avg, ratingCount: entries.length };
            })
            .sort((a, b) => {
                if (a.avg === null && b.avg === null) return 0;
                if (a.avg === null) return 1;
                if (b.avg === null) return -1;
                return b.avg - a.avg;
            });
    });

    let allUnrated = $derived(ranked.every((w) => w.avg === null));
</script>

<!-- Section divider header -->
<div class="flex items-center gap-3 mb-4 mt-2 animate-fade-in">
    <div class="text-[0.78rem] font-medium text-text-light uppercase tracking-wider">
        Resultater
    </div>
    <div class="flex-1 h-px bg-cream-dark"></div>
</div>

{#if allUnrated}
    <p class="text-center font-accent italic text-text-light text-base py-4 animate-fade-in">
        Ingen rangeringer ble registrert
    </p>
{:else}
    <div class="flex flex-col gap-2.5 mb-8 animate-fade-in">
        {#each ranked as wine, i}
            {@const isFirst = wine.avg !== null && wine.avg === ranked[0].avg}
            {@const isSecondOrThird = !isFirst && wine.avg !== null && i < 3}
            {@const rank = wine.avg !== null ? ranked.filter((w, j) => j < i && w.avg !== null && w.avg > wine.avg!).length + 1 : null}

            {#if isFirst}
                <!-- Gold winner card -->
                <div class="bg-white/90 ring-2 ring-gold/40 rounded-2xl p-5 shadow-[0_2px_16px_rgba(92,26,42,0.08)] animate-rise-in" style="animation-delay: {i * 0.06}s">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                            <span class="text-gold font-bold text-sm">{rank}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-serif text-wine font-bold text-base truncate">{wine.name}</div>
                            <div class="text-text-light text-[0.78rem] mt-0.5">{wine.person}</div>
                        </div>
                        <div class="text-gold font-bold text-2xl shrink-0">{wine.avg}</div>
                    </div>
                </div>
            {:else if isSecondOrThird}
                <!-- Silver/bronze card -->
                <div class="bg-white/70 rounded-xl p-4 shadow-[0_1px_8px_rgba(92,26,42,0.05)] border border-cream-dark/60 animate-rise-in" style="animation-delay: {i * 0.06}s">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-cream-dark/40 flex items-center justify-center shrink-0">
                            <span class="text-text-light font-semibold text-xs">{rank}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-wine font-semibold text-sm truncate">{wine.name}</div>
                            <div class="text-text-light text-[0.75rem] mt-0.5">{wine.person}</div>
                        </div>
                        <div class="text-wine font-semibold text-lg shrink-0">{wine.avg}</div>
                    </div>
                </div>
            {:else if wine.avg !== null}
                <!-- Rest: compact row -->
                <div class="flex items-center gap-3 px-3 py-2.5 bg-white/50 rounded-lg animate-rise-in" style="animation-delay: {i * 0.06}s">
                    <span class="text-text-light text-xs w-5 text-center shrink-0">{rank}</span>
                    <div class="flex-1 min-w-0">
                        <span class="text-wine text-sm truncate block">{wine.name}</span>
                    </div>
                    <span class="text-text-light text-sm font-medium shrink-0">{wine.avg}</span>
                </div>
            {:else}
                <!-- Unrated -->
                <div class="flex items-center gap-3 px-3 py-2.5 animate-rise-in opacity-60" style="animation-delay: {i * 0.06}s">
                    <span class="text-text-light text-xs w-5 text-center shrink-0">—</span>
                    <div class="flex-1 min-w-0">
                        <span class="text-text-light text-sm italic truncate block">{wine.name}</span>
                    </div>
                    <span class="text-text-light text-xs italic shrink-0">Ingen rangering</span>
                </div>
            {/if}
        {/each}
    </div>
{/if}
