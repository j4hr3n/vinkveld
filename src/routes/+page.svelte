<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { createNight } from "$lib/firebase";

    let title = $state("");
    let date = $state(new Date().toISOString().split("T")[0]);
    let creating = $state(false);

    let titleInput = $state<HTMLInputElement | null>(null);

    async function handleCreate() {
        if (!title.trim()) {
            titleInput?.focus();
            return;
        }
        creating = true;
        const id = await createNight(title.trim(), date);
        goto(`${base}/${id}`);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handleCreate();
    }
</script>

<svelte:head>
    <title>Vinkveld</title>
</svelte:head>

<div class="text-center pt-16">
    <h1 class="text-5xl max-[480px]:text-[2.2rem] text-wine mb-1">Vinkveld</h1>
    <p class="text-text-light mb-12 text-lg">Planlegg vinkveldens lineup</p>
    <div
        class="bg-white rounded-xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-left"
    >
        <h2 class="text-[1.3rem] text-wine mb-6">Ny vinkveld</h2>
        <div class="mb-5">
            <label
                for="title"
                class="block text-[0.85rem] font-medium text-text-light mb-1.5"
                >Tittel</label
            >
            <input
                type="text"
                id="title"
                placeholder="f.eks. Vinkveld hos Christoffer"
                bind:value={title}
                bind:this={titleInput}
                onkeydown={handleKeydown}
                class="w-full py-[0.7rem] px-[0.9rem] border-[1.5px] border-cream-dark rounded-lg text-base font-[inherit] transition-colors duration-200 bg-cream focus:outline-none focus:border-wine-light"
            />
        </div>
        <div class="mb-5">
            <label
                for="date"
                class="block text-[0.85rem] font-medium text-text-light mb-1.5"
                >Dato</label
            >
            <input
                type="date"
                id="date"
                bind:value={date}
                class="w-full py-[0.7rem] px-[0.9rem] border-[1.5px] border-cream-dark rounded-lg text-base font-[inherit] transition-colors duration-200 bg-cream focus:outline-none focus:border-wine-light"
            />
        </div>
        <button
            class="inline-flex items-center justify-center gap-2 py-3 px-6 border-none rounded-lg text-base font-semibold font-[inherit] cursor-pointer transition-all duration-200 bg-wine text-white w-full hover:bg-wine-dark"
            onclick={handleCreate}
            disabled={creating}
        >
            {creating ? "Oppretter..." : "Opprett vinkveld"}
        </button>
    </div>
</div>
