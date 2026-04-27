<script lang="ts">
    import { page } from "$app/state";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import {
        subscribeToNight,
        subscribeToGrapePrivateData,
        type GrapePrivateData,
        type WineNight,
    } from "$lib/firebase";
    import { getGrapeById } from "$lib/grapes";
    import {
        getInitials,
        getAvatarColor,
        normalizeSafeUrl,
        formatDate,
        sortByGrapeServingOrder,
    } from "$lib/utils";
    import { stripeColors } from "$lib/colors";
    import { isAdminEnabled, onAdminChange } from "$lib/admin";

    let nightId = $derived(page.params.nightId);
    let night = $state<WineNight | null | undefined>(undefined);
    let isAdmin = $state(false);
    let privateGrapeData = $state<GrapePrivateData>({});
    let now = $state(new Date());

    onMount(() => {
        isAdmin = isAdminEnabled();
        const id = nightId;
        if (!id) return;
        const unsubNight = subscribeToNight(id, (data) => {
            night = data;
        });
        const unsubAdmin = onAdminChange((active) => {
            isAdmin = active;
        });
        return () => {
            unsubNight();
            unsubAdmin();
        };
    });

    // Tick `now` only while a future scheduled reveal is still pending.
    $effect(() => {
        if (night?.revealed === true) return;
        if (!night?.revealTime) return;
        const interval = setInterval(() => {
            now = new Date();
        }, 30_000);
        return () => clearInterval(interval);
    });

    let usePrivateGrapeData = $derived(night?.grapeDataVersion === 2);

    let scheduledReveal = $derived.by(() => {
        if (!night?.revealTime || !night?.date) return false;
        const revealAt = new Date(`${night.date}T${night.revealTime}`);
        return now >= revealAt;
    });

    let isRevealed = $derived(
        night?.revealed === true ||
            (night?.revealed !== false && scheduledReveal),
    );

    // Mirror GrapeNightView: admin always reads from private; non-admin reads
    // private only as a fallback when revealed but the public mirror is empty.
    $effect(() => {
        privateGrapeData = {};
        if (!nightId || !usePrivateGrapeData) return;
        const hasPublicPairs = Object.keys(night?.pairs ?? {}).length > 0;
        if (isAdmin || (isRevealed && !hasPublicPairs)) {
            return subscribeToGrapePrivateData(nightId, (data) => {
                privateGrapeData = data;
            });
        }
    });

    let effectivePairs = $derived(
        usePrivateGrapeData
            ? (privateGrapeData.pairs ?? night?.pairs ?? {})
            : (night?.pairs ?? {}),
    );
    let effectiveAssignments = $derived(
        usePrivateGrapeData
            ? (privateGrapeData.grapeAssignments ??
                  night?.grapeAssignments ?? {})
            : (night?.grapeAssignments ?? {}),
    );
    let effectiveRegistrations = $derived(
        usePrivateGrapeData
            ? (privateGrapeData.registrations ?? night?.registrations ?? {})
            : (night?.registrations ?? {}),
    );

    let pairsList = $derived(
        Object.entries(effectivePairs).map(([id, p]) => ({ id, ...p })),
    );

    let orderedPairs = $derived(
        sortByGrapeServingOrder(pairsList, night?.grapeServingOrder),
    );

    let canSeeProgram = $derived(isAdmin || isRevealed);

    function toRoman(n: number): string {
        if (n <= 0) return String(n);
        const map: [number, string][] = [
            [50, "L"],
            [40, "XL"],
            [10, "X"],
            [9, "IX"],
            [5, "V"],
            [4, "IV"],
            [1, "I"],
        ];
        let result = "";
        let num = n;
        for (const [val, sym] of map) {
            while (num >= val) {
                result += sym;
                num -= val;
            }
        }
        return result;
    }

    const courseCountLabels: Record<number, string> = {
        1: "Én rett",
        2: "To retter",
        3: "Tre retter",
        4: "Fire retter",
        5: "Fem retter",
        6: "Seks retter",
        7: "Syv retter",
        8: "Åtte retter",
        9: "Ni retter",
        10: "Ti retter",
        11: "Elleve retter",
        12: "Tolv retter",
    };

    function courseCountLabel(n: number): string {
        return courseCountLabels[n] ?? `${n} retter`;
    }

    let dateLabel = $derived(
        night
            ? formatDate(night.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : "",
    );
</script>

<svelte:head>
    <title>{night?.title ?? "Program"} — Drueaften</title>
</svelte:head>

{#if night === undefined}
    <div class="text-center pt-32 animate-fade-in">
        <p class="font-accent italic text-text-light text-lg">
            Henter program…
        </p>
    </div>
{:else if night === null}
    <div class="text-center pt-20 animate-fade-in">
        <h1 class="text-wine text-2xl mb-3">Fant ikke kvelden</h1>
        <a
            href="{base}/"
            class="inline-flex items-center gap-2 text-wine font-medium no-underline border-b border-dashed border-wine-light pb-0.5 hover:border-solid transition-all duration-200"
        >
            Lag en ny vinkveld
        </a>
    </div>
{:else if !canSeeProgram}
    <!-- Polite pre-reveal placeholder for non-admins -->
    <article class="program pt-12 md:pt-20 pb-24 animate-fade-in">
        <p
            class="text-[0.7rem] tracking-[0.32em] uppercase text-text-light/70 mb-5"
        >
            Drueaften
        </p>
        <h1
            class="font-serif text-[2.5rem] sm:text-[3.25rem] md:text-[3.75rem] leading-[1.04] text-wine font-light tracking-tight mb-3"
        >
            {night.title}
        </h1>
        <p
            class="font-accent italic text-text-light text-lg md:text-xl mb-10"
        >
            {dateLabel}
        </p>
        <div class="h-px bg-gold/40 w-12 mb-10"></div>
        <p
            class="font-accent italic text-text-light text-xl md:text-2xl leading-relaxed max-w-md"
        >
            Programmet avsløres i løpet av kvelden.
        </p>
        <p class="text-text-light/70 text-sm md:text-base mt-2">
            Kom tilbake hit når kvelden begynner.
        </p>

        <div class="mt-16">
            <a
                href="{base}/{nightId}"
                class="inline-flex items-center gap-2 text-text-light text-sm no-underline hover:text-wine transition-colors duration-200"
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
                Tilbake til kvelden
            </a>
        </div>
    </article>
{:else}
    <article class="program pb-20 md:pb-28">
        <!-- Hero -->
        <header class="pt-8 md:pt-16 pb-14 md:pb-20 animate-rise-in">
            <p
                class="text-[0.7rem] tracking-[0.32em] uppercase text-text-light/70 mb-4 md:mb-6"
            >
                Drueaften{#if isAdmin && !isRevealed}<span
                        class="ml-3 text-gold/80 normal-case tracking-wider"
                    >
                        · Forhåndsvisning</span
                    >{/if}
        </p>
            <h1
                class="font-serif text-[2.75rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1.02] text-wine font-light tracking-tight mb-4 md:mb-5"
            >
                {night.title}
            </h1>
            <p class="font-accent italic text-text-light text-lg md:text-2xl">
                {dateLabel}
            </p>
            {#if orderedPairs.length > 0}
                <div class="flex items-center gap-4 mt-8 md:mt-10">
                    <div class="h-px bg-gold/50 w-12 md:w-16"></div>
                    <p
                        class="text-[0.78rem] md:text-sm text-text-light tracking-wide"
                    >
                        {courseCountLabel(orderedPairs.length)}
                    </p>
                </div>
            {/if}
        </header>

        <!-- Courses -->
        {#each orderedPairs as pair, i (pair.id)}
            {@const grape = getGrapeById(effectiveAssignments[pair.id])}
            {@const reg = effectiveRegistrations[pair.id]}
            {@const safeWineLink = normalizeSafeUrl(reg?.wineLink)}
            {@const stripe = reg?.wineColor
                ? stripeColors[reg.wineColor]
                : null}
            <section
                class="course relative pt-2 pb-2 animate-rise-in"
                style="animation-delay: {0.1 + i * 0.06}s"
            >
                <div class="h-px bg-cream-dark mb-9 md:mb-12"></div>

                <div
                    class="flex flex-col md:flex-row md:items-start gap-4 md:gap-10"
                >
                    <!-- Roman numeral -->
                    <div
                        class="numeral font-serif text-[3.25rem] md:text-[5rem] leading-none text-wine font-light shrink-0 md:w-28 md:text-right md:pt-1.5"
                        aria-hidden="true"
                    >
                        {toRoman(i + 1)}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <!-- Member credit -->
                        <p
                            class="text-[0.7rem] tracking-[0.28em] uppercase text-text-light/70 mb-5 flex items-baseline gap-2 flex-wrap"
                        >
                            <span class="text-text-light/55">Servert av</span>
                            <span
                                class="inline-flex items-center gap-2 flex-wrap normal-case tracking-normal"
                            >
                                {#each pair.memberNames as name, mi}
                                    <span
                                        class="inline-flex items-center gap-1.5 text-[0.85rem] text-text"
                                    >
                                        <span
                                            class="w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold tracking-wide text-white/90"
                                            style="background: {getAvatarColor(
                                                name,
                                            )}"
                                        >
                                            {getInitials(name)}
                                        </span>
                                        {name}
                                    </span>
                                    {#if mi < pair.memberNames.length - 1}
                                        <span class="text-text-light/40"
                                            >·</span
                                        >
                                    {/if}
                                {/each}
                            </span>
                        </p>

                        {#if reg}
                            {#if grape}
                                <p
                                    class="text-[0.72rem] md:text-[0.78rem] tracking-[0.28em] uppercase text-text-light/85 mb-3"
                                >
                                    <span class="text-gold">Drue</span>
                                    <span class="text-text-light/40 mx-2"
                                        >—</span
                                    >
                                    {grape.name}
                                </p>
                            {/if}

                            <!-- Wine -->
                            <div
                                class="flex items-stretch gap-3 md:gap-4 mb-7 md:mb-9"
                            >
                                {#if stripe}
                                    <div
                                        class="w-[3px] rounded-full mt-2 mb-1 shrink-0"
                                        style="background: {stripe}"
                                    ></div>
                                {/if}
                                <div class="min-w-0">
                                    {#if safeWineLink}
                                        <a
                                            href={safeWineLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="font-serif text-[1.5rem] md:text-[2rem] leading-[1.15] text-wine font-light tracking-tight hover:underline decoration-gold/40 decoration-1 underline-offset-[6px] break-words"
                                        >
                                            {reg.wineName}
                                        </a>
                                    {:else}
                                        <p
                                            class="font-serif text-[1.5rem] md:text-[2rem] leading-[1.15] text-wine font-light tracking-tight break-words"
                                        >
                                            {reg.wineName}
                                        </p>
                                    {/if}
                                </div>
                            </div>

                            <!-- Dish -->
                            <div>
                                <p
                                    class="text-[0.7rem] tracking-[0.28em] uppercase text-text-light/70 mb-2"
                                >
                                    Rett
                                </p>
                                <p
                                    class="text-text font-medium text-[1rem] md:text-[1.1rem] leading-snug mb-1.5"
                                >
                                    {reg.dishName}
                                </p>
                                {#if reg.dishDescription}
                                    <p
                                        class="font-accent italic text-text-light text-base md:text-lg leading-relaxed"
                                    >
                                        {reg.dishDescription}
                                    </p>
                                {/if}
                            </div>
                        {:else}
                            <!-- Pair has no registration yet -->
                            {#if grape}
                                <p
                                    class="text-[0.72rem] tracking-[0.28em] uppercase text-text-light/55 mb-2"
                                >
                                    <span class="text-gold/70">Drue</span>
                                    <span class="text-text-light/35 mx-2"
                                        >—</span
                                    >
                                    {grape.name}
                                </p>
                            {/if}
                            <p
                                class="font-accent italic text-text-light/65 text-base md:text-lg leading-relaxed"
                            >
                                Ikke registrert ennå
                            </p>
                        {/if}
                    </div>
                </div>
            </section>
        {/each}

        {#if orderedPairs.length === 0}
            <section class="pt-12 pb-12 animate-fade-in">
                <div class="h-px bg-cream-dark mb-12"></div>
                <p
                    class="font-accent italic text-text-light text-xl text-center"
                >
                    Ingen lag er klare ennå.
                </p>
            </section>
        {/if}

        <!-- Footer -->
        {#if orderedPairs.length > 0}
            <footer
                class="footer pt-16 md:pt-24 animate-fade-in"
                style="animation-delay: 0.4s"
            >
                <div class="h-px bg-cream-dark mb-14"></div>
                <p
                    class="font-serif text-[2.25rem] md:text-[2.75rem] italic text-wine text-center font-light tracking-tight mb-2"
                >
                    Skål!
                </p>
                <div class="h-px bg-gold/40 w-12 mx-auto mb-12"></div>
                <div class="text-center">
                    <a
                        href="{base}/{nightId}"
                        class="inline-flex items-center gap-2 text-text-light text-sm no-underline hover:text-wine transition-colors duration-200"
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
                        Tilbake til kvelden
                    </a>
                    {#if isAdmin && !isRevealed}
                        <p
                            class="text-[0.7rem] text-gold/70 tracking-[0.2em] uppercase mt-4"
                        >
                            Forhåndsvisning · synlig kun for admin
                        </p>
                    {/if}
                </div>
            </footer>
        {/if}
    </article>
{/if}

<style>
    .numeral {
        letter-spacing: -0.04em;
        font-feature-settings: "lnum" 1;
    }

    /* Print: turn the page into a clean letterpress menu */
    @media print {
        :global(body) {
            background: white !important;
        }
        :global(body::before) {
            display: none !important;
        }
        :global(.max-w-\[620px\]) {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            max-width: 100% !important;
        }
        .program {
            padding-top: 1rem !important;
            padding-bottom: 0 !important;
        }
        .course {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .footer {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        :global(a) {
            text-decoration: none !important;
            color: inherit !important;
        }
        :global(.animate-rise-in),
        :global(.animate-fade-in) {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
        }
    }
</style>
