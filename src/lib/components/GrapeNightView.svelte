<script lang="ts">
    import type { WineNight } from "$lib/firebase";
    import GrapeSetup from "./GrapeSetup.svelte";
    import GrapePairCard from "./GrapePairCard.svelte";
    import GrapeRegistrationForm from "./GrapeRegistrationForm.svelte";

    let {
        night,
        nightId,
        currentUser,
        isPastEvent,
        isAdmin = false,
    }: {
        night: WineNight;
        nightId: string;
        currentUser: string;
        isPastEvent: boolean;
        isAdmin?: boolean;
    } = $props();

    let pairs = $derived(
        night.pairs
            ? Object.entries(night.pairs).map(([id, p]) => ({ id, ...p }))
            : []
    );

    let assignments = $derived(night.grapeAssignments ?? {});
    let hasAssignments = $derived(Object.keys(assignments).length > 0);
    let registrations = $derived(night.registrations ?? {});

    let isRevealed = $derived(isPastEvent);

    let myPairId = $derived.by(() => {
        if (!currentUser || !night.pairs) return null;
        const normalized = currentUser.trim().toLowerCase();
        for (const [pairId, pair] of Object.entries(night.pairs)) {
            if (pair.memberNames.some((n) => n.trim().toLowerCase() === normalized)) {
                return pairId;
            }
        }
        return null;
    });

    let isSetupComplete = $derived(pairs.length > 0 && hasAssignments);
    let showSetup = $state(false);

    let myGrapeId = $derived(myPairId ? assignments[myPairId] : undefined);
    let myRegistration = $derived(myPairId ? registrations[myPairId] : undefined);
    let myPair = $derived(
        myPairId ? pairs.find((p) => p.id === myPairId) : undefined
    );
</script>

<div class="space-y-6">
    <!-- Setup phase: always show setup when not fully configured -->
    {#if !isSetupComplete}
        <GrapeSetup {night} {nightId} />
    {:else}
        <!-- Registration / reveal phase -->

        <!-- Toggle to re-open setup for editing (admin only) -->
        {#if !isRevealed && isAdmin}
            {#if showSetup}
                <GrapeSetup {night} {nightId} />
                <button
                    onclick={() => (showSetup = false)}
                    class="w-full text-center text-[0.78rem] text-text-light/60 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] py-2 transition-colors duration-200"
                >
                    Skjul oppsett
                </button>
            {:else}
                <button
                    onclick={() => (showSetup = true)}
                    class="w-full text-center text-[0.78rem] text-text-light/60 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] py-2 transition-colors duration-200"
                >
                    Endre oppsett
                </button>
            {/if}
        {/if}

        <!-- Own pair registration form (before reveal) -->
        {#if myPairId && myGrapeId && !isRevealed}
            <div class="animate-rise-in">
                <GrapeRegistrationForm
                    {nightId}
                    pairId={myPairId}
                    grapeId={myGrapeId}
                    existingRegistration={myRegistration}
                    pairNames={myPair?.memberNames ?? []}
                />
            </div>
        {/if}

        <!-- All pairs gallery -->
        <div>
            <div class="flex items-center gap-3 mb-4 animate-fade-in">
                <h3 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                    {isRevealed ? "Kveldens par" : "Par og druer"}
                </h3>
                <div class="flex-1 h-px bg-cream-dark"></div>
            </div>

            <div class="flex flex-col gap-4">
                {#each pairs as pair, i (pair.id)}
                    <GrapePairCard
                        pairId={pair.id}
                        {pair}
                        grapeId={assignments[pair.id]}
                        registration={registrations[pair.id]}
                        isOwnPair={pair.id === myPairId}
                        {isRevealed}
                        index={i}
                    />
                {/each}
            </div>
        </div>

        <!-- Format info (not own pair or spectator) -->
        {#if !myPairId && !isRevealed}
            <div class="p-4 rounded-xl bg-wine/[0.03] border border-wine-light/20 animate-fade-in">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-wine/50 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="8" cy="8" r="7"/>
                        <path d="M8 4.5v4M8 11v.5" stroke-linecap="round"/>
                    </svg>
                    <div class="text-[0.82rem] text-text-light leading-relaxed">
                        <p>Sett navnet ditt i profilen for å se ditt pars registrering og legge inn vin og rett.</p>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>
