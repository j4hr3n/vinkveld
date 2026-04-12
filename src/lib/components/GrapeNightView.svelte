<script lang="ts">
    import { onMount } from "svelte";
    import { updateNight, type WineNight } from "$lib/firebase";
    import GrapeSetup from "./GrapeSetup.svelte";
    import GrapePairCard from "./GrapePairCard.svelte";
    import GrapeRegistrationForm from "./GrapeRegistrationForm.svelte";

    let {
        night,
        nightId,
        currentUser,
        isAdmin = false,
    }: {
        night: WineNight;
        nightId: string;
        currentUser: string;
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

    // Ticking clock for scheduled reveal
    let now = $state(new Date());

    onMount(() => {
        const interval = setInterval(() => { now = new Date(); }, 30_000);
        return () => clearInterval(interval);
    });

    let scheduledReveal = $derived.by(() => {
        if (!night.revealTime || !night.date) return false;
        const revealAt = new Date(`${night.date}T${night.revealTime}`);
        return now >= revealAt;
    });

    let isRevealed = $derived(night.revealed === true || scheduledReveal);
    let isManuallyRevealed = $derived(night.revealed === true);

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
    let showRegistrationForm = $state(false);
    let showHelp = $state(false);

    let myGrapeId = $derived(myPairId ? assignments[myPairId] : undefined);
    let myRegistration = $derived(myPairId ? registrations[myPairId] : undefined);
    let myPair = $derived(
        myPairId ? pairs.find((p) => p.id === myPairId) : undefined
    );
</script>

<div class="space-y-6">
    <!-- Setup phase: always show setup when not fully configured -->
    {#if !isSetupComplete}
        <GrapeSetup {night} {nightId} {isAdmin} />
    {:else}
        <!-- Registration / reveal phase -->

        <!-- Admin controls -->
        {#if isAdmin}
            <div class="flex items-center gap-3 animate-fade-in flex-wrap">
                <!-- Reveal toggle -->
                <button
                    onclick={() => updateNight(nightId, { revealed: !isManuallyRevealed })}
                    class="flex items-center gap-2 py-2 px-4 rounded-xl border-[1.5px] cursor-pointer transition-all duration-200 font-[inherit] text-[0.82rem] font-medium {isRevealed
                        ? 'border-sage bg-sage/10 text-sage'
                        : 'border-cream-dark bg-white/60 text-text-light hover:border-wine-light hover:text-wine'}"
                >
                    {#if isRevealed}
                        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                            <circle cx="8" cy="8" r="2"/>
                        </svg>
                        Synlig for alle
                    {:else}
                        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M2 2l12 12M4.5 6.5C3.2 7.3 2 8 2 8s2.5 5 7 5c1 0 1.9-.3 2.7-.7M7 3.2c.3-.1.6-.2 1-.2 4.5 0 7 5 7 5s-.7 1.4-2 2.7" stroke-linecap="round"/>
                        </svg>
                        Skjult for andre
                    {/if}
                </button>

                <!-- Edit setup toggle -->
                {#if showSetup}
                    <button
                        onclick={() => (showSetup = false)}
                        class="text-[0.78rem] text-wine/70 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] font-medium transition-colors duration-200"
                    >
                        Skjul oppsett
                    </button>
                {:else}
                    <button
                        onclick={() => (showSetup = true)}
                        class="text-[0.78rem] text-text-light/60 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] transition-colors duration-200"
                    >
                        Endre oppsett
                    </button>
                {/if}
            </div>

            {#if showSetup}
                <GrapeSetup {night} {nightId} {isAdmin} />
            {/if}
        {/if}

        <!-- Own pair registration form (before reveal) -->
        {#if myPairId && myGrapeId && !isRevealed}
            {#if myRegistration && !showRegistrationForm}
                <button
                    onclick={() => (showRegistrationForm = true)}
                    class="w-full flex items-center gap-3 py-3 px-5 rounded-2xl border-[1.5px] border-dashed border-wine-light/40 bg-white/40 cursor-pointer transition-all duration-200 font-[inherit] text-left hover:bg-white/70 hover:border-wine-light/60"
                >
                    <svg class="w-4 h-4 text-wine/50 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="text-[0.82rem] text-text-light">Endre din registrering</span>
                </button>
            {:else}
                <div class="animate-rise-in">
                    <GrapeRegistrationForm
                        {nightId}
                        pairId={myPairId}
                        grapeId={myGrapeId}
                        existingRegistration={myRegistration}
                        pairNames={myPair?.memberNames ?? []}
                    />
                    {#if myRegistration}
                        <button
                            onclick={() => (showRegistrationForm = false)}
                            class="w-full text-center text-[0.78rem] text-text-light/60 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] py-2 mt-1 transition-colors duration-200"
                        >
                            Skjul skjema
                        </button>
                    {/if}
                </div>
            {/if}
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

        <!-- Welcome message for users who haven't set their name -->
        {#if !currentUser}
            <div class="p-5 rounded-2xl bg-wine/[0.04] border border-wine-light/25 animate-rise-in">
                <div class="flex items-start gap-3 mb-3">
                    <div class="text-2xl shrink-0">🍇</div>
                    <div>
                        <h3 class="text-base font-semibold text-wine mb-1">Velkommen til drueaften!</h3>
                        <p class="text-[0.85rem] text-text-light leading-relaxed">
                            Dere er delt inn i par, og hvert par har fått tildelt en drue.
                            Oppgaven er å velge en vin med den druen og en rett som passer til.
                        </p>
                    </div>
                </div>
                <div class="ml-9 p-3 rounded-xl bg-white/60 border border-cream-dark/40">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-wine/60 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="8" cy="5.5" r="2.5"/>
                            <path d="M2.5 14c0-2.8 2.46-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke-linecap="round"/>
                        </svg>
                        <span class="text-[0.82rem] text-text">Trykk på profil-knappen oppe til høyre og skriv inn navnet ditt for å komme i gang.</span>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Help button -->
        <div class="animate-fade-in">
            <button
                onclick={() => (showHelp = !showHelp)}
                class="flex items-center gap-1.5 text-[0.78rem] text-text-light/50 hover:text-wine/70 cursor-pointer border-none bg-transparent font-[inherit] transition-colors duration-200 py-1"
            >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="7"/>
                    <path d="M6 6.5a2 2 0 1 1 2.5 1.9c-.3.1-.5.4-.5.7V10" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                </svg>
                Hvordan fungerer drueaften?
            </button>

            {#if showHelp}
                <div class="mt-2 p-4 rounded-xl bg-wine/[0.03] border border-wine-light/20 animate-fade-in space-y-3">
                    <div class="flex items-start gap-2.5">
                        <span class="text-base shrink-0 mt-0.5">🍷</span>
                        <div class="text-[0.82rem] text-text-light leading-relaxed">
                            <p class="font-medium text-text mb-0.5">Par og druer</p>
                            <p>Alle deltakere deles inn i par. Hvert par tildeles en druetype og skal finne en vin laget med den druen, pluss en rett som passer til.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5">
                        <span class="text-base shrink-0 mt-0.5">🧪</span>
                        <div class="text-[0.82rem] text-text-light leading-relaxed">
                            <p class="font-medium text-text mb-0.5">Trenger ikke være 100%</p>
                            <p>Vinen trenger ikke være laget av kun den tildelte druen. Det holder at den er hoveddruen i en blending, eller at den er godt representert i vinen.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5">
                        <span class="text-base shrink-0 mt-0.5">🤫</span>
                        <div class="text-[0.82rem] text-text-light leading-relaxed">
                            <p class="font-medium text-text mb-0.5">Hemmelig til kvelden</p>
                            <p>Hvilken vin og rett hvert par velger holdes skjult fra de andre frem til avsløringen.</p>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
