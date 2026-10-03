import L from 'leaflet';
import type { Feature, FeatureCollection, GeoJsonObject, MultiPolygon, Polygon } from 'geojson';
import type { DistrictForecast } from '#lib/types/district-weather.js';
import { createLandConstraint, focusBounds } from './geometry';

export const initialView = { lat: 23.5283, lng: 120.9795 };
export const overviewBounds: L.LatLngBoundsLiteral = [
	[21.85, 118.05],
	[26.4, 122.1]
];
export const navigationBounds: L.LatLngBoundsLiteral = [
	[20.4, 116.4],
	[26.7, 124.8]
];
export const minZoom = 6;
export const maxZoom = 15;
const reducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type WeatherMapState = {
	geo: GeoJsonObject | null;
	selectedCity: string | null;
	onselect: (city: string) => void;
	districts?: DistrictForecast[];
	districtGeo?: FeatureCollection | null;
	selectedDistrict?: string | null;
	onselectdistrict?: (district: string) => void;
	focusRequest?: number;
};

export const createMap = (container: HTMLDivElement) => {
	const map = L.map(container, {
		preferCanvas: true,
		zoomAnimation: !reducedMotion(),
		fadeAnimation: !reducedMotion(),
		inertia: !reducedMotion(),
		inertiaMaxSpeed: 1000,
		minZoom,
		maxZoom,
		maxBounds: navigationBounds,
		maxBoundsViscosity: 1,
		zoomControl: false,
		scrollWheelZoom: false
	});
	L.control
		.zoom({ position: 'topright', zoomInTitle: '放大地圖', zoomOutTitle: '縮小地圖' })
		.addTo(map);
	L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
	map.fitBounds(overviewBounds, { padding: [20, 20], animate: false });
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		minZoom,
		maxZoom,
		noWrap: true,
		bounds: navigationBounds,
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · 行政區界：<a href="https://data.gov.tw/dataset/7441">國土測繪中心</a>'
	}).addTo(map);
	return map;
};

