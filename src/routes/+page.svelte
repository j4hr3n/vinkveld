<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { createNight } from "$lib/firebase";
    import ErrorToast from "$lib/components/ErrorToast.svelte";

    let title = $state("");
    let date = $state(new Date().toISOString().split("T")[0]);
    let creating = $state(false);
    let errorMessage = $state("");
    let errorVisible = $state(false);
    let errorTimeout: ReturnType<typeof setTimeout> | undefined;

    let titleInput = $state<HTMLInputElement | null>(null);

    function showError(message: string) {
        clearTimeout(errorTimeout);
        errorMessage = message;
        errorVisible = true;
        errorTimeout = setTimeout(() => {
            errorVisible = false;
        }, 3000);
    }

    async function handleCreate() {
        if (!title.trim()) {
            titleInput?.focus();
            return;
        }
        creating = true;
        try {
            const id = await createNight(title.trim(), date);
            goto(`${base}/${id}`);
        } catch {
            showError("Kunne ikke opprette vinkvelden");
            creating = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handleCreate();
    }
</script>

<svelte:head>
    <title>Vinkveld</title>
</svelte:head>

<div class="text-center pt-12 animate-slide-down">
    <div class="text-6xl mb-5">🍷</div>
    <h1 class="text-5xl max-[480px]:text-[2.4rem] text-wine mb-2 tracking-tight font-bold">
        Vinkveld
    </h1>
    <p class="font-accent italic text-text-light text-xl mb-14 tracking-wide">
        Planlegg vinkveldens lineup
    </p>
</div>

<div
    class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-[480px]:p-6 shadow-[0_4px_24px_rgba(92,26,42,0.06)] border border-cream-dark/60 text-left animate-rise-in"
    style="animation-delay: 0.15s"
>
    <h2 class="text-xl text-wine mb-6 font-semibold">Ny vinkveld</h2>

    <div class="mb-5">
        <label
            for="title"
            class="block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider"
            >Tittel</label
        >
        <input
            type="text"
            id="title"
            placeholder="f.eks. Vinkveld hos Christoffer"
            bind:value={title}
            bind:this={titleInput}
            onkeydown={handleKeydown}
            class="w-full py-3 px-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]"
        />
    </div>
    <div class="mb-7">
        <label
            for="date"
            class="block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider"
            >Dato</label
        >
        <input
            type="date"
            id="date"
            bind:value={date}
            class="w-full py-3 px-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-cream/60 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]"
        />
    </div>
    <button
        class="w-full py-3.5 px-6 border-none rounded-xl text-base font-semibold font-[inherit] cursor-pointer transition-all duration-300 bg-wine text-white hover:bg-wine-dark hover:shadow-[0_4px_16px_rgba(92,26,42,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        onclick={handleCreate}
        disabled={creating}
    >
        {creating ? "Oppretter..." : "Opprett vinkveld"}
    </button>
</div>

<ErrorToast message={errorMessage} visible={errorVisible} />
