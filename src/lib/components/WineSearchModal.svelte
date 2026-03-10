<script lang="ts">
	import { searchWines, type WineSuggestion } from "$lib/vivinoSearch";
	import { stripeColors } from "$lib/colors";
	let {
		open = $bindable(false),
		onSelect,
	}: {
		open: boolean;
		onSelect: (suggestion: WineSuggestion) => void;
	} = $props();

	// Portal action: moves element to document.body to escape any
	// ancestor overflow/transform/backdrop-blur containing blocks
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	let query = $state("");
	let suggestions = $state<WineSuggestion[]>([]);
	let loading = $state(false);
	let searched = $state(false);
	let activeIndex = $state(-1);
	let searchInput = $state<HTMLInputElement | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const TYPE_COLORS: Record<number, string> = {
		1: "red",
		2: "white",
		3: "bubbles",
		4: "rosé",
		7: "white",
	};

	function handleInput() {
		clearTimeout(debounceTimer);
		activeIndex = -1;

		if (query.trim().length < 2) {
			suggestions = [];
			searched = false;
			loading = false;
			return;
		}

		loading = true;
		debounceTimer = setTimeout(async () => {
			const q = query.trim();
			const results = await searchWines(q);
			suggestions = results;
			loading = false;
			searched = true;
		}, 250);
	}

	function select(s: WineSuggestion) {
		onSelect(s);
		close();
	}

	function close() {
		open = false;
		query = "";
		suggestions = [];
		searched = false;
		activeIndex = -1;
		loading = false;
		clearTimeout(debounceTimer);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			close();
			return;
		}
		if (suggestions.length > 0) {
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
				select(suggestions[activeIndex]);
				return;
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	function formatRating(rating: number | undefined): string {
		return rating != null ? rating.toFixed(1) : "";
	}

	function getColorForType(typeId: number | undefined): string {
		if (typeId == null) return "#999";
		const color = TYPE_COLORS[typeId];
		return color ? (stripeColors[color] ?? "#999") : "#999";
	}

	$effect(() => {
		if (open) {
			// Focus input after mount animation
			setTimeout(() => searchInput?.focus(), 50);
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		use:portal
		class="fixed inset-0 z-[100] flex items-start justify-center"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-wine-dark/40 backdrop-blur-sm animate-fade-in"></div>

		<!-- Modal -->
		<div
			class="relative w-full max-w-lg mx-4 mt-[12vh] max-[480px]:mt-[6vh] bg-cream rounded-2xl shadow-[0_24px_80px_rgba(61,15,26,0.25)] border border-cream-dark/60 overflow-hidden animate-modal-in"
		>
			<!-- Header -->
			<div class="relative px-6 pt-6 pb-4 max-[480px]:px-4 max-[480px]:pt-5">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg text-wine font-semibold font-serif m-0">Finn vin</h2>
					<button
						class="w-8 h-8 flex items-center justify-center rounded-lg border-none bg-transparent text-text-light cursor-pointer transition-all duration-200 hover:bg-wine/8 hover:text-wine"
						onclick={close}
					>
						<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
						</svg>
					</button>
				</div>

				<!-- Search input -->
				<div class="relative">
					<svg
						class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-light/60 pointer-events-none"
						viewBox="0 0 18 18"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<circle cx="7.5" cy="7.5" r="5.5" />
						<path d="M12 12l4 4" stroke-linecap="round" />
					</svg>
					<input
						type="text"
						bind:value={query}
						bind:this={searchInput}
						oninput={handleInput}
						placeholder="Søk etter vin, f.eks. Barolo 2019"
						class="w-full py-3.5 pl-11 pr-4 border-[1.5px] border-cream-dark rounded-xl text-base font-[inherit] transition-all duration-300 bg-white/80 focus:outline-none focus:border-wine-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,26,42,0.06)]"
						autocomplete="off"
					/>
				</div>
			</div>

			<!-- Results -->
			<div class="max-h-[50vh] max-[480px]:max-h-[55vh] overflow-y-auto overscroll-contain px-3 pb-3 max-[480px]:px-2 max-[480px]:pb-2">
				{#if loading && suggestions.length === 0}
					<div class="flex items-center justify-center gap-2 py-8 text-text-light text-sm">
						<div class="w-4 h-4 border-2 border-wine/20 border-t-wine rounded-full animate-spin"></div>
						Søker...
					</div>
				{:else if searched && suggestions.length === 0}
					<div class="text-center py-8 text-text-light">
						<div class="text-2xl mb-2 opacity-40">🍷</div>
						<div class="text-sm">Ingen treff for &laquo;{query}&raquo;</div>
					</div>
				{:else if suggestions.length > 0}
					<div class="flex flex-col gap-1.5">
						{#each suggestions as s, i}
							<button
								type="button"
								class="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 border-none font-[inherit] flex items-start gap-3.5 {i === activeIndex ? 'bg-white shadow-[0_2px_12px_rgba(92,26,42,0.08)]' : 'bg-transparent hover:bg-white/70'}"
								onmouseenter={() => (activeIndex = i)}
								onclick={() => select(s)}
							>
								<!-- Color dot -->
								<div
									class="w-3 h-3 rounded-full mt-1 shrink-0 ring-2 ring-white/80"
									style="background: {getColorForType(s.typeId)}"
								></div>

								<div class="flex-1 min-w-0">
									<!-- Wine name row -->
									<div class="font-semibold text-[0.92rem] text-wine-dark leading-snug">
										{#if s.winery}
											<span class="text-text-light font-normal">{s.winery}</span>
											<span class="text-cream-dark mx-1">&middot;</span>
										{/if}
										{s.name}
									</div>

									<!-- Details row -->
									<div class="flex items-center gap-1.5 mt-1 text-[0.8rem] text-text-light flex-wrap">
										{#if s.region}
											<span>{s.region}</span>
										{/if}
										{#if s.vintage}
											{#if s.region}<span class="text-cream-dark">&middot;</span>{/if}
											<span class="font-medium text-text">{s.vintage}</span>
										{/if}
										{#if s.rating}
											{#if s.region || s.vintage}<span class="text-cream-dark">&middot;</span>{/if}
											<span class="text-gold font-medium">★ {formatRating(s.rating)}</span>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Empty state hint -->
					<div class="text-center py-8 text-text-light text-sm opacity-70 font-accent italic">
						Skriv for å søke blant tusenvis av viner
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes modal-in {
		from {
			opacity: 0;
			transform: translateY(-12px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.animate-modal-in {
		animation: modal-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
</style>
