<script lang="ts">
    import { getGrapeById } from "$lib/grapes";
    import { getInitials, getAvatarColor } from "$lib/utils";
    import GrapeInfoCard from "./GrapeInfoCard.svelte";
    import type { GrapePair, GrapeRegistration } from "$lib/firebase";

    let {
        pairId,
        pair,
        grapeId,
        registration,
        isOwnPair = false,
        isRevealed = false,
        isAdmin = false,
        index = 0,
    }: {
        pairId: string;
        pair: GrapePair;
        grapeId?: string;
        registration?: GrapeRegistration;
        isOwnPair?: boolean;
        isRevealed?: boolean;
        isAdmin?: boolean;
        index?: number;
    } = $props();

    let grape = $derived(grapeId ? getGrapeById(grapeId) : undefined);
    let canSeeRegistration = $derived(isOwnPair || isRevealed || isAdmin);
</script>

<div
    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_4px_24px_rgba(92,26,42,0.06)] border border-cream-dark/60 overflow-hidden animate-rise-in"
    style="animation-delay: {0.1 + index * 0.06}s"
>
    <!-- Pair header -->
    <div class="px-5 pt-4 pb-3">
        <div class="flex items-center gap-2 mb-1">
            {#each pair.memberNames as name}
                <div class="flex items-center gap-1.5">
                    <div
                        class="w-6 h-6 rounded-full flex items-center justify-center text-[0.5rem] font-bold tracking-wide text-white/90"
                        style="background: {getAvatarColor(name)}"
                    >
                        {getInitials(name)}
                    </div>
                    <span class="text-sm font-medium text-text">{name}</span>
                </div>
                {#if pair.memberNames.indexOf(name) < pair.memberNames.length - 1}
                    <span class="text-text-light/40 text-xs">&</span>
                {/if}
            {/each}
        </div>
    </div>

    <!-- Grape assignment -->
    {#if grape}
        <div class="px-5 pb-3">
            <GrapeInfoCard {grape} expanded={isOwnPair && !isRevealed} />
        </div>
    {/if}

    <!-- Registration content -->
    <div class="px-5 pb-4">
        {#if canSeeRegistration && registration}
            <div class="space-y-3">
                <!-- Wine -->
                <div class="flex items-start gap-3">
                    <div
                        class="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                        style="background: {registration.wineColor === 'red' ? '#5c1a2a' : registration.wineColor === 'white' ? '#e8dd8a' : registration.wineColor === 'rosé' ? '#e8909a' : registration.wineColor === 'bubbles' ? '#d4c8a8' : '#ccc'}"
                    ></div>
                    <div>
                        <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider mb-0.5">Vin</div>
                        {#if registration.wineLink}
                            <a href={registration.wineLink} target="_blank" rel="noopener noreferrer" class="text-wine font-medium text-sm hover:underline">
                                {registration.wineName}
                            </a>
                        {:else}
                            <div class="text-text font-medium text-sm">{registration.wineName}</div>
                        {/if}
                    </div>
                </div>

                <!-- Dish -->
                <div>
                    <div class="text-[0.72rem] font-medium text-text-light uppercase tracking-wider mb-1">Rett</div>
                    <div class="text-text font-medium text-sm">{registration.dishName}</div>
                    {#if registration.dishDescription}
                        <p class="text-text-light text-[0.82rem] mt-0.5 leading-relaxed">{registration.dishDescription}</p>
                    {/if}
                </div>
            </div>
        {:else if !canSeeRegistration && registration}
            <!-- Hidden registration -->
            <div class="flex items-center gap-2 py-3 px-4 rounded-xl bg-cream/40 border border-cream-dark/40">
                <svg class="w-4 h-4 text-text-light/50 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="7" width="10" height="7" rx="2"/>
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke-linecap="round"/>
                </svg>
                <span class="text-text-light text-sm italic">Paret har registrert vin og rett</span>
            </div>
        {:else}
            <!-- No registration yet -->
            <div class="py-3 px-4 rounded-xl bg-cream/20 border border-dashed border-cream-dark/40">
                <span class="text-text-light/60 text-sm italic">Ikke registrert ennå</span>
            </div>
        {/if}
    </div>
</div>
