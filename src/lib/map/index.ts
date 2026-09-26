import L from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';

export const initialView = { lat: 23.5283, lng: 120.9795 };

export type WeatherMapState = {
	geo: GeoJsonObject | null;
	selectedCity: string | null;
	onselect: (city: string) => void;
};

const cityName = (feature: Feature | undefined): string | undefined => {
	const name = feature?.properties?.NAME_2014;
	return typeof name === 'string' ? name : undefined;
};

const cityStyle = (selected: boolean): L.PathOptions => ({
	fillColor: selected ? '#0f00ff' : 'transparent',
	fillOpacity: selected ? 0.35 : 0.2,
	weight: selected ? 3 : 2
});

export const createMap = (container: HTMLDivElement) => {
	const map = L.map(container, { preferCanvas: true }).setView(initialView, 8);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	return map;
};

export const createWeatherMap = (container: HTMLDivElement, initialState: WeatherMapState) => {
	const map = createMap(container);
	let state = initialState;
	let currentGeo: GeoJsonObject | null = null;
	let geoLayer: L.GeoJSON | undefined;

	const removeGeoLayer = () => {
		geoLayer?.eachLayer((layer) => layer.off());
		geoLayer?.remove();
		geoLayer?.clearLayers();
		geoLayer = undefined;
	};

	const update = (nextState: WeatherMapState) => {
		state = nextState;
		if (state.geo !== currentGeo) {
			removeGeoLayer();
			currentGeo = state.geo;
			if (currentGeo) {
				geoLayer = L.geoJSON(currentGeo, {
					onEachFeature: (feature, layer) => {
						const city = cityName(feature);
						if (!city) return;
						const path = layer as L.Path;
						path.bindTooltip(city);
						path.on('mouseover', () => path.setStyle(cityStyle(true)));
						path.on('mouseout', () => path.setStyle(cityStyle(state.selectedCity === city)));
						path.on('click', () => state.onselect(city));
					}
				}).addTo(map);
			}
		}
		geoLayer?.setStyle((feature) => cityStyle(cityName(feature) === state.selectedCity));
	};

	update(initialState);

	return {
		update,
		resize: () => map.invalidateSize({ pan: false }),
		destroy: () => {
			removeGeoLayer();
			map.remove();
		}
	};
};
