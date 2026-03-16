export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString("nb-NO", options ?? { day: "numeric", month: "long", year: "numeric" });
}
