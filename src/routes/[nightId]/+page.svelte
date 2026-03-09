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
    let copied = $state(false);

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
        const id = nightId;
        if (!id) return;
        const unsubscribe = subscribeToNight(id, (data) => {
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
        copied = true;
        toastVisible = true;
        setTimeout(() => {
            toastVisible = false;
            copied = false;
        }, 1500);
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
    <!-- Loading state: wine glass fill animation -->
    <div class="text-center pt-24 animate-fade-in">
        <div class="inline-block relative w-12 h-16 mb-4">
            <svg viewBox="0 0 48 64" fill="none" class="w-full h-full">
                <path d="M14 4h20l-2 24c-.5 6-4 10-8 10s-7.5-4-8-10L14 4z" stroke="#5c1a2a" stroke-width="1.5" fill="none" opacity="0.2"/>
                <clipPath id="glass-clip">
                    <path d="M14 4h20l-2 24c-.5 6-4 10-8 10s-7.5-4-8-10L14 4z"/>
                </clipPath>
                <rect x="12" y="4" width="24" height="34" fill="#5c1a2a" opacity="0.15" clip-path="url(#glass-clip)">
                    <animate attributeName="y" values="38;4" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                <line x1="24" y1="38" x2="24" y2="52" stroke="#5c1a2a" stroke-width="1.5" opacity="0.2"/>
                <line x1="18" y1="52" x2="30" y2="52" stroke="#5c1a2a" stroke-width="1.5" opacity="0.2" stroke-linecap="round"/>
            </svg>
        </div>
        <p class="text-text-light font-accent italic text-lg">Laster vinkveld...</p>
    </div>
{:else if night === null}
    <div class="text-center pt-20 animate-fade-in">
        <div class="text-5xl mb-4 opacity-60">🍷</div>
        <h1 class="text-wine text-2xl mb-3">Fant ikke vinkveldet</h1>
        <p class="text-text-light mb-4 font-accent italic text-lg">Kanskje lenken er feil?</p>
        <a
            href="{base}/"
            class="inline-flex items-center gap-2 text-wine font-medium no-underline border-b border-dashed border-wine-light pb-0.5 hover:border-solid transition-all duration-200"
        >
            Lag en ny vinkveld
        </a>
    </div>
{:else}
    <div>
        <!-- Back link -->
        <a
            href="{base}/"
            class="inline-flex items-center gap-1.5 text-text-light text-[0.82rem] no-underline hover:text-wine transition-colors duration-200 mb-4 animate-fade-in"
        >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Ny vinkveld
        </a>

        <!-- Header -->
        <div class="text-center mb-10 pt-4 animate-slide-down">
            <h1 class="text-[2.4rem] max-[480px]:text-[1.9rem] text-wine mb-1 tracking-tight font-bold leading-tight">
                {night.title}
            </h1>
            <div class="font-accent italic text-text-light text-lg mt-1">
                {formatDate(night.date)}
            </div>
        </div>

        <!-- Share section -->
        <div class="relative bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-cream-dark/50 mb-10 animate-rise-in" style="animation-delay:0.1s">
            <div class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider mb-3">Del med venner</div>
            <div class="flex gap-2.5 items-center max-[480px]:flex-col">
                <input
                    type="text"
                    value={shareUrl}
                    readonly
                    class="flex-1 max-[480px]:w-full py-2.5 px-3.5 border-[1.5px] border-cream-dark rounded-xl text-[0.82rem] bg-cream/60 text-text-light font-mono truncate"
                />
                <button
                    class="max-[480px]:w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 border-[1.5px] rounded-xl text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-300 {copied ? 'border-sage bg-sage/10 text-sage' : 'border-wine/30 bg-transparent text-wine hover:bg-wine hover:text-white hover:border-wine'}"
                    onclick={copyLink}
                >
                    {#if copied}
                        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 8l4 4 6-7" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Kopiert!
                    {:else}
                        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="5" y="5" width="8" height="8" rx="1.5"/>
                            <path d="M3 11V3h8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Kopier lenke
                    {/if}
                </button>
            </div>
        </div>

        <!-- Wine list -->
        {#if wines.length === 0}
            <div class="text-center py-16 px-4 animate-rise-in" style="animation-delay:0.2s">
                <!-- CSS wine glass illustration -->
                <div class="inline-block relative mb-6">
                    <svg viewBox="0 0 80 100" class="w-20 h-24 mx-auto" fill="none">
                        <path d="M24 8h32l-3 36c-.8 8-6 14-13 14s-12.2-6-13-14L24 8z" stroke="#5c1a2a" stroke-width="1.2" opacity="0.15"/>
                        <path d="M30 20h20l-1.5 18c-.5 5-3.5 9-8.5 9s-8-4-8.5-9L30 20z" fill="#5c1a2a" opacity="0.05"/>
                        <line x1="40" y1="58" x2="40" y2="78" stroke="#5c1a2a" stroke-width="1.2" opacity="0.15"/>
                        <line x1="30" y1="78" x2="50" y2="78" stroke="#5c1a2a" stroke-width="1.2" opacity="0.15" stroke-linecap="round"/>
                        <!-- Decorative drops -->
                        <circle cx="35" cy="34" r="1.5" fill="#5c1a2a" opacity="0.08"/>
                        <circle cx="42" cy="30" r="1" fill="#5c1a2a" opacity="0.06"/>
                        <circle cx="38" cy="38" r="1.2" fill="#5c1a2a" opacity="0.07"/>
                    </svg>
                </div>
                <p class="font-accent italic text-text-light text-lg">Ingen viner ennå</p>
                <p class="text-text-light text-[0.85rem] mt-1 opacity-70">Legg til den første nedenfor</p>
            </div>
        {:else}
            <!-- Section label -->
            <div class="flex items-center gap-3 mb-5 animate-fade-in" style="animation-delay:0.15s">
                <div class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                    {wines.length} {wines.length === 1 ? "vin" : "viner"}
                </div>
                <div class="flex-1 h-px bg-cream-dark"></div>
            </div>

            <div class="flex flex-col gap-3 mb-10">
                {#each wines as wine, i (wine.id)}
                    <WineCard
                        {wine}
                        isEditing={editingWineId === wine.id}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        index={i}
                    />
                {/each}
            </div>
        {/if}

        <!-- Divider -->
        <div class="flex items-center justify-center gap-3 mb-8 animate-fade-in" style="animation-delay:0.25s">
            <div class="flex-1 h-px bg-cream-dark"></div>
            <span class="text-cream-dark text-lg">🍇</span>
            <div class="flex-1 h-px bg-cream-dark"></div>
        </div>

        <!-- Form -->
        <div bind:this={formElement} class="animate-rise-in" style="animation-delay:0.3s">
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
