<script lang="ts">
    import {
        disableAdmin,
        enableAdmin,
        hasAdminCodeConfigured,
    } from "$lib/admin";

    let {
        active = false,
        onChange,
    }: {
        active?: boolean;
        onChange?: (active: boolean) => void;
    } = $props();

    let open = $state(false);
    let code = $state("");
    let error = $state("");

    function submit() {
        error = "";
        if (enableAdmin(code)) {
            code = "";
            open = false;
            onChange?.(true);
            return;
        }
        error = hasAdminCodeConfigured
            ? "Feil adminkode"
            : "Adminkode mangler i miljøet";
    }

    function turnOff() {
        disableAdmin();
        code = "";
        error = "";
        open = false;
        onChange?.(false);
    }
</script>

<div class="mt-10 flex justify-center animate-fade-in">
    {#if active}
        <div
            class="inline-flex items-center gap-2 rounded-full border border-wine-light/30 bg-white/70 px-3 py-1.5 text-[0.78rem] text-wine shadow-[0_2px_10px_rgba(92,26,42,0.05)]"
        >
            <span class="font-medium">Adminmodus</span>
            <button
                type="button"
                onclick={turnOff}
                class="rounded-full border-none bg-wine/8 px-2 py-0.5 text-[0.72rem] font-medium font-[inherit] text-wine/75 cursor-pointer transition-colors duration-200 hover:bg-wine/12 hover:text-wine"
            >
                Slå av
            </button>
        </div>
    {:else if open}
        <div
            class="w-full max-w-xs rounded-xl border border-cream-dark/60 bg-white/80 p-3 shadow-[0_4px_18px_rgba(92,26,42,0.06)]"
        >
            <div class="flex gap-2">
                <input
                    type="password"
                    placeholder="Adminkode"
                    bind:value={code}
                    onkeydown={(e) => e.key === "Enter" && submit()}
                    class="min-w-0 flex-1 rounded-lg border-[1.5px] border-cream-dark bg-cream/50 px-3 py-2 text-sm font-[inherit] transition-all duration-200 focus:outline-none focus:border-wine-light focus:bg-white"
                />
                <button
                    type="button"
                    onclick={submit}
                    class="rounded-lg border-none bg-wine px-3 py-2 text-sm font-semibold font-[inherit] text-white cursor-pointer transition-colors duration-200 hover:bg-wine-dark disabled:opacity-50"
                    disabled={!code.trim()}
                >
                    OK
                </button>
            </div>
            {#if error}
                <div class="mt-2 text-[0.75rem] text-red-700">{error}</div>
            {/if}
            <button
                type="button"
                onclick={() => {
                    open = false;
                    error = "";
                    code = "";
                }}
                class="mt-2 border-none bg-transparent p-0 text-[0.72rem] font-[inherit] text-text-light/60 cursor-pointer hover:text-wine"
            >
                Lukk
            </button>
        </div>
    {:else}
        <button
            type="button"
            onclick={() => (open = true)}
            aria-label="Åpne adminmodus"
            title="Adminmodus"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cream-dark/50 bg-white/35 text-text-light/35 cursor-pointer transition-all duration-200 hover:border-wine-light/50 hover:bg-white/70 hover:text-wine/70"
        >
            <svg
                class="h-3.5 w-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path
                    d="M8 1.5l1.85 3.75L14 5.9l-3 2.92.7 4.1L8 11l-3.7 1.92.7-4.1-3-2.92 4.15-.65z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </button>
    {/if}
</div>