export const createWeatherMap = (container: HTMLDivElement, initialState: WeatherMapState) => {
	const map = createMap(container);
	map.createPane('district-boundaries').style.zIndex = '450';
	const renderer = L.svg({ pane: 'district-boundaries' });
	let state = initialState;
	let countyGeo: GeoJsonObject | null = null;
	let districtGeo: FeatureCollection | null | undefined;
	let countyLayer: L.GeoJSON | undefined;
	let districtLayer: L.GeoJSON | undefined;
	let fallbackLayer: L.LayerGroup | undefined;
	let fallbackData: DistrictForecast[] | undefined;
	let focusedKey = '';
	let land: ReturnType<typeof createLandConstraint> | undefined;
	let restoringView = false;
	let lastSafeView = { center: map.getCenter(), zoom: map.getZoom() };
	const countyFeatures = new Map<string, Feature>();
	const districtFeatures = new Map<string, Feature>();
	const markers = new Map<string, L.CircleMarker>();

	const countryName = (feature: Feature | undefined) =>
		String(feature?.properties?.NAME_2014 ?? '');
	const districtName = (feature: Feature | undefined) => String(feature?.properties?.name ?? '');
	const countyStyle = (name: string, hover = false): L.PathOptions => ({
		color: name === state.selectedCity ? '#c45d24' : '#647b7f',
		fillColor: name === state.selectedCity ? '#f39a48' : hover ? '#2c8d87' : '#e8f2e9',
		fillOpacity:
			name === state.selectedCity
				? state.districtGeo
					? state.selectedDistrict
						? 0.08
						: 0.22
					: 0.4
				: hover
					? 0.25
					: 0.13,
		weight: name === state.selectedCity ? 2.5 : 1.2
	});
	const districtStyle = (name: string, hover = false): L.PathOptions => ({
		color: name === state.selectedDistrict ? '#b34a15' : '#2e7974',
		fillColor: name === state.selectedDistrict ? '#fb923c' : hover ? '#52b4a4' : '#f0fdf8',
		fillOpacity: name === state.selectedDistrict ? 0.38 : hover ? 0.3 : 0.08,
		weight: name === state.selectedDistrict ? 3 : 1.5
	});
	const clearLayer = (layer?: L.GeoJSON) => {
		layer?.eachLayer((path) => path.off());
		layer?.remove();
		layer?.clearLayers();
	};
	const recordView = () => {
		const bounds = map.getBounds();
		if (
			land &&
			!land({
				west: bounds.getWest(),
				east: bounds.getEast(),
				south: bounds.getSouth(),
				north: bounds.getNorth()
			})
		) {
			if (restoringView) return;
			restoringView = true;
			map.setView(lastSafeView.center, lastSafeView.zoom, {
				animate: !reducedMotion(),
				duration: 0.35
			});
			return;
		}
		restoringView = false;
		lastSafeView = { center: map.getCenter(), zoom: map.getZoom() };
		container.dataset.moving = 'false';
		container.dataset.zoom = String(map.getZoom());
		container.dataset.latitude = String(map.getCenter().lat);
		container.dataset.longitude = String(map.getCenter().lng);
	};
	map.on('movestart', () => (container.dataset.moving = 'true'));
	map.on('moveend', recordView);
	recordView();

	const update = (next: WeatherMapState) => {
		state = next;
		if (state.geo !== countyGeo) {
			clearLayer(countyLayer);
			countyFeatures.clear();
			countyGeo = state.geo;
			land = undefined;
			if (countyGeo) {
				land = createLandConstraint(countyGeo as FeatureCollection<Polygon | MultiPolygon>);
				countyLayer = L.geoJSON(countyGeo, {
					onEachFeature: (feature, layer) => {
						const name = countryName(feature);
						countyFeatures.set(name, feature);
						const path = layer as L.Path;
						const label = document.createElement('span');
						label.textContent = name;
						path.bindTooltip(label, { sticky: true });
						path.on('mouseover', () => path.setStyle(countyStyle(name, true)));
						path.on('mouseout', () => path.setStyle(countyStyle(name)));
						path.on('click', () => state.onselect(name));
					}
				}).addTo(map);
			}
		}
		countyLayer?.setStyle((feature) => countyStyle(countryName(feature)));
		if (state.districtGeo !== districtGeo) {
			clearLayer(districtLayer);
			districtFeatures.clear();
			districtGeo = state.districtGeo;
			if (districtGeo) {
				districtLayer = L.geoJSON(districtGeo, {
					pane: 'district-boundaries',
					style: { renderer, bubblingMouseEvents: false },
					onEachFeature: (feature, layer) => {
						const name = districtName(feature);
						districtFeatures.set(name, feature);
						const path = layer as L.Path;
						const label = document.createElement('span');
						label.textContent = name;
						path.bindTooltip(label, { sticky: true });
						path.on('mouseover', () => path.setStyle(districtStyle(name, true)));
						path.on('mouseout', () => path.setStyle(districtStyle(name)));
						path.on('click', () => state.onselectdistrict?.(name));
					}
				}).addTo(map);
			}
		}
		districtLayer?.setStyle((feature) => districtStyle(districtName(feature)));
		if (state.districts !== fallbackData || (districtGeo && fallbackLayer)) {
			markers.forEach((marker) => marker.off());
			fallbackLayer?.remove();
			fallbackLayer = undefined;
			markers.clear();
			fallbackData = state.districts;
			if (!districtGeo && fallbackData?.length) {
				fallbackLayer = L.layerGroup().addTo(map);
				for (const district of fallbackData) {
					const label = document.createElement('span');
					label.textContent = district.name;
					const marker = L.circleMarker([district.latitude, district.longitude], {
						pane: 'district-boundaries',
						renderer,
						radius: 7,
						color: '#fff',
						fillOpacity: 1,
						bubblingMouseEvents: false
					})
						.bindTooltip(label)
						.on('click', () => state.onselectdistrict?.(district.name))
						.addTo(fallbackLayer);
					markers.set(district.name, marker);
				}
			}
		}
		markers.forEach((marker, name) =>
			marker.setStyle({ fillColor: name === state.selectedDistrict ? '#f97316' : '#2e7974' })
		);

		const county = countyFeatures.get(state.selectedCity ?? '');
		const district = districtFeatures.get(state.selectedDistrict ?? '');
		const point = state.districts?.find((item) => item.name === state.selectedDistrict);
		const target = district ?? (state.selectedDistrict ? undefined : county);
		const bounds = target ? focusBounds(target) : !state.selectedCity ? overviewBounds : undefined;
		const key = `${state.selectedCity}/${state.selectedDistrict}/${state.focusRequest ?? 0}/${district ? 'boundary' : point && state.selectedDistrict ? 'point' : county ? 'county' : 'overview'}`;
		if (key !== focusedKey && (bounds || point)) {
			const animate = !reducedMotion() && (focusedKey !== '' || Boolean(state.selectedCity));
			focusedKey = key;
			map.stop();
			if (bounds) {
				const options = {
					padding: [28, 28] as L.PointTuple,
					maxZoom: district ? 13 : county ? 11 : 8,
					animate,
					duration: 0.7
				};
				if (animate) map.flyToBounds(bounds, options);
				else map.fitBounds(bounds, options);
			} else if (point) {
				if (animate) map.flyTo([point.latitude, point.longitude], 13, { duration: 0.7 });
				else map.setView([point.latitude, point.longitude], 13, { animate: false });
			}
		}
	};
	update(initialState);
	return {
		update,
		resize: () => map.invalidateSize({ pan: false }),
		destroy: () => {
			clearLayer(countyLayer);
			clearLayer(districtLayer);
			markers.forEach((marker) => marker.off());
			fallbackLayer?.remove();
			map.off();
			map.remove();
		}
	};
};
