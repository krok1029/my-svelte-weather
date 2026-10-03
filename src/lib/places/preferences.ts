export type Place = { city: string; district: string | null };
export type CityOption = { name: string; districts: Array<{ name: string }> };
export type PlacePreferences = { selected: Place | null; favorites: Place[] };
export const preferencesKey = 'island-weather.places.v1';
export const favoriteLimit = 6;

export function validPlace(value: unknown, cities: CityOption[]): Place | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Record<string, unknown>;
	const city = cities.find((city) => city.name === candidate.city);
	if (!city) return null;
	const district =
		typeof candidate.district === 'string' &&
		city.districts.some((d) => d.name === candidate.district)
			? candidate.district
			: null;
	return { city: city.name, district };
}

export const placeKey = (place: Place | null) =>
	place ? `${place.city}/${place.district ?? ''}` : '';
export const placeLabel = (place: Place) =>
	place.district ? `${place.city} · ${place.district}` : place.city;

export function readPreferences(
	storage: Pick<Storage, 'getItem'>,
	cities: CityOption[]
): PlacePreferences {
	try {
		const value = JSON.parse(storage.getItem(preferencesKey) ?? 'null');
		if (!value || typeof value !== 'object') return { selected: null, favorites: [] };
		const unique = new Map<string, Place>();
		if (Array.isArray(value.favorites))
			for (const entry of value.favorites) {
				const place = validPlace(entry, cities);
				if (place) unique.set(placeKey(place), place);
			}
		return {
			selected: validPlace(value.selected, cities),
			favorites: [...unique.values()].slice(0, favoriteLimit)
		};
	} catch {
		return { selected: null, favorites: [] };
	}
}

export function writePreferences(
	storage: Pick<Storage, 'setItem'>,
	preferences: PlacePreferences
): boolean {
	try {
		storage.setItem(preferencesKey, JSON.stringify(preferences));
		return true;
	} catch {
		return false;
	}
}

export function placeFromUrl(url: URL, cities: CityOption[]) {
	return {
		explicit: url.searchParams.has('city') || url.searchParams.has('district'),
		selected: validPlace(
			{ city: url.searchParams.get('city'), district: url.searchParams.get('district') },
			cities
		)
	};
}

export function urlForPlace(url: Pick<URL, 'href'>, place: Place | null): URL {
	const next = new URL(url.href);
	next.searchParams.delete('city');
	next.searchParams.delete('district');
	if (place) {
		next.searchParams.set('city', place.city);
		if (place.district) next.searchParams.set('district', place.district);
	}
	return next;
}
