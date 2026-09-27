import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Feature, FeatureCollection } from 'geojson';
import type { GeoJSONOptions, Layer, PathOptions } from 'leaflet';
import { createWeatherMap, overviewBounds, type WeatherMapState } from './index';

const mocks = vi.hoisted(() => {
	const map = {
		createPane: vi.fn(() => ({ style: {} })),
		setView: vi.fn().mockReturnThis(),
		invalidateSize: vi.fn(),
		fitBounds: vi.fn(),
		flyToBounds: vi.fn(),
		stop: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		getCenter: vi.fn(() => ({ lat: 25, lng: 121 })),
		getZoom: vi.fn(() => 8),
		getBounds: vi.fn(() => ({
			getWest: () => 120,
			getEast: () => 122,
			getSouth: () => 24,
			getNorth: () => 26
		})),
		remove: vi.fn()
	};
	return { map, geoJSON: vi.fn(), tileLayer: vi.fn(() => ({ addTo: vi.fn() })) };
});

vi.mock('leaflet', () => ({
	default: {
		map: vi.fn(() => mocks.map),
		tileLayer: mocks.tileLayer,
		geoJSON: mocks.geoJSON,
		svg: vi.fn(),
		control: { zoom: vi.fn(() => ({ addTo: vi.fn() })), scale: vi.fn(() => ({ addTo: vi.fn() })) }
	}
}));

const feature = (name: string): Feature => ({
	type: 'Feature',
	properties: { NAME_2014: name },
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[121, 25],
				[121.1, 25],
				[121, 25.1],
				[121, 25]
			]
		]
	}
});
const geo: FeatureCollection = {
	type: 'FeatureCollection',
	features: [feature('臺北市'), feature('新北市')]
};

const createMockPath = (feature: Feature) => {
	const events: Record<string, () => void> = {};
	const path = {
		feature,
		style: {} as PathOptions,
		bindTooltip: vi.fn(),
		getBounds: vi.fn(() => feature.geometry),
		setStyle: vi.fn((style: PathOptions) => {
			path.style = style;
		}),
		on: vi.fn((event: string, handler: () => void) => {
			events[event] = handler;
		}),
		off: vi.fn(() => {
			for (const event of Object.keys(events)) delete events[event];
		}),
		events
	};
	return path;
};

let mockPaths: ReturnType<typeof createMockPath>[];
let mockGeoLayer: {
	addTo: ReturnType<typeof vi.fn>;
	setStyle: ReturnType<typeof vi.fn>;
	eachLayer: ReturnType<typeof vi.fn>;
	remove: ReturnType<typeof vi.fn>;
	clearLayers: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('document', { createElement: () => ({ textContent: '' }) });
	vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
	mockPaths = [];
	mocks.geoJSON.mockImplementation((data: FeatureCollection, options: GeoJSONOptions) => {
		mockPaths = data.features.map((entry) => {
			const path = createMockPath(entry);
			options.onEachFeature?.(entry, path as unknown as Layer);
			return path;
		});
		const paths = mockPaths;
		mockGeoLayer = {
			addTo: vi.fn().mockReturnThis(),
			setStyle: vi.fn((style: (feature: Feature) => PathOptions) => {
				paths.forEach((path) => path.setStyle(style(path.feature)));
			}),
			eachLayer: vi.fn((callback: (path: ReturnType<typeof createMockPath>) => void) =>
				paths.forEach(callback)
			),
			remove: vi.fn(),
			clearLayers: vi.fn()
		};
		return mockGeoLayer;
	});
});

const state = (selectedCity: string | null = null): WeatherMapState => ({
	geo,
	selectedCity,
	onselect: vi.fn()
});
const container = { dataset: {} } as HTMLDivElement;

