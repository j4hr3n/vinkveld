<script lang="ts">
    import {
        setRegistration,
        type GrapeRegistration,
        type WineColor,
    } from "$lib/firebase";
    import { getGrapeById } from "$lib/grapes";
    import GrapeInfoCard from "./GrapeInfoCard.svelte";
    import WineSearchModal from "./WineSearchModal.svelte";
    import type { WineSuggestion } from "$lib/vivinoSearch";
    import { TYPE_MAP } from "$lib/vivinoSearch";
    import { normalizeSafeUrl } from "$lib/utils";

    let {
        nightId,
        pairId,
        grapeId,
        existingRegistration,
        pairNames,
        usePrivateData = false,
        onSaved,
    }: {
        nightId: string;
        pairId: string;
        grapeId: string;
        existingRegistration?: GrapeRegistration;
        pairNames: string[];
        usePrivateData?: boolean;
        onSaved?: () => void;
    } = $props();

    let grape = $derived(getGrapeById(grapeId));

    // Wine fields
    let wineName = $state("");
    let wineLink = $state("");
    let wineColor = $state<WineColor>("red");

    // Dish fields
    let dishName = $state("");
    let dishDescription = $state("");

    let saving = $state(false);
    let saved = $state(false);
    let error = $state("");
    let searchOpen = $state(false);
    let currentRegistration = $state<GrapeRegistration | undefined>();

    $effect(() => {
        if (existingRegistration === currentRegistration) return;

        wineName = existingRegistration?.wineName ?? "";
        wineLink = existingRegistration?.wineLink ?? "";
        wineColor = existingRegistration?.wineColor ?? "red";
        dishName = existingRegistration?.dishName ?? "";
        dishDescription = existingRegistration?.dishDescription ?? "";
        saved = false;
        error = "";
        currentRegistration = existingRegistration;
    });

    const colors: { value: WineColor; label: string; bg: string; border?: string }[] = [
        { value: "red", label: "Rød", bg: "#5c1a2a" },
        { value: "white", label: "Hvit", bg: "#e8dd8a", border: "#c8bc5a" },
        { value: "rosé", label: "Rosé", bg: "#e8909a" },
        { value: "bubbles", label: "Bobler", bg: "#d4c8a8", border: "#b8ac8a" },
    ];

    async function handleSubmit() {
        if (!wineName.trim() || !dishName.trim()) return;
        saving = true;
        error = "";
        try {
            const registration: GrapeRegistration = {
                wineName: wineName.trim(),
                wineColor,
                dishName: dishName.trim(),
                registered: new Date().toISOString(),
            };
            const safeWineLink = normalizeSafeUrl(wineLink);
            if (safeWineLink) registration.wineLink = safeWineLink;
            if (dishDescription.trim()) registration.dishDescription = dishDescription.trim();
            await setRegistration(nightId, pairId, registration, usePrivateData);
            saved = true;
            setTimeout(() => onSaved?.(), 1200);
        } catch (e) {
            error = "Kunne ikke lagre. Prøv igjen.";
        } finally {
            saving = false;
        }
    }

    function handleSearchSelect(s: WineSuggestion) {
        const parts = [s.winery, s.name, s.vintage].filter(Boolean);
        wineName = parts.join(" ");
        const color = s.typeId != null ? TYPE_MAP[s.typeId] : undefined;
        if (color) wineColor = color as WineColor;
    }
</script>

<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_24px_rgba(92,26,42,0.06)] border border-cream-dark/60">
    <!-- Header -->
    <div class="mb-5">
        <div class="flex items-center gap-2 mb-1">
            <svg class="w-4 h-4 text-wine/60" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 5l-4 4-4-4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 2v7" stroke-linecap="round"/>
                <rect x="3" y="11" width="10" height="3" rx="1"/>
            </svg>
            <h3 class="text-base font-semibold text-wine">Registrer vin og rett</h3>
        </div>
        <p class="text-[0.82rem] text-text-light">
            {pairNames.join(" & ")} — velg en vin og rett til drueaftenen
        </p>
    </div>

    <!-- Grape info -->
    {#if grape}
        <div class="mb-5">
            <GrapeInfoCard {grape} expanded={true} />
        </div>
    {/if}

    <!-- Wine section -->
    <div class="space-y-4 mb-6">
        <div class="flex items-center gap-3">
            <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider">Vin</div>
            <div class="flex-1 h-px bg-cream-dark"></div>
        </div>

        <div class="flex gap-2">
            <input
                type="text"
                placeholder="Navn på vin..."
                bind:value={wineName}
                class="flex-1 py-2.5 px-4 border-[1.5px] border-cream-dark rounded-xl text-sm font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300"
            />
            <button
                onclick={() => (searchOpen = true)}
                class="py-2.5 px-3 rounded-xl border-[1.5px] border-cream-dark bg-white/60 text-text-light cursor-pointer hover:border-wine-light hover:text-wine transition-all duration-200 font-[inherit]"
                aria-label="Søk etter vin"
            >
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="7" r="4"/>
                    <path d="M10 10l3 3" stroke-linecap="round"/>
                </svg>
            </button>
        </div>

        <input
            type="url"
            placeholder="Lenke (valgfritt)"
            bind:value={wineLink}
            class="w-full py-2.5 px-4 border-[1.5px] border-cream-dark rounded-xl text-sm font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300"
        />

        <!-- Color selector -->
        <div class="flex gap-2">
            {#each colors as c}
                <button
                    type="button"
                    onclick={() => (wineColor = c.value)}
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border-[1.5px] cursor-pointer transition-all duration-200 font-[inherit] text-[0.82rem] {wineColor === c.value
                        ? 'border-wine bg-wine/5 text-wine font-medium'
                        : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
                >
                    <span
                        class="w-2.5 h-2.5 rounded-full"
                        style="background: {c.bg}; {c.border ? `border: 1px solid ${c.border}` : ''}"
                    ></span>
                    {c.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Dish section -->
    <div class="space-y-4 mb-6">
        <div class="flex items-center gap-3">
            <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider">Rett</div>
            <div class="flex-1 h-px bg-cream-dark"></div>
        </div>

        <input
            type="text"
            placeholder="Navn på rett..."
            bind:value={dishName}
            class="w-full py-2.5 px-4 border-[1.5px] border-cream-dark rounded-xl text-sm font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300"
        />

        <textarea
            placeholder="Beskrivelse (valgfritt)"
            bind:value={dishDescription}
            rows={2}
            class="w-full py-2.5 px-4 border-[1.5px] border-cream-dark rounded-xl text-sm font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300 resize-y"
        ></textarea>
    </div>

    <!-- Feedback -->
    {#if error}
        <div class="py-2 px-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">
            {error}
        </div>
    {/if}

    {#if saved}
        <div class="py-3 px-4 rounded-xl bg-sage/10 border border-sage/30 text-sage text-sm font-medium flex items-center gap-2 animate-fade-in">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 8l4 4 6-7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Registrering lagret!
        </div>
    {/if}

    <!-- Submit -->
    <button
        onclick={handleSubmit}
        disabled={!wineName.trim() || !dishName.trim() || saving || saved}
        class="w-full py-3.5 px-6 rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 border-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed {saved
            ? 'bg-sage text-white'
            : 'bg-wine text-white hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)]'}"
    >
        {saving ? "Lagrer..." : saved ? "Lagret!" : existingRegistration ? "Oppdater registrering" : "Registrer vin og rett"}
    </button>
</div>

<WineSearchModal
    bind:open={searchOpen}
    onSelect={handleSearchSelect}
/>
