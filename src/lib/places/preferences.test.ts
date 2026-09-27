import { describe, expect, it } from 'vitest';
import {
	placeFromUrl,
	readPreferences,
	urlForPlace,
	validPlace,
	writePreferences
} from './preferences';
const cities = [
	{ name: '臺北市', districts: [{ name: '內湖區' }, { name: '松山區' }] },
	{ name: '臺中市', districts: [{ name: '西屯區' }] }
];

describe('place preferences', () => {
	it('validates a district belongs to its county, falling back to county for invalid district', () => {
		expect(validPlace({ city: '臺北市', district: '內湖區' }, cities)).toEqual({
			city: '臺北市',
			district: '內湖區'
		});
		expect(validPlace({ city: '臺北市', district: '西屯區' }, cities)).toEqual({
			city: '臺北市',
			district: null
		});
		expect(validPlace({ city: 'unknown', district: '內湖區' }, cities)).toBeNull();
	});
	it('ignores corrupt storage, deduplicates and validates favorites', () => {
		expect(readPreferences({ getItem: () => '{broken' }, cities)).toEqual({
			selected: null,
			favorites: []
		});
		const selected = { city: '臺北市', district: '內湖區' };
		expect(
			readPreferences(
				{
					getItem: () =>
						JSON.stringify({ selected, favorites: [selected, selected, { city: 'bad' }] })
				},
				cities
			)
		).toEqual({ selected, favorites: [selected] });
	});
	it('tolerates storage disabled or full', () => {
		expect(
			readPreferences(
				{
					getItem: () => {
						throw new Error('blocked');
					}
				},
				cities
			)
		).toEqual({ selected: null, favorites: [] });
		expect(
			writePreferences(
				{
					setItem: () => {
						throw new Error('full');
					}
				},
				{ selected: null, favorites: [] }
			)
		).toBe(false);
	});
	it('distinguishes explicit invalid location URLs from a plain homepage', () => {
		expect(placeFromUrl(new URL('https://weather.test/?city=bad'), cities)).toEqual({
			explicit: true,
			selected: null
		});
		expect(placeFromUrl(new URL('https://weather.test/'), cities)).toEqual({
			explicit: false,
			selected: null
		});
	});
	it('roundtrips district names while preserving unrelated URL parameters and clearing overview', () => {
		const original = new URL('https://weather.test/?campaign=friend&city=bad#forecast');
		const next = urlForPlace(original, { city: '臺北市', district: '內湖區' });
		expect(placeFromUrl(next, cities).selected).toEqual({ city: '臺北市', district: '內湖區' });
		expect(next.searchParams.get('campaign')).toBe('friend');
		expect(next.hash).toBe('#forecast');
		expect(urlForPlace(next, null).search).toBe('?campaign=friend');
		expect(original.searchParams.get('city')).toBe('bad');
	});
});
