export interface WineSuggestion {
	name: string;
	vintage?: number;
	winery?: string;
	region?: string;
	rating?: number;
	typeId?: number;
}

const ALGOLIA_APP_ID = "9TAKGWJUXL";
const ALGOLIA_SEARCH_KEY = "60c11b2f1068885161d95ca068d3a6ae";
const ALGOLIA_INDEX = "WINES_prod";
const ENDPOINT = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

interface AlgoliaHit {
	name: string;
	vintages?: {
		year: string;
		statistics?: { ratings_count: number; ratings_average: number };
	}[];
	type_id?: number;
	region?: { name: string };
	winery?: { name: string };
	statistics?: { ratings_average: number };
}

const MIN_RATINGS = 50;
const MAX_SUGGESTIONS = 8;
const MAX_VINTAGES_PER_HIT = 5;

export async function searchWines(query: string): Promise<WineSuggestion[]> {
	const queryYear = extractYear(query);
	const nameQuery = queryYear != null ? query.replace(/\b(19|20)\d{2}\b/, "").trim() : query;
	const isYearOnly = queryYear != null && nameQuery === "";

	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			"X-Algolia-Application-Id": ALGOLIA_APP_ID,
			"X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query: isYearOnly ? "" : nameQuery,
			hitsPerPage: isYearOnly ? 20 : 4,
		}),
	});

	if (!res.ok) return [];

	const data = await res.json();
	const suggestions: WineSuggestion[] = [];

	for (const hit of data.hits as AlgoliaHit[]) {
		const vintages = getNotableVintages(hit.vintages, queryYear);
		const base = {
			name: hit.name,
			winery: hit.winery?.name,
			region: hit.region?.name,
			typeId: hit.type_id,
		};

		if (queryYear != null) {
			// Year in query: only show that specific vintage
			const match = vintages.find((v) => v.year === queryYear);
			if (match) {
				suggestions.push({ ...base, vintage: match.year, rating: match.rating });
			}
		} else if (vintages.length === 0) {
			suggestions.push({
				...base,
				rating: hit.statistics?.ratings_average,
			});
		} else {
			for (const v of vintages) {
				suggestions.push({
					...base,
					vintage: v.year,
					rating: v.rating,
				});
			}
		}

		if (suggestions.length >= MAX_SUGGESTIONS) break;
	}

	return suggestions.slice(0, MAX_SUGGESTIONS);
}

function extractYear(query: string): number | undefined {
	const match = query.match(/\b(19|20)\d{2}\b/);
	return match ? parseInt(match[0], 10) : undefined;
}

function getNotableVintages(
	vintages: AlgoliaHit["vintages"],
	queryYear: number | undefined,
): { year: number; rating: number }[] {
	if (!vintages) return [];

	const currentYear = new Date().getFullYear();
	const parsed = vintages
		.map((v) => ({
			year: parseInt(v.year, 10),
			rating: v.statistics?.ratings_average ?? 0,
			count: v.statistics?.ratings_count ?? 0,
		}))
		.filter((v) => !isNaN(v.year) && v.year <= currentYear && v.count >= MIN_RATINGS);

	// Sort by year descending (latest vintage first)
	parsed.sort((a, b) => b.year - a.year);

	// When filtering by year, return all parsed vintages so the caller can find the match
	if (queryYear != null) return parsed;

	return parsed.slice(0, MAX_VINTAGES_PER_HIT);
}

const TYPE_MAP: Record<number, string> = {
	1: "red",
	2: "white",
	3: "bubbles",
	4: "rosé",
	7: "white",
};

export function vivinoTypeToColor(typeId: number | undefined): string | undefined {
	return typeId != null ? TYPE_MAP[typeId] : undefined;
}
