import L from 'leaflet';
import type { FeatureGroup } from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';

export const initialView = { lat: 23.5283, lng: 120.9795 };

export const createMap = (container: HTMLDivElement) => {
	const map = L.map(container, { preferCanvas: true }).setView(initialView, 8);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	return map;
};

export const bindFeatureEvents = (
	feature: Feature,
	layer: FeatureGroup,
	onCityClick: (city: string) => void
) => {
	if (feature.properties) {
		const cityName = feature.properties.NAME_2014;
		layer.bindTooltip(cityName);
		layer.on('mouseover', () => {
			layer.setStyle({ fillColor: '#0000ff' });
		});
		layer.on('mouseout', () => {
			layer.setStyle({ fillColor: 'transparent', className: 'myListener ' });
		});
		layer.on('click', () => {
			console.log('cityName', cityName);
			onCityClick(cityName);
		});
	}
};

export const addGeoLayer = (
	map: L.Map,
	geo: GeoJsonObject,
	onCityClick: (city: string) => void
): L.GeoJSON => {
	const layer = L.geoJSON(geo as GeoJsonObject, {
		onEachFeature: (feature, l) => bindFeatureEvents(feature, l as FeatureGroup, onCityClick),
		style: { fillColor: 'transparent' }
	});
	layer.addTo(map);
	return layer;
};
