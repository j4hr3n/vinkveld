<script lang="ts">
    import {
        setRegistration,
        uploadDishImage,
        type GrapeRegistration,
        type WineColor,
    } from "$lib/firebase";
    import { getGrapeById } from "$lib/grapes";
    import GrapeInfoCard from "./GrapeInfoCard.svelte";
    import WineSearchModal from "./WineSearchModal.svelte";
    import type { WineSuggestion } from "$lib/vivinoSearch";
    import { TYPE_MAP } from "$lib/vivinoSearch";

    let {
        nightId,
        pairId,
        grapeId,
        existingRegistration,
        pairNames,
    }: {
        nightId: string;
        pairId: string;
        grapeId: string;
        existingRegistration?: GrapeRegistration;
        pairNames: string[];
    } = $props();

    let grape = $derived(getGrapeById(grapeId));

    // Wine fields
    let wineName = $state(existingRegistration?.wineName ?? "");
    let wineLink = $state(existingRegistration?.wineLink ?? "");
    let wineColor = $state<WineColor>(existingRegistration?.wineColor ?? "red");

    // Dish fields
    let dishName = $state(existingRegistration?.dishName ?? "");
    let dishDescription = $state(existingRegistration?.dishDescription ?? "");
    let dishImageUrl = $state(existingRegistration?.dishImageUrl ?? "");

    let saving = $state(false);
    let uploading = $state(false);
    let searchOpen = $state(false);
    let imagePreview = $state(existingRegistration?.dishImageUrl ?? "");

    let fileInput = $state<HTMLInputElement | null>(null);

    const colors: { value: WineColor; label: string; bg: string; border?: string }[] = [
        { value: "red", label: "Rød", bg: "#5c1a2a" },
        { value: "white", label: "Hvit", bg: "#e8dd8a", border: "#c8bc5a" },
        { value: "rosé", label: "Rosé", bg: "#e8909a" },
        { value: "bubbles", label: "Bobler", bg: "#d4c8a8", border: "#b8ac8a" },
    ];

    async function handleImageSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("Bildet er for stort (maks 5 MB)");
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("Kun bildefiler er tillatt");
            return;
        }

        // Preview
        imagePreview = URL.createObjectURL(file);

        // Upload
        uploading = true;
        try {
            dishImageUrl = await uploadDishImage(nightId, pairId, file);
        } catch (err) {
            console.error("Image upload failed:", err);
            dishImageUrl = "";
        } finally {
            uploading = false;
        }
    }

    function removeImage() {
        dishImageUrl = "";
        imagePreview = "";
        if (fileInput) fileInput.value = "";
    }

    async function handleSubmit() {
        if (!wineName.trim() || !dishName.trim()) return;
        saving = true;
        try {
            const registration: GrapeRegistration = {
                wineName: wineName.trim(),
                wineLink: wineLink.trim() || undefined,
                wineColor,
                dishName: dishName.trim(),
                dishDescription: dishDescription.trim() || undefined,
                dishImageUrl: dishImageUrl || undefined,
                registered: new Date().toISOString(),
            };
            await setRegistration(nightId, pairId, registration);
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
            {pairNames.join(" & ")} — velg en vin og rett til druekveldet
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

        <!-- Image upload -->
        <div>
            {#if imagePreview}
                <div class="relative inline-block">
                    <img
                        src={imagePreview}
                        alt="Forhåndsvisning"
                        class="rounded-lg max-h-40 object-cover"
                    />
                    {#if uploading}
                        <div class="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-medium">Laster opp...</span>
                        </div>
                    {/if}
                    <button
                        onclick={removeImage}
                        class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white border-none cursor-pointer flex items-center justify-center hover:bg-black/70 transition-colors duration-200"
                        aria-label="Fjern bilde"
                    >
                        <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            {:else}
                <button
                    onclick={() => fileInput?.click()}
                    class="w-full py-6 px-4 rounded-xl border-[1.5px] border-dashed border-cream-dark bg-transparent text-text-light/60 cursor-pointer hover:border-wine-light hover:bg-wine/[0.02] hover:text-wine/50 transition-all duration-200 font-[inherit]"
                >
                    <div class="flex flex-col items-center gap-1.5">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <span class="text-[0.82rem]">Legg til bilde av retten</span>
                    </div>
                </button>
                <input
                    bind:this={fileInput}
                    type="file"
                    accept="image/*"
                    onchange={handleImageSelect}
                    class="hidden"
                />
            {/if}
        </div>
    </div>

    <!-- Submit -->
    <button
        onclick={handleSubmit}
        disabled={!wineName.trim() || !dishName.trim() || saving || uploading}
        class="w-full py-3.5 px-6 rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-wine text-white border-none hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {saving ? "Lagrer..." : existingRegistration ? "Oppdater registrering" : "Registrer vin og rett"}
    </button>
</div>

<WineSearchModal
    bind:open={searchOpen}
    onSelect={handleSearchSelect}
/>
