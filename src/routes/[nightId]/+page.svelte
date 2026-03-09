<script lang="ts">
    import { page } from "$app/state";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import {
        subscribeToNight,
        addWine,
        updateWine,
        removeWine,
        type WineNight,
        type Wine,
    } from "$lib/firebase";
    import WineCard from "$lib/components/WineCard.svelte";
    import WineForm from "$lib/components/WineForm.svelte";
    import CopiedToast from "$lib/components/CopiedToast.svelte";

    let nightId = $derived(page.params.nightId);
    let night = $state<WineNight | null | undefined>(undefined);
    let editingWineId = $state<string | null>(null);
    let toastVisible = $state(false);

    let formElement = $state<HTMLDivElement | null>(null);

    let wines = $derived.by(() => {
        if (!night?.wines) return [];
        const list = Object.entries(night.wines).map(([id, w]) => ({
            ...w,
            id,
        }));
        const colorOrder: Record<string, number> = {
            bubbles: 0,
            rosé: 1,
            white: 2,
            red: 3,
        };
        list.sort(
            (a, b) => (colorOrder[a.color] ?? 99) - (colorOrder[b.color] ?? 99),
        );
        return list;
    });

    let editingWine = $derived(
        editingWineId
            ? (wines.find((w) => w.id === editingWineId) ?? null)
            : null,
    );

    let shareUrl = $derived(
        typeof window !== "undefined" ? window.location.href : "",
    );

    onMount(() => {
        const unsubscribe = subscribeToNight(nightId, (data) => {
            night = data;
        });
        return unsubscribe;
    });

    function formatDate(dateStr: string): string {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("nb-NO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function copyLink() {
        navigator.clipboard.writeText(shareUrl);
        toastVisible = true;
        setTimeout(() => (toastVisible = false), 1500);
    }

    async function handleAdd(data: {
        name: string;
        person: string;
        color: Wine["color"];
        link: string;
        notes: string;
    }) {
        await addWine(nightId, data);
    }

    async function handleEdit(data: {
        name: string;
        person: string;
        color: Wine["color"];
        link: string;
        notes: string;
    }) {
        if (!editingWineId) return;
        const wineId = editingWineId;
        editingWineId = null;
        await updateWine(nightId, wineId, data);
    }

    function handleDelete(wineId: string) {
        if (editingWineId === wineId) editingWineId = null;
        removeWine(nightId, wineId);
    }

    function startEdit(wineId: string) {
        editingWineId = wineId;
        setTimeout(
            () => formElement?.scrollIntoView({ behavior: "smooth" }),
            0,
        );
    }
</script>

<svelte:head>
    <title>{night?.title ?? "Vinkveld"}</title>
</svelte:head>

{#if night === undefined}
    <div class="text-center p-16 text-text-light">
        <div
            class="inline-block w-6 h-6 border-[2.5px] border-cream-dark border-t-wine rounded-full animate-spin mb-2"
        ></div>
        <p>Laster vinkveld...</p>
    </div>
{:else if night === null}
    <div class="text-center pt-24">
        <h1 class="text-wine mb-2">Fant ikke vinkveldet</h1>
        <p>Kanskje lenken er feil?</p>
        <p><a href="{base}/" class="text-wine">Lag en ny vinkveld</a></p>
    </div>
{:else}
    <div>
        <div class="text-center mb-8 pt-8">
            <h1 class="text-[2.2rem] max-[480px]:text-[1.8rem] text-wine mb-1">
                {night.title}
            </h1>
            <div class="text-text-light text-[1.05rem]">
                {formatDate(night.date)}
            </div>
            <div
                class="flex gap-2 items-center justify-center mt-4 max-[480px]:flex-col"
            >
                <input
                    type="text"
                    value={shareUrl}
                    readonly
                    class="flex-1 max-w-80 max-[480px]:max-w-full py-2 px-3 border-[1.5px] border-cream-dark rounded-lg text-[0.85rem] bg-white text-text-light font-mono"
                />
                <button
                    class="inline-flex items-center gap-2 py-1.5 px-3 border-[1.5px] border-wine-light rounded-lg text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 bg-transparent text-wine hover:bg-wine hover:text-white"
                    onclick={copyLink}
                >
                    Kopier lenke
                </button>
            </div>
        </div>

        {#if wines.length === 0}
            <div class="text-center py-12 px-4 text-text-light">
                <div class="text-5xl mb-2">🍷</div>
                <p>Ingen viner ennå — legg til den første!</p>
            </div>
        {:else}
            <div class="flex flex-col gap-3 mb-8">
                {#each wines as wine (wine.id)}
                    <WineCard
                        {wine}
                        isEditing={editingWineId === wine.id}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                    />
                {/each}
            </div>
        {/if}

        <div bind:this={formElement}>
            {#key editingWineId}
                <WineForm
                    editing={editingWine}
                    onSubmit={editingWine ? handleEdit : handleAdd}
                    onCancel={() => (editingWineId = null)}
                />
            {/key}
        </div>
    </div>

    <CopiedToast visible={toastVisible} />
{/if}
