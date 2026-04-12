<script lang="ts">
    import { page } from "$app/state";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import {
        subscribeToNight,
        addWine,
        updateWine,
        removeWine,
        updateNight,
        setWineRating,
        type WineNight,
        type Wine,
        type NightType,
    } from "$lib/firebase";
    import WineCard from "$lib/components/WineCard.svelte";
    import WineForm from "$lib/components/WineForm.svelte";
    import WineResults from "$lib/components/WineResults.svelte";
    import GrapeNightView from "$lib/components/GrapeNightView.svelte";
    import CopiedToast from "$lib/components/CopiedToast.svelte";
    import { addToHistory } from "$lib/history";
    import { colorOrder } from "$lib/colors";
    import { getInitials, formatDate } from "$lib/utils";
    import { getUserName, setUserName } from "$lib/identity";

    let nightId = $derived(page.params.nightId);
    let night = $state<WineNight | null | undefined>(undefined);
    let editingWineId = $state<string | null>(null);
    let toastVisible = $state(false);
    let selectedPerson = $state<string | null>(null);
    let currentUser = $state(getUserName() ?? '');

    // Feature: Edit night header
    let editingHeader = $state(false);
    let editTitle = $state('');
    let editDate = $state('');
    let editType = $state<NightType>("home");
    let savingHeader = $state(false);

    // Feature: Rate without adding a wine
    let raterNameInput = $state('');

    // Profile popover — open by default if no user is set (except grape nights)
    let profileOpen = $state(false);
    let profileAutoOpened = $state(false);

    // Position the auto-opened popover once the profile button enters the DOM
    $effect(() => {
        if (profileOpen && profileButtonEl) {
            const rect = profileButtonEl.getBoundingClientRect();
            popoverTop = rect.bottom + 20;
            popoverRight = window.innerWidth - rect.right;
        }
    });
    let profileButtonEl = $state<HTMLButtonElement | null>(null);
    let popoverTop = $state(0);
    let popoverRight = $state(0);

    function openProfile() {
        if (profileButtonEl) {
            const rect = profileButtonEl.getBoundingClientRect();
            popoverTop = rect.bottom + 20;
            popoverRight = window.innerWidth - rect.right;
        }
        profileOpen = !profileOpen;
    }

    // Collapsible wine list
    let winesOpen = $state(true);

    $effect(() => {
        winesOpen = !completed;
    });

    let completed = $derived(night?.completed ?? false);
    let isRestaurant = $derived((night?.type ?? "home") === "restaurant");
    let isGrape = $derived((night?.type ?? "home") === "grape");

    $effect(() => {
        if (isRestaurant) selectedPerson = null;
    });

    let isPastEvent = $derived.by(() => {
        if (!night?.date) return false;
        const eventDate = new Date(night.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate <= today;
    });

    let formElement = $state<HTMLDivElement | null>(null);

    let wines = $derived.by(() => {
        if (!night?.wines) return [];
        const list = Object.entries(night.wines).map(([id, w]) => ({
            ...w,
            id,
        }));
        list.sort(
            (a, b) => (colorOrder[a.color] ?? 99) - (colorOrder[b.color] ?? 99),
        );
        return list;
    });

    let participants = $derived.by(() => {
        if (isGrape && night?.participants) {
            return Object.values(night.participants).map((p) => ({ name: p.name, count: 0 }));
        }
        const counts = new Map<string, number>();
        for (const w of wines) {
            if (w.person) {
                counts.set(w.person, (counts.get(w.person) ?? 0) + 1);
            }
        }
        return [...counts.entries()].map(([name, count]) => ({ name, count }));
    });

    let isKnownParticipant = $derived(
        participants.some((p) => p.name === currentUser)
    );

    let filteredWines = $derived(
        selectedPerson
            ? wines.filter((w) => w.person === selectedPerson)
            : wines,
    );

    let editingWine = $derived(
        editingWineId
            ? (wines.find((w) => w.id === editingWineId) ?? null)
            : null,
    );

    function getAvatarColor(name: string): string {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = ((hash % 360) + 360) % 360;
        return `hsl(${hue}, 40%, 35%)`;
    }

    function togglePerson(name: string) {
        selectedPerson = selectedPerson === name ? null : name;
    }

    function toggleCompleted() {
        if (!completed) editingWineId = null;
        updateNight(nightId!, { completed: !completed });
    }

    let isAdmin = $state(false);

    onMount(() => {
        isAdmin = new URLSearchParams(window.location.search).has("admin");

        const id = nightId;
        if (!id) return;
        const unsubscribe = subscribeToNight(id, (data) => {
            night = data;
        });

        return unsubscribe;
    });

    $effect(() => {
        if (night && nightId) {
            addToHistory(nightId, night.title, night.date);
        }
    });

    $effect(() => {
        if (night && !profileAutoOpened && !getUserName() && !isGrape) {
            profileOpen = true;
            profileAutoOpened = true;
        }
    });

    $effect(() => {
        if (completed) editingWineId = null;
    });

    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
        toastVisible = true;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastVisible = false;
        }, 1500);
    }

    async function handleAdd(data: {
        name: string;
        person: string;
        color: Wine["color"];
        link: string;
        notes: string;
    }) {
        if (completed) return;
        await addWine(nightId!, data);
    }

    async function handleEdit(data: {
        name: string;
        person: string;
        color: Wine["color"];
        link: string;
        notes: string;
    }) {
        if (completed) return;
        if (!editingWineId) return;
        const wineId = editingWineId;
        editingWineId = null;
        await updateWine(nightId!, wineId, data);
    }

    function handleDelete(wineId: string) {
        if (completed) return;
        if (editingWineId === wineId) editingWineId = null;
        removeWine(nightId!, wineId);
    }

    async function handleRate(wineId: string, score: number) {
        if (!currentUser || !nightId) return;
        await setWineRating(nightId, wineId, currentUser, score);
    }

    function startEdit(wineId: string) {
        if (completed) return;
        editingWineId = wineId;
        setTimeout(
            () => formElement?.scrollIntoView({ behavior: "smooth" }),
            0,
        );
    }

    function startEditHeader() {
        editTitle = night!.title;
        editDate = night!.date;
        editType = night!.type ?? "home";
        editingHeader = true;
    }

    async function saveHeader() {
        const t = editTitle.trim();
        if (!t) return;
        savingHeader = true;
        try {
            await updateNight(nightId!, { title: t, date: editDate, type: editType });
            editingHeader = false;
        } finally {
            savingHeader = false;
        }
    }

    function cancelEditHeader() { editingHeader = false; }

    function handleRaterNameSubmit() {
        const trimmed = raterNameInput.trim();
        if (!trimmed) return;
        setUserName(trimmed);
        currentUser = trimmed;
        profileOpen = false;
    }

    function handleClaimParticipant(name: string) {
        setUserName(name);
        currentUser = name;
        profileOpen = false;
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
                <path
                    d="M14 4h20l-2 24c-.5 6-4 10-8 10s-7.5-4-8-10L14 4z"
                    stroke="#5c1a2a"
                    stroke-width="1.5"
                    fill="none"
                    opacity="0.2"
                />
                <clipPath id="glass-clip">
                    <path
                        d="M14 4h20l-2 24c-.5 6-4 10-8 10s-7.5-4-8-10L14 4z"
                    />
                </clipPath>
                <rect
                    x="12"
                    y="4"
                    width="24"
                    height="34"
                    fill="#5c1a2a"
                    opacity="0.15"
                    clip-path="url(#glass-clip)"
                >
                    <animate
                        attributeName="y"
                        values="38;4"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </rect>
                <line
                    x1="24"
                    y1="38"
                    x2="24"
                    y2="52"
                    stroke="#5c1a2a"
                    stroke-width="1.5"
                    opacity="0.2"
                />
                <line
                    x1="18"
                    y1="52"
                    x2="30"
                    y2="52"
                    stroke="#5c1a2a"
                    stroke-width="1.5"
                    opacity="0.2"
                    stroke-linecap="round"
                />
            </svg>
        </div>
        <p class="text-text-light font-accent italic text-lg">
            Laster vinkveld...
        </p>
    </div>
{:else if night === null}
    <div class="text-center pt-20 animate-fade-in">
        <div class="text-5xl mb-4 opacity-60">🍷</div>
        <h1 class="text-wine text-2xl mb-3">Fant ikke vinkvelden</h1>
        <p class="text-text-light mb-4 font-accent italic text-lg">
            Kanskje lenken er feil?
        </p>
        <a
            href="{base}/"
            class="inline-flex items-center gap-2 text-wine font-medium no-underline border-b border-dashed border-wine-light pb-0.5 hover:border-solid transition-all duration-200"
        >
            Lag en ny vinkveld
        </a>
    </div>
{:else}
    <div>
        <!-- Compact header -->
        <div class="animate-slide-down mb-6">
            <!-- Back + share row -->
            <div class="flex items-center justify-between mb-3">
                <a
                    href="{base}/"
                    class="inline-flex items-center gap-1.5 text-text-light text-[0.82rem] no-underline hover:text-wine transition-colors duration-200"
                >
                    <svg
                        class="w-3.5 h-3.5"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                    >
                        <path
                            d="M10 3L5 8l5 5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    Ny vinkveld
                </a>
                <div class="flex items-center gap-2">
                    {#if isPastEvent && !isGrape}
                        {#if completed}
                            <button
                                class="inline-flex items-center gap-1.5 bg-sage/15 text-sage px-2.5 py-1.5 rounded-lg text-[0.78rem] font-medium font-[inherit] border-none cursor-pointer hover:bg-sage/25 transition-all duration-200"
                                onclick={toggleCompleted}
                            >
                                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 8l4 4 6-7" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span class="hidden sm:inline">Fullført</span>
                            </button>
                        {:else}
                            <button
                                class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.78rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-none bg-white/60 text-text-light hover:text-wine hover:bg-white/80"
                                onclick={toggleCompleted}
                            >
                                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M3 8l4 4 6-7" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span class="hidden sm:inline">Marker som fullført</span>
                            </button>
                        {/if}
                    {/if}
                    <button
                        class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.78rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-none {toastVisible
                            ? 'bg-sage/10 text-sage'
                            : 'bg-white/60 text-text-light hover:text-wine hover:bg-white/80'}"
                        onclick={copyLink}
                    >
                        {#if toastVisible}
                            <svg
                                class="w-3.5 h-3.5"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M3 8l4 4 6-7"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span class="hidden sm:inline">Kopiert!</span>
                        {:else}
                            <svg
                                class="w-3.5 h-3.5"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <rect x="5" y="5" width="8" height="8" rx="1.5" />
                                <path
                                    d="M3 11V3h8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span class="hidden sm:inline">Del</span>
                        {/if}
                    </button>

                    <!-- Profile button -->
                    {#if wines.length > 0 || isRestaurant || isGrape}
                        {#if isKnownParticipant}
                            <button
                                bind:this={profileButtonEl}
                                onclick={openProfile}
                                aria-label="Din profil"
                                class="w-7 h-7 rounded-full flex items-center justify-center text-[0.55rem] font-bold tracking-wide text-white/90 cursor-pointer border-none transition-all duration-200 hover:scale-110 hover:shadow-[0_2px_8px_rgba(92,26,42,0.2)] active:scale-95 {profileOpen ? 'scale-110 shadow-[0_2px_8px_rgba(92,26,42,0.2)]' : ''}"
                                style="background: {getAvatarColor(currentUser)}"
                            >
                                {getInitials(currentUser)}
                            </button>
                        {:else}
                            <button
                                bind:this={profileButtonEl}
                                onclick={openProfile}
                                aria-label="Velg identitet"
                                class="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border border-dashed transition-all duration-200 bg-transparent font-[inherit] {profileOpen ? 'border-wine/50 text-wine/70 bg-white/60' : 'border-text-light/25 text-text-light/40 hover:border-wine/40 hover:text-wine/60 hover:bg-white/60'}"
                            >
                                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="8" cy="5.5" r="2.5"/>
                                    <path d="M2.5 14c0-2.8 2.46-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke-linecap="round"/>
                                </svg>
                            </button>
                        {/if}
                    {/if}
                </div>
            </div>

            <!-- Title + date -->
            {#if editingHeader}
                <div class="animate-fade-in">
                    <input
                        type="text"
                        bind:value={editTitle}
                        onkeydown={(e) => { if (e.key === 'Enter') saveHeader(); if (e.key === 'Escape') cancelEditHeader(); }}
                        class="w-full text-[2rem] max-[480px]:text-[1.6rem] text-wine tracking-tight font-bold leading-tight bg-transparent border-0 border-b-2 border-wine-light focus:outline-none mb-1 font-[inherit] px-0"
                    />
                    <input
                        type="date"
                        bind:value={editDate}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEditHeader(); }}
                        class="font-accent italic text-text-light text-base bg-transparent border-0 border-b border-cream-dark focus:outline-none focus:border-wine-light font-[inherit] px-0 mb-3"
                    />
                    <div class="flex gap-2 mb-3">
                        <button
                            type="button"
                            class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.82rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {editType === 'home'
                                ? 'border-wine bg-wine/5 text-wine'
                                : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
                            onclick={() => (editType = "home")}
                        >
                            Hjemme
                        </button>
                        <button
                            type="button"
                            class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.82rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {editType === 'restaurant'
                                ? 'border-wine bg-wine/5 text-wine'
                                : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
                            onclick={() => (editType = "restaurant")}
                        >
                            Restaurant
                        </button>
                        <button
                            type="button"
                            class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.82rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {editType === 'grape'
                                ? 'border-wine bg-wine/5 text-wine'
                                : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
                            onclick={() => (editType = "grape")}
                        >
                            Drueaften
                        </button>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button
                            onclick={saveHeader}
                            disabled={savingHeader}
                            class="px-4 py-1.5 rounded-lg text-sm font-semibold font-[inherit] cursor-pointer bg-wine text-white border-none hover:bg-wine-dark transition-all duration-200 disabled:opacity-60"
                        >
                            {savingHeader ? 'Lagrer...' : 'Lagre'}
                        </button>
                        <button
                            onclick={cancelEditHeader}
                            class="px-4 py-1.5 rounded-lg text-sm font-medium font-[inherit] cursor-pointer bg-transparent text-text-light border border-cream-dark hover:border-wine-light hover:text-wine transition-all duration-200"
                        >
                            Avbryt
                        </button>
                    </div>
                </div>
            {:else}
                <div class="flex items-start gap-2 group/header">
                    <div class="flex-1">
                        <h1
                            class="text-[2rem] max-[480px]:text-[1.6rem] text-wine mb-0.5 tracking-tight font-bold leading-tight"
                        >
                            {night.title}
                        </h1>
                        <div class="font-accent italic text-text-light text-base">
                            {formatDate(night.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </div>
                    </div>
                    {#if !completed}
                        <button
                            onclick={startEditHeader}
                            aria-label="Rediger tittel og dato"
                            class="mt-1.5 p-1.5 rounded-lg border-none bg-transparent text-text-light cursor-pointer opacity-0 group-hover/header:opacity-100 max-[480px]:opacity-100 transition-all duration-200 hover:bg-white/60 hover:text-wine shrink-0"
                        >
                            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    {/if}
                </div>
            {/if}

        </div>

        {#if isGrape}
            <GrapeNightView {night} nightId={nightId!} {currentUser} {isAdmin} />
        {:else}
            <!-- Participant avatars -->
            {#if !isRestaurant && participants.length > 0}
                <div class="mb-5 animate-fade-in" style="animation-delay:0.08s">
                    <!-- Avatar row -->
                    <div class="flex flex-wrap gap-2 mb-2.5">
                        {#each participants as p, i}
                            <button
                                class="flex items-center gap-2 py-1.5 px-3 rounded-full border-none cursor-pointer transition-all duration-300 font-[inherit] {selectedPerson ===
                                p.name
                                    ? 'bg-white shadow-[0_2px_12px_rgba(92,26,42,0.12)] scale-105 ring-2 ring-wine/30'
                                    : 'bg-white/50 hover:bg-white/80 hover:shadow-[0_1px_6px_rgba(92,26,42,0.06)]'}"
                                onclick={() => togglePerson(p.name)}
                                style="animation-delay: {i * 0.04}s"
                            >
                                <div
                                    class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[0.6rem] font-bold tracking-wide text-white/90"
                                    style="background: {getAvatarColor(p.name)}"
                                >
                                    {getInitials(p.name)}
                                </div>
                                <span
                                    class="text-[0.8rem] font-medium {selectedPerson ===
                                    p.name
                                        ? 'text-wine'
                                        : 'text-text-light'}">{p.name}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Wine list -->
            {#if wines.length === 0}
                <div
                    class="text-center py-12 px-4 animate-rise-in"
                    style="animation-delay:0.15s"
                >
                    <div class="inline-block relative mb-4">
                        <svg
                            viewBox="0 0 80 100"
                            class="w-16 h-20 mx-auto"
                            fill="none"
                        >
                            <path
                                d="M24 8h32l-3 36c-.8 8-6 14-13 14s-12.2-6-13-14L24 8z"
                                stroke="#5c1a2a"
                                stroke-width="1.2"
                                opacity="0.15"
                            />
                            <path
                                d="M30 20h20l-1.5 18c-.5 5-3.5 9-8.5 9s-8-4-8.5-9L30 20z"
                                fill="#5c1a2a"
                                opacity="0.05"
                            />
                            <line
                                x1="40"
                                y1="58"
                                x2="40"
                                y2="78"
                                stroke="#5c1a2a"
                                stroke-width="1.2"
                                opacity="0.15"
                            />
                            <line
                                x1="30"
                                y1="78"
                                x2="50"
                                y2="78"
                                stroke="#5c1a2a"
                                stroke-width="1.2"
                                opacity="0.15"
                                stroke-linecap="round"
                            />
                        </svg>
                    </div>
                    <p class="font-accent italic text-text-light text-base">
                        Ingen viner ennå
                    </p>
                    <p class="text-text-light text-[0.82rem] mt-1 opacity-70">
                        {completed ? "Ingen viner ble lagt til" : "Legg til den første nedenfor"}
                    </p>
                </div>
            {:else}
                <!-- Section label / toggle -->
                <button
                    onclick={() => (winesOpen = !winesOpen)}
                    class="w-full flex items-center gap-3 mb-3 animate-fade-in bg-transparent border-none p-0 cursor-pointer group/toggle"
                    style="animation-delay:0.1s"
                >
                    <div class="text-[0.78rem] font-medium text-text-light uppercase tracking-wider group-hover/toggle:text-wine transition-colors duration-200">
                        {filteredWines.length}{filteredWines.length === 1 ? " vin" : " viner"}{#if !isRestaurant && selectedPerson}{" "}fra {selectedPerson}{/if}
                    </div>
                    <div class="flex-1 h-px bg-cream-dark"></div>
                    <svg
                        class="w-3.5 h-3.5 text-text-light group-hover/toggle:text-wine shrink-0 transition-all duration-300 {winesOpen ? 'rotate-0' : '-rotate-90'}"
                        viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                    >
                        <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>

                <!-- Collapsible wine list -->
                <div class="grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] {winesOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
                    <div class="overflow-hidden">
                        <div class="flex flex-col gap-3 mb-8">
                            {#each filteredWines as wine, i (wine.id)}
                                <WineCard
                                    {wine}
                                    isEditing={editingWineId === wine.id}
                                    {completed}
                                    {isPastEvent}
                                    onEdit={startEdit}
                                    onDelete={handleDelete}
                                    index={i}
                                    {currentUser}
                                    onRate={handleRate}
                                    hidePersonField={isRestaurant}
                                />
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Results podium -->
            {#if completed && wines.length > 0}
                <WineResults {wines} />
            {/if}

            <!-- Form -->
            <div
                class="h-px bg-cream-dark mb-6 animate-fade-in"
                style="animation-delay:0.2s"
            ></div>

            {#if completed}
                <div class="text-center py-8 animate-fade-in">
                    <p class="font-accent italic text-text-light text-base mb-1">
                        Vinkvelden er fullført
                    </p>
                    <p class="text-text-light text-[0.82rem] opacity-70">
                        Ingen flere viner kan legges til
                    </p>
                </div>
            {:else}
                <div
                    bind:this={formElement}
                    class="animate-rise-in"
                    style="animation-delay:0.25s"
                >
                    {#key editingWineId}
                        <WineForm
                            editing={editingWine}
                            {currentUser}
                            onSubmit={editingWine ? handleEdit : handleAdd}
                            onCancel={() => (editingWineId = null)}
                            onPersonChange={(name) => (currentUser = name)}
                            hidePersonField={isRestaurant}
                        />
                    {/key}
                </div>
            {/if}
        {/if}
    </div>

    <CopiedToast visible={toastVisible} />

    <!-- Profile popover (fixed, outside all stacking contexts) -->
    {#if profileOpen}
        <div
            class="fixed inset-0 z-40"
            onclick={() => (profileOpen = false)}
            aria-hidden="true"
        ></div>
        <div
            class="fixed z-50 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(92,26,42,0.12),0_2px_8px_rgba(92,26,42,0.06)] border border-cream-dark/60 animate-fade-in overflow-hidden"
            style="top: {popoverTop}px; right: {popoverRight}px;"
        >
            <!-- Arrow notch -->
            <div class="absolute -top-1.5 right-2.5 w-3 h-3 bg-white/95 border-l border-t border-cream-dark/60 rotate-45"></div>

            <div class="px-4 pt-4 pb-3.5">
                <p class="text-[0.75rem] text-text-light/60 font-accent italic mb-3 tracking-wide">Hvem er du?</p>

                {#if participants.length > 0}
                    <div class="flex flex-wrap gap-1.5 mb-3">
                        {#each participants as p}
                            <button
                                onclick={() => handleClaimParticipant(p.name)}
                                class="flex items-center gap-1.5 py-1 px-2.5 rounded-full border-none cursor-pointer transition-all duration-150 font-[inherit] {currentUser === p.name ? 'bg-wine/10 ring-1 ring-wine/30' : 'bg-cream/60 hover:bg-white hover:shadow-[0_1px_6px_rgba(92,26,42,0.1)]'}"
                            >
                                <div
                                    class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[0.5rem] font-bold tracking-wide text-white/90"
                                    style="background: {getAvatarColor(p.name)}"
                                >
                                    {getInitials(p.name)}
                                </div>
                                <span class="text-[0.75rem] font-medium {currentUser === p.name ? 'text-wine' : 'text-text-light'}">{p.name}</span>
                            </button>
                        {/each}
                    </div>
                    <div class="flex items-center gap-2 text-[0.68rem] text-text-light/35 my-2.5">
                        <div class="flex-1 h-px bg-cream-dark"></div>
                        eller
                        <div class="flex-1 h-px bg-cream-dark"></div>
                    </div>
                {/if}

                <div class="flex gap-2">
                    <input
                        type="text"
                        placeholder="Annet navn..."
                        bind:value={raterNameInput}
                        onkeydown={(e) => e.key === 'Enter' && handleRaterNameSubmit()}
                        class="flex-1 py-1.5 px-2.5 border-[1.5px] border-cream-dark rounded-lg text-[0.8rem] font-[inherit] bg-cream/50 focus:outline-none focus:border-wine-light focus:bg-white transition-all duration-200"
                    />
                    <button
                        onclick={handleRaterNameSubmit}
                        class="px-3 py-1.5 border-none rounded-lg text-[0.8rem] font-semibold font-[inherit] cursor-pointer bg-wine text-white hover:bg-wine-dark transition-all duration-200 active:scale-[0.97]"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    {/if}
{/if}
