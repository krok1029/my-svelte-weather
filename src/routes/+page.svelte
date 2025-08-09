<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import WeatherRangeCard from '$lib/components/WeatherRangeCard.svelte';
	import { createMap, addGeoLayer } from '$lib/map';
	import L from 'leaflet';
	import type { FeatureGroup } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import _ from 'lodash';
	import type { Action } from 'svelte/action';
	import type { GeoJsonObject } from 'geojson';
	import { onMount } from 'svelte';
	import { fetchWeatherData } from '$lib/api';
	import type { WeatherResponse, WeatherTimeElement } from '@/types/weatherType';
	import weatherFactory from '@/factories/weather-location-factory';

	let map: L.Map;
	let geoLayer: L.GeoJSON;
	let geo: GeoJsonObject | null = null;
	let taiwanDistricts: Array<{ name: string }> = [];
	let cityNames = $state<string[]>([]);

	const mapAction: Action<HTMLDivElement> = (node) => {
		map = createMap(node);

		const tryAddLayer = () => {
			if (geo && !geoLayer) {
				geoLayer = addGeoLayer(map, geo as GeoJsonObject, getCityWeatherData);
			}
		};

		// 立即檢查是否已有數據
		tryAddLayer();

		// 監聽數據變化
		const checkInterval = setInterval(() => {
			tryAddLayer();
			if (geoLayer) {
				clearInterval(checkInterval);
			}
		}, 100);

		return {
			destroy: () => {
				clearInterval(checkInterval);
				if (map) {
					map.remove();
				}
			}
		};
	};

	let weatherData = $state<WeatherResponse>();
	let showData:
		| {
				locationName: string;
				timeElementsMap: WeatherTimeElement[];
		  }
		| undefined = $state();

	const handleBtnClick = (city: string) => {
		showCity(city);
		getCityWeatherData(city);
	};

	const showCity = (city: string) => {
		if (!geoLayer) return;

		geoLayer.eachLayer((layer) => {
			const a = layer as FeatureGroup;
			const layerName = _.get(a, 'feature.properties.NAME_2014');
			if (layerName === city) {
				a.setStyle({ fillColor: '#0f00ff' });
			} else {
				a.setStyle({ fillColor: 'transparent' });
			}
		});
	};

	const getCityWeatherData = (city: string) => {
		const location = weatherData?.records.location.find(
			({ locationName }) => locationName === city
		);
		if (location) {
			showData = weatherFactory(location);
			console.log(showData);
		}
	};

	onMount(async () => {
		try {
			// 獲取天氣數據
			const { data } = await fetchWeatherData();
			weatherData = data;

			// 獲取地理數據
			const [geoResponse, districtsResponse] = await Promise.all([
				fetch('/taiwan_geo.json'),
				fetch('/taiwan_districts.json')
			]);

			geo = await geoResponse.json();
			taiwanDistricts = await districtsResponse.json();
			cityNames = taiwanDistricts.map((city) => city.name);
		} catch (err) {
			console.error('Failed to fetch data:', err);
		}
	});
</script>

<div class="m-4 overflow-hidden rounded-[0.5rem] border bg-background shadow-xl">
	<div class="items-start justify-center gap-6 rounded-lg p-8 md:grid lg:grid-cols-2">
		<Card.Root class="m-3 p-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>
						{weatherData?.records.datasetDescription ?? '天氣預報'}
					</Card.Title>
					<Card.Description>請選擇縣市查看天氣資訊</Card.Description>
				</Card.Header>
				<Card.Content class="flex w-full flex-wrap gap-1"
					>{#if !!showData}
						<Card.Description>縣市：{showData.locationName}</Card.Description>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each showData.timeElementsMap as range}
								<WeatherRangeCard {range} />
							{/each}
						</div>
					{/if}</Card.Content
				>
			</Card.Root>
			<Card.Content class="mt-3 flex w-full flex-wrap gap-1">
				{#each cityNames as name}
					<Button
						aria-label={`查看 ${name} 的天氣`}
						onclick={() => handleBtnClick(name)}
						variant="secondary"
					>
						<p>{name}</p>
					</Button>
				{/each}
			</Card.Content>
		</Card.Root>
		<Card.Root class="p-3">
			<Card.Content class="h-[750px] w-full">
				<div class="map h-full w-full" use:mapAction></div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
