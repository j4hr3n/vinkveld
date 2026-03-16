<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { createNight } from "$lib/firebase";
    import { getHistory, removeFromHistory, type HistoryEntry } from "$lib/history";
    import { formatDate } from "$lib/utils";

    let title = $state("");
    let date = $state(new Date().toISOString().split("T")[0]);
    let creating = $state(false);
    let history = $state(getHistory());

    let titleInput = $state<HTMLInputElement | null>(null);

    const today = new Date().toISOString().split("T")[0];

    let upcoming = $derived(
        history
            .filter((e) => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
    );

    let past = $derived(
        history
            .filter((e) => e.date < today)
            .sort((a, b) => b.date.localeCompare(a.date))
    );

    async function handleCreate() {
        if (!title.trim()) {
            titleInput?.focus();
            return;
        }
        creating = true;
        const id = await createNight(title.trim(), date);
        goto(`${base}/${id}`);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handleCreate();
    }

    function handleRemoveHistory(nightId: string) {
        removeFromHistory(nightId);
        history = getHistory();
    }

</script>

<svelte:head>
    <title>Vinkveld</title>
</svelte:head>

<div class="text-center pt-12 animate-slide-down">
    <div class="text-6xl mb-5">🍷</div>
    <h1 class="text-5xl max-[480px]:text-[2.4rem] text-wine mb-2 tracking-tight font-bold">
        Vinkveld
    </h1>
    <p class="font-accent italic text-text-light text-xl mb-14 tracking-wide">
        Planlegg vinkveldens lineup
    </p>
</div>

<div
    class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-[480px]:p-6 shadow-[0_4px_24px_rgba(92,26,42,0.06)] border border-cream-dark/60 text-left animate-rise-in"
    style="animation-delay: 0.15s"
>
    <h2 class="text-xl text-wine mb-6 font-semibold">Ny vinkveld</h2>

    <div class="mb-5">
        <label
            for="title"
            class="block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider"
            >Tittel</label
        >
        <input
            type="text"
            id="title"
            placeholder="f.eks. Vinkveld hos Christoffer"
            bind:value={title}
            bind:this={titleInput}
            onkeydown={handleKeydown}
            class="w-full py-3 px-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]"
        />
    </div>
    <div class="mb-7">
        <label
            for="date"
            class="block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider"
            >Dato</label
        >
        <input
            type="date"
            id="date"
            bind:value={date}
            class="w-full py-3 px-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]"
        />
    </div>
    <button
        class="w-full py-3.5 px-6 border-none rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-wine text-white hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        onclick={handleCreate}
        disabled={creating}
    >
        {creating ? "Oppretter..." : "Opprett vinkveld"}
    </button>
</div>

{#snippet historyGroup(entries: HistoryEntry[], label: string, offset: number, isUpcoming: boolean)}
    {#if entries.length > 0}
        <div class="mt-10 animate-rise-in" style="animation-delay: {offset}s">
            <div class="flex items-center gap-3 mb-4">
                {#if isUpcoming}
                    <span class="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-wine-light uppercase tracking-wider">
                        <svg class="w-3 h-3 opacity-70" viewBox="0 0 12 12" fill="currentColor">
                            <circle cx="6" cy="6" r="3"/>
                        </svg>
                        {label}
                    </span>
                {:else}
                    <h2 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">{label}</h2>
                {/if}
                <div class="flex-1 h-px {isUpcoming ? 'bg-wine-light/30' : 'bg-cream-dark'}"></div>
            </div>

            <div class="flex flex-col gap-2.5">
                {#each entries as entry, i}
                    <div
                        class="relative group/hist animate-rise-in"
                        style="animation-delay: {offset + 0.05 + i * 0.05}s"
                    >
                        <a
                            href="{base}/{entry.nightId}"
                            class="block backdrop-blur-sm rounded-xl p-4 pr-10 no-underline transition-all duration-200
                                {isUpcoming
                                    ? 'bg-wine/[0.04] border border-wine-light/30 shadow-[0_2px_12px_rgba(92,26,42,0.06)] hover:shadow-[0_4px_16px_rgba(92,26,42,0.14)] hover:border-wine-light/60 hover:bg-wine/[0.07]'
                                    : 'bg-white/80 border border-cream-dark/60 shadow-[0_2px_12px_rgba(92,26,42,0.04)] hover:shadow-[0_4px_16px_rgba(92,26,42,0.1)] hover:border-wine-light/40'}"
                        >
                            <div class="text-wine font-semibold text-base">
                                {entry.title}
                            </div>
                            <div class="font-accent italic text-sm mt-0.5 {isUpcoming ? 'text-wine-light/70' : 'text-text-light'}">
                                {formatDate(entry.date)}
                            </div>
                        </a>
                        <button
                            onclick={() => handleRemoveHistory(entry.nightId)}
                            aria-label="Fjern fra historikk"
                            class="absolute top-2.5 right-2.5 p-1.5 rounded-lg border-none bg-transparent text-text-light cursor-pointer opacity-0 group-hover/hist:opacity-100 max-[480px]:opacity-100 transition-all duration-200 hover:bg-wine/8 hover:text-wine"
                        >
                            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

{@render historyGroup(upcoming, "Kommende vinkvelder", 0.3, true)}
{@render historyGroup(past, "Tidligere vinkvelder", upcoming.length > 0 ? 0.3 + upcoming.length * 0.05 + 0.1 : 0.3, false)}
