import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from 'geojson';

export type ViewBounds = { west: number; south: number; east: number; north: number };
const polygons = (feature: Feature): Position[][][] =>
	feature.geometry?.type === 'Polygon'
		? [feature.geometry.coordinates]
		: feature.geometry?.type === 'MultiPolygon'
			? feature.geometry.coordinates
			: [];
const boundsOf = (ring: Position[]): ViewBounds =>
	ring.reduce(
		(bounds, point) => ({
			west: Math.min(bounds.west, point[0]),
			east: Math.max(bounds.east, point[0]),
			south: Math.min(bounds.south, point[1]),
			north: Math.max(bounds.north, point[1])
		}),
		{ west: Infinity, east: -Infinity, south: Infinity, north: -Infinity }
	);
const area = (ring: Position[]) =>
	Math.abs(
		ring.reduce((sum, point, index) => {
			const next = ring[(index + 1) % ring.length];
			return sum + point[0] * next[1] - next[0] * point[1];
		}, 0)
	);

export function focusBounds(feature: Feature): [[number, number], [number, number]] | undefined {
	const largest = [...polygons(feature)].sort((a, b) => area(b[0]) - area(a[0]))[0];
	if (!largest) return;
	const bounds = boundsOf(largest[0]);
	return [
		[bounds.south, bounds.west],
		[bounds.north, bounds.east]
	];
}

function inside(point: Position, ring: Position[]): boolean {
	let result = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const a = ring[i],
			b = ring[j];
		if (
			a[1] > point[1] !== b[1] > point[1] &&
			point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
		)
			result = !result;
	}
	return result;
}

function segmentTouches(a: Position, b: Position, view: ViewBounds): boolean {
	const dx = b[0] - a[0],
		dy = b[1] - a[1];
	const p = [-dx, dx, -dy, dy],
		q = [a[0] - view.west, view.east - a[0], a[1] - view.south, view.north - a[1]];
	let low = 0,
		high = 1;
	for (let i = 0; i < 4; i++) {
		if (p[i] === 0) {
			if (q[i] < 0) return false;
		} else if (p[i] < 0) low = Math.max(low, q[i] / p[i]);
		else high = Math.min(high, q[i] / p[i]);
		if (low > high) return false;
	}
	return true;
}

export function createLandConstraint(geo: FeatureCollection<Polygon | MultiPolygon>) {
	const land = geo.features
		.flatMap(polygons)
		.map((rings) => ({ rings, bounds: boundsOf(rings[0]) }));
	return (view: ViewBounds): boolean =>
		land.some(({ rings, bounds }) => {
			if (
				bounds.east < view.west ||
				bounds.west > view.east ||
				bounds.north < view.south ||
				bounds.south > view.north
			)
				return false;
			const corners = [
				[view.west, view.south],
				[view.west, view.north],
				[view.east, view.south],
				[view.east, view.north]
			];
			if (
				corners.some(
					(point) => inside(point, rings[0]) && !rings.slice(1).some((hole) => inside(point, hole))
				)
			)
				return true;
			return rings.some((ring) =>
				ring.some((point, index) => segmentTouches(point, ring[(index + 1) % ring.length], view))
			);
		});
}
