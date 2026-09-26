import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Feature, FeatureCollection } from 'geojson';
import type { GeoJSONOptions, Layer, PathOptions } from 'leaflet';
import { createWeatherMap, type WeatherMapState } from './index';

const mocks = vi.hoisted(() => {
	const map = {
		setView: vi.fn().mockReturnThis(),
		invalidateSize: vi.fn(),
		remove: vi.fn()
	};
	return { map, geoJSON: vi.fn(), tileLayer: vi.fn(() => ({ addTo: vi.fn() })) };
});

vi.mock('leaflet', () => ({
	default: { map: vi.fn(() => mocks.map), tileLayer: mocks.tileLayer, geoJSON: mocks.geoJSON }
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
const container = {} as HTMLDivElement;

describe('weather map selection', () => {
	it('should retain selected highlight after hover exits and clear the previous city on selection', () => {
		// Arrange
		const initial = state('臺北市');
		const target = createWeatherMap(container, initial);
		const [taipei, newTaipei] = mockPaths;

		// Act
		taipei.events.mouseover();
		taipei.events.mouseout();

		// Assert
		expect(taipei.style).toEqual({ fillColor: '#0f00ff', fillOpacity: 0.35, weight: 3 });
		expect(newTaipei.style.fillColor).toBe('transparent');

		// Act
		target.update({ ...initial, selectedCity: '新北市' });
		taipei.events.mouseover();
		taipei.events.mouseout();

		// Assert
		expect(taipei.style).toEqual({ fillColor: 'transparent', fillOpacity: 0.2, weight: 2 });
		expect(newTaipei.style).toEqual({ fillColor: '#0f00ff', fillOpacity: 0.35, weight: 3 });
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
		expect(mockPaths[0].style.fillColor).toBe('#0f00ff');
		expect(mockPaths[1].style.fillColor).toBe('transparent');
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
