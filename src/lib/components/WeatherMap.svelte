<script lang="ts">
	import type { Action } from 'svelte/action';
	import { createWeatherMap, type WeatherMapState } from '$lib/map';
	import 'leaflet/dist/leaflet.css';

	let { geo, selectedCity, onselect }: WeatherMapState = $props();

	const mapAction: Action<HTMLDivElement, WeatherMapState> = (node, state) => {
		const map = createWeatherMap(node, state);
		const observer = new ResizeObserver(() => map.resize());
		observer.observe(node);

		return {
			update: map.update,
			destroy: () => {
				observer.disconnect();
				map.destroy();
			}
		};
	};
</script>

<div
	class="map h-full w-full"
	role="region"
	aria-label="臺灣縣市天氣地圖，可使用縣市按鈕選取"
	data-selected-city={selectedCity ?? ''}
	data-ready={geo !== null ? 'true' : 'false'}
	use:mapAction={{ geo, selectedCity, onselect }}
></div>
