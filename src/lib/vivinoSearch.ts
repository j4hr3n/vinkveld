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
	vintages?: { year: number }[];
	type_id?: number;
	region?: { name: string };
	winery?: { name: string };
	statistics?: { ratings_average: number };
}

export async function searchWines(query: string): Promise<WineSuggestion[]> {
	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			"X-Algolia-Application-Id": ALGOLIA_APP_ID,
			"X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query,
			hitsPerPage: 6,
		}),
	});

	if (!res.ok) return [];

	const data = await res.json();
	return (data.hits as AlgoliaHit[]).map((hit) => ({
		name: hit.name,
		vintage: hit.vintages?.[0]?.year,
		winery: hit.winery?.name,
		region: hit.region?.name,
		rating: hit.statistics?.ratings_average,
		typeId: hit.type_id,
	}));
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
