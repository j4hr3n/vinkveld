const STORAGE_KEY = 'vinkveld-history';
const MAX_ENTRIES = 20;

export interface HistoryEntry {
	nightId: string;
	title: string;
	date: string;
	visitedAt: string;
}

export function getHistory(): HistoryEntry[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const entries: HistoryEntry[] = JSON.parse(raw);
		return entries.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
	} catch {
		return [];
	}
}

export function addToHistory(nightId: string, title: string, date: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const entries = getHistory();
		const existing = entries.findIndex((e) => e.nightId === nightId);
		if (existing !== -1) {
			entries.splice(existing, 1);
		}
		entries.unshift({ nightId, title, date, visitedAt: new Date().toISOString() });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
	} catch {
		// ignore storage errors
	}
}
