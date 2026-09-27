export type SearchCity = { name: string; districts: Array<{ name: string }> };
export type LocationOption = { city: string; district: string | null };

export const normalizeLocationQuery = (value: string) =>
	value.replace(/台/g, '臺').replace(/\s+/g, '');

export function searchLocations(cities: SearchCity[], query: string): LocationOption[] {
	const term = normalizeLocationQuery(query);
	if (!term) return [];
	return cities
		.flatMap(({ name: city, districts }) => [
			{ city, district: null },
			...districts.map(({ name: district }) => ({ city, district }))
		])
		.filter(({ city, district }) => normalizeLocationQuery(city + (district ?? '')).includes(term))
		.sort((a, b) => {
			const rank = ({ city, district }: LocationOption) => {
				const name = normalizeLocationQuery(district ?? city);
				return name === term ? 0 : name.startsWith(term) ? 1 : 2;
			};
			return rank(a) - rank(b);
		});
}