describe('weather map selection', () => {
	it('should focus a selected city once, preserve manual panning, and reset to Taiwan', () => {
		// Arrange
		const initial = state();
		const target = createWeatherMap(container, initial);

		// Act
		target.update({ ...initial, selectedCity: '臺北市' });
		target.update({ ...initial, selectedCity: '臺北市' });

		// Assert
		expect(mocks.map.flyToBounds).toHaveBeenCalledTimes(1);
		expect(mocks.map.flyToBounds).toHaveBeenLastCalledWith(
			[
				[25, 121],
				[25.1, 121.1]
			],
			expect.objectContaining({ animate: true, duration: 0.7 })
		);
		target.update(initial);
		expect(mocks.map.flyToBounds).toHaveBeenLastCalledWith(
			overviewBounds,
			expect.objectContaining({ animate: true })
		);
	});

	it('should retain selected highlight after hover exits and clear the previous city on selection', () => {
		// Arrange
		const initial = state('臺北市');
		const target = createWeatherMap(container, initial);
		const [taipei, newTaipei] = mockPaths;

		// Act
		taipei.events.mouseover();
		taipei.events.mouseout();

		// Assert
		expect(taipei.style).toEqual({
			color: '#c45d24',
			fillColor: '#f39a48',
			fillOpacity: 0.4,
			weight: 2.5
		});
		expect(newTaipei.style.fillColor).toBe('#e8f2e9');

		// Act
		target.update({ ...initial, selectedCity: '新北市' });
		taipei.events.mouseover();
		taipei.events.mouseout();

		// Assert
		expect(taipei.style).toEqual({
			color: '#647b7f',
			fillColor: '#e8f2e9',
			fillOpacity: 0.13,
			weight: 1.2
		});
		expect(newTaipei.style).toEqual({
			color: '#c45d24',
			fillColor: '#f39a48',
			fillOpacity: 0.4,
			weight: 2.5
		});
		expect(mocks.geoJSON).toHaveBeenCalledTimes(1);
	});

	it('should invoke the latest shared selection callback with the clicked city', () => {
		// Arrange
		const initial = state();
		const target = createWeatherMap(container, initial);
		const onselect = vi.fn();

		// Act
		target.update({ ...initial, onselect });
		mockPaths[0].events.click();

		// Assert
		expect(onselect).toHaveBeenCalledExactlyOnceWith('臺北市');
		expect(initial.onselect).not.toHaveBeenCalled();
	});

	it('should add delayed geography with the existing selection and no duplicate layer', () => {
		// Arrange
		const initial = state('臺北市');
		const target = createWeatherMap(container, { ...initial, geo: null });
		expect(mocks.geoJSON).not.toHaveBeenCalled();

		// Act
		target.update(initial);
		target.update(initial);

		// Assert
		expect(mocks.geoJSON).toHaveBeenCalledTimes(1);
		expect(mockPaths[0].style.fillColor).toBe('#f39a48');
		expect(mockPaths[1].style.fillColor).toBe('#e8f2e9');
	});

	it('should dispose old event handlers when geography is cleared', () => {
		// Arrange
		const initial = state();
		const target = createWeatherMap(container, initial);
		const oldPaths = mockPaths;
		const oldLayer = mockGeoLayer;

		// Act
		target.update({ ...initial, geo: null });

		// Assert
		expect(oldPaths.map((path) => path.events)).toEqual([{}, {}]);
		expect(oldLayer.remove).toHaveBeenCalledTimes(1);
		expect(oldLayer.clearLayers).toHaveBeenCalledTimes(1);
	});

	it('should resize without panning and remove the map and listeners on destroy', () => {
		// Arrange
		const target = createWeatherMap(container, state());

		// Act
		target.resize();
		target.destroy();

		// Assert
		expect(mocks.map.invalidateSize).toHaveBeenCalledExactlyOnceWith({ pan: false });
		expect(mocks.map.remove).toHaveBeenCalledTimes(1);
		expect(mockPaths.map((path) => path.events)).toEqual([{}, {}]);
	});
});

it('honors reduced motion while allowing an explicit refocus', () => {
	vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
	const initial = state('臺北市');
	const target = createWeatherMap(container, initial);
	expect(mocks.map.flyToBounds).not.toHaveBeenCalled();
	expect(mocks.map.fitBounds).toHaveBeenLastCalledWith(
		[
			[25, 121],
			[25.1, 121.1]
		],
		expect.objectContaining({ animate: false })
	);
	const count = mocks.map.fitBounds.mock.calls.length;
	target.update({ ...initial, focusRequest: 1 });
	expect(mocks.map.fitBounds).toHaveBeenCalledTimes(count + 1);
});
