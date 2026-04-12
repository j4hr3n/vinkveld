<script lang="ts">
    import {
        addParticipant,
        removeParticipant,
        setPairs,
        clearPairs,
        removePair,
        setNightGrapes,
        setGrapeAssignments,
        updateNight,
        type WineNight,
        type GrapePair,
    } from "$lib/firebase";
    import { GRAPES, getGrapeById } from "$lib/grapes";
    import { getInitials, getAvatarColor } from "$lib/utils";

    let { night, nightId, isAdmin = false }: { night: WineNight; nightId: string; isAdmin?: boolean } = $props();

    let isRevealed = $derived(night.revealed === true);

    let newName = $state("");
    let addingName = $state(false);

    let participants = $derived(
        night.participants
            ? Object.entries(night.participants).map(([id, p]) => ({ id, ...p }))
            : []
    );

    let pairs = $derived(
        night.pairs
            ? Object.entries(night.pairs).map(([id, p]) => ({ id, ...p }))
            : []
    );

    let pairCount = $derived(pairs.length);

    let selectedGrapes = $derived(night.grapes ?? []);

    let assignments = $derived(night.grapeAssignments ?? {});
    let hasAssignments = $derived(Object.keys(assignments).length > 0);

    // Pairing state
    let pairingMode = $state(false);
    let pairingQueue = $state<string[]>([]);
    let pairedNames = $derived.by(() => {
        const names = new Set<string>();
        for (const p of pairs) {
            for (const n of p.memberNames) names.add(n.toLowerCase());
        }
        return names;
    });

    let unpairedParticipants = $derived(
        participants.filter((p) => !pairedNames.has(p.name.toLowerCase()))
    );

    // Grape selection
    let grapeSelectOpen = $state(false);
    let grapeSearch = $state("");

    // Confirmation states
    let confirmClearPairs = $state(false);
    let confirmReshuffle = $state(false);

    let filteredGrapes = $derived.by(() => {
        const q = grapeSearch.toLowerCase();
        return GRAPES.filter(
            (g) =>
                g.name.toLowerCase().includes(q) ||
                g.id.includes(q)
        );
    });

    let redGrapes = $derived(filteredGrapes.filter((g) => g.color === "red"));
    let whiteGrapes = $derived(filteredGrapes.filter((g) => g.color === "white"));

    async function handleAddParticipant() {
        const trimmed = newName.trim();
        if (!trimmed) return;
        const exists = participants.some(
            (p) => p.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return;
        addingName = true;
        try {
            await addParticipant(nightId, trimmed);
            newName = "";
        } finally {
            addingName = false;
        }
    }

    async function handleRemoveParticipant(id: string) {
        await removeParticipant(nightId, id);
    }

    function startPairing() {
        pairingMode = true;
        pairingQueue = [];
    }

    function togglePairingPick(name: string) {
        if (pairingQueue.includes(name)) {
            pairingQueue = pairingQueue.filter((n) => n !== name);
        } else {
            pairingQueue = [...pairingQueue, name];
        }
    }

    async function confirmPairAction() {
        if (pairingQueue.length < 2) return;
        const newPair: GrapePair = {
            memberNames: [...pairingQueue],
            created: new Date().toISOString(),
        };
        const existingPairs = night.pairs ?? {};
        const pairId = `pair_${Date.now()}`;
        await setPairs(nightId, { ...existingPairs, [pairId]: newPair });
        pairingQueue = [];
    }

    async function handleClearPairs() {
        await clearPairs(nightId);
        pairingMode = false;
        pairingQueue = [];
        confirmClearPairs = false;
    }

    async function handleRemovePair(pairId: string) {
        await removePair(nightId, pairId);
    }

    function toggleGrapeSelection(grapeId: string) {
        const current = [...selectedGrapes];
        const idx = current.indexOf(grapeId);
        if (idx >= 0) {
            current.splice(idx, 1);
        } else {
            current.push(grapeId);
        }
        setNightGrapes(nightId, current);
        // Clear stale assignments if grape count no longer matches pair count
        if (hasAssignments && current.length !== pairCount) {
            setGrapeAssignments(nightId, {});
        }
    }

    async function handleAssignGrapes() {
        if (selectedGrapes.length !== pairCount) return;
        const shuffled = [...selectedGrapes];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const newAssignments: Record<string, string> = {};
        pairs.forEach((pair, i) => {
            newAssignments[pair.id] = shuffled[i];
        });
        await setGrapeAssignments(nightId, newAssignments);
        confirmReshuffle = false;
    }

    async function handleReshuffle() {
        await handleAssignGrapes();
    }
</script>

<div class="space-y-8">
    <!-- Step 1: Participants -->
    <section>
        <div class="flex items-center gap-3 mb-4">
            <h3 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                Deltakere ({participants.length})
            </h3>
            <div class="flex-1 h-px bg-cream-dark"></div>
        </div>

        {#if participants.length > 0}
            <div class="flex flex-wrap gap-2 mb-4">
                {#each participants as p, i}
                    <div
                        class="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/80 border border-cream-dark/60 animate-rise-in group/chip"
                        style="animation-delay: {i * 0.03}s"
                    >
                        <div
                            class="w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold tracking-wide text-white/90"
                            style="background: {getAvatarColor(p.name)}"
                        >
                            {getInitials(p.name)}
                        </div>
                        <span class="text-sm font-medium text-text">{p.name}</span>
                        {#if isAdmin && !pairedNames.has(p.name.toLowerCase())}
                            <button
                                onclick={() => handleRemoveParticipant(p.id)}
                                class="ml-0.5 p-0.5 rounded-full border-none bg-transparent text-text-light/40 cursor-pointer opacity-0 group-hover/chip:opacity-100 max-[480px]:opacity-100 transition-all duration-200 hover:text-wine hover:bg-wine/5"
                                aria-label="Fjern {p.name}"
                            >
                                <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                                </svg>
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

        {#if isAdmin}
            <div class="flex gap-2">
                <input
                    type="text"
                    placeholder="Navn..."
                    bind:value={newName}
                    onkeydown={(e) => e.key === "Enter" && handleAddParticipant()}
                    class="flex-1 py-2.5 px-4 border-[1.5px] border-cream-dark rounded-xl text-sm font-[inherit] bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300"
                />
                <button
                    onclick={handleAddParticipant}
                    disabled={!newName.trim() || addingName}
                    class="px-4 py-2.5 rounded-xl text-sm font-semibold font-[inherit] cursor-pointer bg-wine text-white border-none hover:bg-wine-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Legg til
                </button>
            </div>
        {:else if participants.length === 0}
            <p class="text-text-light text-sm italic">Arrangøren legger til deltakere.</p>
        {/if}
    </section>

    <!-- Step 2: Pairs -->
    {#if participants.length >= 2}
        <section class="animate-rise-in">
            <div class="flex items-center gap-3 mb-4">
                <h3 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                    Par ({pairCount})
                </h3>
                <div class="flex-1 h-px bg-cream-dark"></div>
                {#if isAdmin && pairs.length > 0}
                    {#if confirmClearPairs}
                        <div class="flex items-center gap-2">
                            <span class="text-[0.72rem] text-wine">Fjerne alle par?</span>
                            <button
                                onclick={handleClearPairs}
                                class="text-[0.72rem] text-white bg-wine px-2 py-0.5 rounded font-[inherit] border-none cursor-pointer hover:bg-wine-dark transition-colors duration-200"
                            >
                                Ja
                            </button>
                            <button
                                onclick={() => (confirmClearPairs = false)}
                                class="text-[0.72rem] text-text-light bg-transparent px-2 py-0.5 rounded font-[inherit] border border-cream-dark cursor-pointer hover:border-wine-light transition-colors duration-200"
                            >
                                Nei
                            </button>
                        </div>
                    {:else}
                        <button
                            onclick={() => (confirmClearPairs = true)}
                            class="text-[0.75rem] text-text-light/60 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] transition-colors duration-200"
                        >
                            Nullstill
                        </button>
                    {/if}
                {/if}
            </div>

            <!-- Existing pairs -->
            {#if pairs.length > 0}
                <div class="flex flex-col gap-2 mb-4">
                    {#each pairs as pair, i}
                        <div
                            class="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/60 border border-cream-dark/50 animate-rise-in group/pair"
                            style="animation-delay: {i * 0.04}s"
                        >
                            {#each pair.memberNames as name, ni}
                                <div class="flex items-center gap-1.5">
                                    <div
                                        class="w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold tracking-wide text-white/90"
                                        style="background: {getAvatarColor(name)}"
                                    >
                                        {getInitials(name)}
                                    </div>
                                    <span class="text-sm text-text">{name}</span>
                                </div>
                                {#if ni < pair.memberNames.length - 1}
                                    <span class="text-text-light/40 text-xs">&</span>
                                {/if}
                            {/each}
                            {#if assignments[pair.id]}
                                <span class="ml-auto text-[0.75rem] text-wine/70 font-medium">
                                    {getGrapeById(assignments[pair.id])?.name ?? assignments[pair.id]}
                                </span>
                            {/if}
                            {#if isAdmin}
                                <button
                                    onclick={() => handleRemovePair(pair.id)}
                                    class="ml-auto p-1 rounded-lg border-none bg-transparent text-text-light/30 cursor-pointer opacity-0 group-hover/pair:opacity-100 max-[480px]:opacity-100 transition-all duration-200 hover:text-wine hover:bg-wine/5"
                                    aria-label="Fjern par"
                                >
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                                    </svg>
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Pairing mode (admin only) -->
            {#if isAdmin && unpairedParticipants.length >= 2}
                {#if !pairingMode}
                    <button
                        onclick={startPairing}
                        class="w-full py-2.5 px-4 rounded-xl border-[1.5px] border-dashed border-wine-light/50 bg-transparent text-wine/70 text-sm font-medium font-[inherit] cursor-pointer hover:bg-wine/5 hover:border-wine-light transition-all duration-200"
                    >
                        + Lag par
                    </button>
                {:else}
                    <div class="p-4 rounded-xl border border-wine-light/30 bg-wine/[0.02]">
                        <p class="text-[0.75rem] text-text-light mb-3">
                            Velg {pairingQueue.length === 0 ? '2' : unpairedParticipants.length - pairingQueue.length <= 1 ? 'resten' : 'en til'} for å lage et par:
                        </p>
                        <div class="flex flex-wrap gap-2 mb-3">
                            {#each unpairedParticipants as p}
                                <button
                                    onclick={() => togglePairingPick(p.name)}
                                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-full cursor-pointer transition-all duration-200 font-[inherit] border-[1.5px] {pairingQueue.includes(p.name)
                                        ? 'border-wine bg-wine/10 text-wine shadow-[0_2px_8px_rgba(92,26,42,0.1)]'
                                        : 'border-cream-dark bg-white/60 text-text-light hover:border-wine-light'}"
                                >
                                    <div
                                        class="w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold tracking-wide text-white/90"
                                        style="background: {getAvatarColor(p.name)}"
                                    >
                                        {getInitials(p.name)}
                                    </div>
                                    <span class="text-sm font-medium">{p.name}</span>
                                </button>
                            {/each}
                        </div>
                        <div class="flex gap-2">
                            <button
                                onclick={confirmPairAction}
                                disabled={pairingQueue.length < 2}
                                class="px-4 py-2 rounded-lg text-sm font-semibold font-[inherit] cursor-pointer bg-wine text-white border-none hover:bg-wine-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Bekreft par
                            </button>
                            <button
                                onclick={() => { pairingMode = false; pairingQueue = []; }}
                                class="px-4 py-2 rounded-lg text-sm font-medium font-[inherit] cursor-pointer bg-transparent text-text-light border border-cream-dark hover:border-wine-light hover:text-wine transition-all duration-200"
                            >
                                Avbryt
                            </button>
                        </div>
                    </div>
                {/if}
            {:else if !isAdmin && pairs.length === 0}
                <p class="text-text-light text-sm italic">Arrangøren oppretter par.</p>
            {/if}
        </section>
    {/if}

    <!-- Step 3: Select grapes & assign (admin only) -->
    {#if pairCount > 0 && isAdmin}
        <section class="animate-rise-in">
            <div class="flex items-center gap-3 mb-4">
                <h3 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                    Druer ({selectedGrapes.length}/{pairCount})
                </h3>
                <div class="flex-1 h-px bg-cream-dark"></div>
                <button
                    onclick={() => (grapeSelectOpen = !grapeSelectOpen)}
                    class="text-[0.75rem] text-wine/70 hover:text-wine cursor-pointer border-none bg-transparent font-[inherit] font-medium transition-colors duration-200"
                >
                    {grapeSelectOpen ? "Skjul" : "Velg druer"}
                </button>
            </div>

            <!-- Selected grapes chips -->
            {#if selectedGrapes.length > 0}
                <div class="flex flex-wrap gap-2 mb-4">
                    {#each selectedGrapes as grapeId}
                        {@const grape = getGrapeById(grapeId)}
                        {#if grape}
                            <button
                                onclick={() => toggleGrapeSelection(grapeId)}
                                class="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-white/80 border border-cream-dark/60 cursor-pointer hover:border-wine-light transition-all duration-200 font-[inherit] group/grape"
                            >
                                <span
                                    class="w-2.5 h-2.5 rounded-full shrink-0"
                                    style="background: {grape.color === 'red' ? '#5c1a2a' : '#e8dd8a'}; {grape.color === 'white' ? 'border: 1px solid #c8bc5a' : ''}"
                                ></span>
                                <span class="text-[0.78rem] font-medium text-text">{grape.name}</span>
                                <svg class="w-2.5 h-2.5 text-text-light/40 group-hover/grape:text-wine transition-colors duration-200" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                                </svg>
                            </button>
                        {/if}
                    {/each}
                </div>
            {/if}

            <!-- Grape picker -->
            {#if grapeSelectOpen}
                <div class="mb-4 p-4 rounded-xl border border-cream-dark/60 bg-white/60 animate-fade-in">
                    <input
                        type="text"
                        placeholder="Søk druer..."
                        bind:value={grapeSearch}
                        class="w-full py-2 px-3 border-[1.5px] border-cream-dark rounded-lg text-sm font-[inherit] bg-cream/40 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-300 mb-3"
                    />

                    {#if redGrapes.length > 0}
                        <div class="mb-3">
                            <div class="text-[0.68rem] font-medium text-text-light/60 uppercase tracking-wider mb-2">Røde druer</div>
                            <div class="flex flex-wrap gap-1.5">
                                {#each redGrapes as grape}
                                    <button
                                        onclick={() => toggleGrapeSelection(grape.id)}
                                        disabled={!selectedGrapes.includes(grape.id) && selectedGrapes.length >= pairCount}
                                        class="py-1 px-2.5 rounded-full text-[0.75rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {selectedGrapes.includes(grape.id)
                                            ? 'border-wine bg-wine/10 text-wine'
                                            : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light disabled:opacity-30 disabled:cursor-not-allowed'}"
                                    >
                                        {grape.name}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if whiteGrapes.length > 0}
                        <div>
                            <div class="text-[0.68rem] font-medium text-text-light/60 uppercase tracking-wider mb-2">Hvite druer</div>
                            <div class="flex flex-wrap gap-1.5">
                                {#each whiteGrapes as grape}
                                    <button
                                        onclick={() => toggleGrapeSelection(grape.id)}
                                        disabled={!selectedGrapes.includes(grape.id) && selectedGrapes.length >= pairCount}
                                        class="py-1 px-2.5 rounded-full text-[0.75rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {selectedGrapes.includes(grape.id)
                                            ? 'border-wine bg-wine/10 text-wine'
                                            : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light disabled:opacity-30 disabled:cursor-not-allowed'}"
                                    >
                                        {grape.name}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Assign button -->
            {#if selectedGrapes.length === pairCount}
                <div class="flex gap-2">
                    {#if !hasAssignments}
                        <button
                            onclick={handleAssignGrapes}
                            class="flex-1 py-3 px-4 rounded-xl text-sm font-semibold font-[inherit] cursor-pointer bg-wine text-white border-none hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] transition-all duration-300"
                        >
                            Tildel druer tilfeldig
                        </button>
                    {:else if confirmReshuffle}
                        <div class="flex-1 flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px] border-wine/30 bg-wine/[0.03]">
                            <span class="text-sm text-text flex-1">Trekke på nytt? Nåværende tildeling fjernes.</span>
                            <button
                                onclick={handleReshuffle}
                                class="px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold font-[inherit] cursor-pointer bg-wine text-white border-none hover:bg-wine-dark transition-all duration-200"
                            >
                                Bekreft
                            </button>
                            <button
                                onclick={() => (confirmReshuffle = false)}
                                class="px-3 py-1.5 rounded-lg text-[0.78rem] font-medium font-[inherit] cursor-pointer bg-transparent text-text-light border border-cream-dark hover:border-wine-light transition-all duration-200"
                            >
                                Avbryt
                            </button>
                        </div>
                    {:else}
                        <button
                            onclick={() => (confirmReshuffle = true)}
                            class="flex-1 py-3 px-4 rounded-xl text-sm font-semibold font-[inherit] cursor-pointer bg-transparent text-wine border-[1.5px] border-wine hover:bg-wine/5 transition-all duration-200"
                        >
                            Trekk på nytt
                        </button>
                    {/if}
                </div>
            {/if}
        </section>
    {/if}

    <!-- Reveal settings (admin only, after assignments) -->
    {#if isAdmin && hasAssignments}
        <section class="animate-rise-in">
            <div class="flex items-center gap-3 mb-4">
                <h3 class="text-[0.82rem] font-medium text-text-light uppercase tracking-wider">
                    Synlighet
                </h3>
                <div class="flex-1 h-px bg-cream-dark"></div>
            </div>

            <div class="space-y-3">
                <!-- Scheduled reveal time -->
                <div class="flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px] border-cream-dark bg-white/60">
                    <svg class="w-5 h-5 text-text-light shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="8" cy="8" r="6.5"/>
                        <path d="M8 4v4l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-text">Avsløres automatisk</div>
                        <div class="text-[0.75rem] text-text-light mt-0.5">
                            {night.date ? `Den ${night.date}` : "På kveldsdagen"} kl.
                        </div>
                    </div>
                    <input
                        type="time"
                        value={night.revealTime ?? ""}
                        onchange={(e) => {
                            const val = (e.target as HTMLInputElement).value;
                            updateNight(nightId, { revealTime: val || "" });
                        }}
                        class="py-1.5 px-2.5 border-[1.5px] border-cream-dark rounded-lg text-sm font-[inherit] bg-cream/40 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-200 w-24"
                    />
                </div>

                <!-- Manual override -->
                <button
                    onclick={() => updateNight(nightId, { revealed: !isRevealed })}
                    class="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px] cursor-pointer transition-all duration-200 font-[inherit] text-left {isRevealed
                        ? 'border-sage bg-sage/5 hover:bg-sage/10'
                        : 'border-cream-dark bg-white/60 hover:border-wine-light'}"
                >
                    {#if isRevealed}
                        <svg class="w-5 h-5 text-sage shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                            <circle cx="8" cy="8" r="2"/>
                        </svg>
                        <div>
                            <div class="text-sm font-medium text-sage">Vin og rett er synlig for alle</div>
                            <div class="text-[0.75rem] text-text-light mt-0.5">Trykk for å skjule igjen</div>
                        </div>
                    {:else}
                        <svg class="w-5 h-5 text-text-light shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M2 2l12 12M4.5 6.5C3.2 7.3 2 8 2 8s2.5 5 7 5c1 0 1.9-.3 2.7-.7M7 3.2c.3-.1.6-.2 1-.2 4.5 0 7 5 7 5s-.7 1.4-2 2.7" stroke-linecap="round"/>
                        </svg>
                        <div>
                            <div class="text-sm font-medium text-text">Avsløre nå</div>
                            <div class="text-[0.75rem] text-text-light mt-0.5">Trykk for å gjøre vin og rett synlig for alle umiddelbart</div>
                        </div>
                    {/if}
                </button>
            </div>
        </section>
    {/if}

    <!-- Format info box -->
    <section class="p-4 rounded-xl bg-wine/[0.03] border border-wine-light/20">
        <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-wine/50 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="8" cy="8" r="7"/>
                <path d="M8 4.5v4M8 11v.5" stroke-linecap="round"/>
            </svg>
            <div class="text-[0.82rem] text-text-light leading-relaxed">
                <p class="font-medium text-text mb-1">Slik fungerer drueaften</p>
                <p>Hvert par tildeles en drue og velger en vin med den druen, samt en rett som passer til. Valgene holdes hemmelig for de andre parene frem til kvelden.</p>
            </div>
        </div>
    </section>
</div>
