export function getAvatarColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = ((hash % 360) + 360) % 360;
	return `hsl(${hue}, 40%, 35%)`;
}

export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function normalizeSafeUrl(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? "";
	if (!trimmed) return "";

	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
	} catch {
		return "";
	}
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString("nb-NO", options ?? { day: "numeric", month: "long", year: "numeric" });
}

export function sortByGrapeServingOrder<T extends { id: string }>(
	items: T[],
	order: Record<string, number> | undefined,
): T[] {
	const orderMap = order ?? {};
	const fallback = new Map(items.map((item, i) => [item.id, i]));
	return [...items].sort((a, b) => {
		const ao = orderMap[a.id];
		const bo = orderMap[b.id];
		if (ao != null && bo != null) return ao - bo;
		if (ao != null) return -1;
		if (bo != null) return 1;
		return (fallback.get(a.id) ?? 0) - (fallback.get(b.id) ?? 0);
	});
}
