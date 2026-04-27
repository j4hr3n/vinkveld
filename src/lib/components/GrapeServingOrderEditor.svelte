<script lang="ts">
    import {
        setGrapeServingOrder,
        type GrapePair,
    } from "$lib/firebase";
    import { getGrapeById } from "$lib/grapes";
    import {
        getInitials,
        getAvatarColor,
        sortByGrapeServingOrder,
    } from "$lib/utils";

    type PairWithId = GrapePair & { id: string };

    let {
        nightId,
        pairs,
        assignments,
        servingOrder,
    }: {
        nightId: string;
        pairs: PairWithId[];
        assignments: Record<string, string>;
        servingOrder: Record<string, number> | undefined;
    } = $props();

    let saving = $state(false);
    let confirmReset = $state(false);

    let orderedPairs = $derived(
        sortByGrapeServingOrder(pairs, servingOrder),
    );

    function buildOrderMap(list: PairWithId[]): Record<string, number> {
        const out: Record<string, number> = {};
        list.forEach((p, i) => {
            out[p.id] = i + 1;
        });
        return out;
    }

    async function move(index: number, delta: number) {
        const next = [...orderedPairs];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        saving = true;
        try {
            await setGrapeServingOrder(nightId, buildOrderMap(next));
        } finally {
            saving = false;
        }
    }

    async function reset() {
        saving = true;
        try {
            await setGrapeServingOrder(nightId, null);
            confirmReset = false;
        } finally {
            saving = false;
        }
    }

    let hasOrder = $derived(
        servingOrder != null && Object.keys(servingOrder).length > 0,
    );
</script>

{#if pairs.length > 0}
    <div class="animate-fade-in" style="animation-delay:0.05s">
        <div class="flex items-center gap-3 mb-3">
            <h3 class="text-[0.78rem] font-medium text-text-light uppercase tracking-wider">
                Serveringsorden
            </h3>
            <div class="flex-1 h-px bg-cream-dark"></div>
            {#if hasOrder}
                {#if confirmReset}
                    <div class="flex items-center gap-1.5">
                        <button
                            type="button"
                            onclick={reset}
                            disabled={saving}
                            class="text-[0.72rem] font-medium text-wine cursor-pointer border-none bg-transparent font-[inherit] hover:underline disabled:opacity-60"
                        >
                            Nullstill
                        </button>
                        <span class="text-[0.72rem] text-text-light/40">·</span>
                        <button
                            type="button"
                            onclick={() => (confirmReset = false)}
                            class="text-[0.72rem] text-text-light cursor-pointer border-none bg-transparent font-[inherit] hover:text-text"
                        >
                            Avbryt
                        </button>
                    </div>
                {:else}
                    <button
                        type="button"
                        onclick={() => (confirmReset = true)}
                        class="text-[0.72rem] text-text-light/60 cursor-pointer border-none bg-transparent font-[inherit] hover:text-wine transition-colors duration-200"
                    >
                        Nullstill rekkefølge
                    </button>
                {/if}
            {/if}
        </div>

        <p class="text-[0.78rem] text-text-light/70 leading-relaxed mb-3 font-accent italic">
            Sett rekkefølgen vinene serveres i. Brukes på programsiden.
        </p>

        <ul class="flex flex-col gap-2">
            {#each orderedPairs as pair, i (pair.id)}
                {@const grape = getGrapeById(assignments[pair.id])}
                <li
                    class="flex items-center gap-3 py-2.5 pr-2 pl-3 rounded-xl bg-white/60 border border-cream-dark/60"
                >
                    <!-- Order badge -->
                    <div
                        class="w-7 h-7 rounded-full bg-wine text-white flex items-center justify-center text-[0.78rem] font-semibold tracking-tight shrink-0"
                    >
                        {i + 1}
                    </div>

                    <!-- Pair members + grape -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            {#each pair.memberNames as name, mi}
                                <div class="flex items-center gap-1">
                                    <div
                                        class="w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold tracking-wide text-white/90 shrink-0"
                                        style="background: {getAvatarColor(name)}"
                                    >
                                        {getInitials(name)}
                                    </div>
                                    <span class="text-[0.82rem] font-medium text-text">
                                        {name}
                                    </span>
                                </div>
                                {#if mi < pair.memberNames.length - 1}
                                    <span class="text-text-light/40 text-[0.7rem]">&</span>
                                {/if}
                            {/each}
                        </div>
                        {#if grape}
                            <div class="text-[0.7rem] text-text-light/70 mt-0.5 truncate">
                                {grape.name}
                            </div>
                        {/if}
                    </div>

                    <!-- Up / down -->
                    <div class="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onclick={() => move(i, -1)}
                            disabled={i === 0 || saving}
                            aria-label="Flytt opp"
                            class="w-9 h-9 rounded-lg flex items-center justify-center bg-transparent border border-cream-dark/60 text-text-light cursor-pointer transition-all duration-200 hover:border-wine-light hover:text-wine hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-cream-dark/60 disabled:hover:text-text-light disabled:hover:bg-transparent"
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                            >
                                <path
                                    d="M4 10l4-4 4 4"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onclick={() => move(i, 1)}
                            disabled={i === orderedPairs.length - 1 || saving}
                            aria-label="Flytt ned"
                            class="w-9 h-9 rounded-lg flex items-center justify-center bg-transparent border border-cream-dark/60 text-text-light cursor-pointer transition-all duration-200 hover:border-wine-light hover:text-wine hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-cream-dark/60 disabled:hover:text-text-light disabled:hover:bg-transparent"
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                            >
                                <path
                                    d="M4 6l4 4 4-4"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
{/if}
