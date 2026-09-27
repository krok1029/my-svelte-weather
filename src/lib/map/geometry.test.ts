import { describe, expect, it } from 'vitest';
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson';
import { createLandConstraint, focusBounds } from './geometry';
const square = (x: number, y: number, size: number): Position[] => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y]
];
const feature: Feature<Polygon> = {
	type: 'Feature',
	properties: {},
	geometry: { type: 'Polygon', coordinates: [square(0, 0, 10), square(4, 4, 2)] }
};
const touches = createLandConstraint({ type: 'FeatureCollection', features: [feature] });
describe('land visibility constraint', () => {
	it('allows a view inside land and a view containing the entire island', () => {
		expect(touches({ west: 1, east: 2, south: 1, north: 2 })).toBe(true);
		expect(touches({ west: -1, east: 11, south: -1, north: 11 })).toBe(true);
	});
	it('rejects open water and a view entirely inside a polygon hole', () => {
		expect(touches({ west: 11, east: 12, south: 3, north: 4 })).toBe(false);
		expect(touches({ west: 4.5, east: 5.5, south: 4.5, north: 5.5 })).toBe(false);
	});
	it('detects land crossing the view even if no corner or original vertex is visible', () => {
		expect(touches({ west: -1, east: 11, south: 2, north: 3 })).toBe(true);
	});
	it('checks each island independently rather than accepting its empty bounding box', () => {
		const islands: Feature<MultiPolygon> = {
			type: 'Feature',
			properties: {},
			geometry: { type: 'MultiPolygon', coordinates: [[square(0, 0, 1)], [square(10, 10, 2)]] }
		};
		const check = createLandConstraint({ type: 'FeatureCollection', features: [islands] });
		expect(check({ west: 4, east: 5, south: 4, north: 5 })).toBe(false);
		expect(check({ west: 10.5, east: 11, south: 10.5, north: 11 })).toBe(true);
	});
});
it('focuses the largest landmass without reordering the source geometry', () => {
	const islands: Feature<MultiPolygon> = {
		type: 'Feature',
		properties: {},
		geometry: { type: 'MultiPolygon', coordinates: [[square(100, 0, 1)], [square(120, 20, 5)]] }
	};
	const original = structuredClone(islands);
	expect(focusBounds(islands)).toEqual([
		[20, 120],
		[25, 125]
	]);
	expect(islands).toEqual(original);
});
