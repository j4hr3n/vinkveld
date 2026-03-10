<script lang="ts">
	import { searchWines, type WineSuggestion } from "$lib/vivinoSearch";

	let {
		value = $bindable(""),
		onSelect,
		id = "",
		placeholder = "",
		inputClass = "",
		onkeydown,
		inputRef = $bindable<HTMLInputElement | null>(null),
	}: {
		value: string;
		onSelect?: (suggestion: WineSuggestion) => void;
		id?: string;
		placeholder?: string;
		inputClass?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		inputRef?: HTMLInputElement | null;
	} = $props();

	let suggestions = $state<WineSuggestion[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let activeIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let container = $state<HTMLDivElement | null>(null);

	function handleInput() {
		clearTimeout(debounceTimer);
		activeIndex = -1;

		if (value.trim().length < 2) {
			suggestions = [];
			open = false;
			return;
		}

		loading = true;
		open = true;
		debounceTimer = setTimeout(async () => {
			const query = value.trim();
			const results = await searchWines(query);
			suggestions = results;
			loading = false;
		}, 250);
	}

	function select(s: WineSuggestion) {
		onSelect?.(s);
		open = false;
		suggestions = [];
		activeIndex = -1;
	}

	function handleKeydownInternal(e: KeyboardEvent) {
		if (open && suggestions.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				activeIndex = (activeIndex + 1) % suggestions.length;
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
				return;
			}
			if (e.key === "Enter" && activeIndex >= 0) {
				e.preventDefault();
				e.stopPropagation();
				select(suggestions[activeIndex]);
				return;
			}
		}
		if (e.key === "Escape" && open) {
			e.preventDefault();
			open = false;
			return;
		}
		onkeydown?.(e);
	}

	function handleClickOutside(e: MouseEvent) {
		if (container && !container.contains(e.target as Node)) {
			open = false;
		}
	}

	function formatRating(rating: number | undefined): string {
		return rating != null ? rating.toFixed(1) : "";
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="relative" bind:this={container}>
	<input
		type="text"
		{id}
		{placeholder}
		bind:value
		bind:this={inputRef}
		oninput={handleInput}
		onkeydown={handleKeydownInternal}
		onfocus={() => {
			if (suggestions.length > 0) open = true;
		}}
		class={inputClass}
		autocomplete="off"
	/>

	{#if open && (loading || suggestions.length > 0)}
		<div
			class="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-cream-dark bg-white shadow-lg overflow-hidden"
		>
			{#if loading && suggestions.length === 0}
				<div class="px-4 py-3 text-sm text-text-light text-center">Søker...</div>
			{/if}

			{#each suggestions as s, i}
				<button
					type="button"
					class="w-full text-left px-4 py-2.5 cursor-pointer transition-colors duration-100 border-none bg-transparent font-[inherit] {i ===
					activeIndex
						? 'bg-cream/80'
						: 'hover:bg-cream/50'}"
					onmouseenter={() => (activeIndex = i)}
					onclick={() => select(s)}
				>
					<div class="text-sm font-medium text-wine-dark truncate">
						{#if s.winery}{s.winery} &middot; {/if}{s.name}
					</div>
					<div class="text-xs text-text-light truncate">
						{#if s.region}{s.region}{/if}
						{#if s.vintage}{s.region ? " · " : ""}{s.vintage}{/if}
						{#if s.rating}{s.region || s.vintage ? " · " : ""}★ {formatRating(s.rating)}{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
