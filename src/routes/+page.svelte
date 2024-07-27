<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import L, { FeatureGroup } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import _ from 'lodash';
	import type { Action } from 'svelte/action';
	import type { GeoJsonObject, Feature } from 'geojson';
	import geo from '$lib/中華民國縣市.json';
	import taiwanDistricts from '$lib/taiwan_districts.json';
	import { onMount } from 'svelte';
	import { fetchWeatherData } from '$lib/api';
	import type { WeatherResponse, WeatherTimeElement } from '@/lib/weatherType';
	import weatherFactory from '@/lib/Factory/WeatherLocationFactory';

	let map: L.Map;
	let geoLayer: L.GeoJSON;
	const cityNames = taiwanDistricts.map((city) => city.name);

	const initialView = { lat: 23.5283, lng: 120.9795 };

	const createMap = (container: HTMLDivElement) => {
		let m = L.map(container, { preferCanvas: true }).setView(initialView, 8);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(m);

		return m;
	};

	const onEachFeature = (feature: Feature, layer: FeatureGroup) => {
		if (feature.properties) {
			const cityName = feature.properties.NAME_2014;

			layer.bindTooltip(cityName);

			layer.on('mouseover', function () {
				layer.setStyle({
					fillColor: '#0000ff'
				});
			});
			layer.on('mouseout', function () {
				layer.setStyle({
					fillColor: 'transparent',
					className: 'myListener '
				});
			});
			layer.on('click', function () {
				console.log('cityName', cityName);
				getCityWeatherData(cityName);
			});
		}
	};
	const mapAction: Action<HTMLDivElement, { someProperty: boolean } | undefined> = (node) => {
		map = createMap(node);
		geoLayer = L.geoJSON(geo as GeoJsonObject, {
			onEachFeature,
			style: { fillColor: 'transparent' }
		});
		geoLayer.addTo(map);
		return {
			destroy: () => {
				map.remove();
			}
		};
	};

	let weatherData: WeatherResponse;
	let error = null;
	let showData:
		| {
				locationName: string;
				timeElementsMap: WeatherTimeElement[];
		  }
		| undefined;

	const handleBtnClick = (city: string) => {
		showCity(city);
		getCityWeatherData(city);
	};

	const showCity = (city: string) => {
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
		const location = weatherData.records.location.find(({ locationName }) => locationName === city);
		if (location) {
			showData = weatherFactory(location);
			console.log(showData);
		}
	};

	onMount(async () => {
		try {
			const { data } = await fetchWeatherData();
			weatherData = data;
		} catch (err) {
			error = err;
		}
	});
</script>

<div class="bg-background m-4 overflow-hidden rounded-[0.5rem] border shadow-xl">
	<div class="hidden items-start justify-center gap-6 rounded-lg p-8 md:grid lg:grid-cols-2">
		<Card.Root class="m-3 p-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>天氣預報</Card.Title>
					<Card.Description>今日天氣</Card.Description>
				</Card.Header>
				<Card.Content class="flex w-full flex-wrap gap-1"
					>{#if !!showData}
						<Card.Description>{showData.locationName}</Card.Description>
						<div class="grid grid-cols-3 gap-4">
							{#each showData.timeElementsMap as range}
								<Card.Root>
									<Card.Header
										><Card.Title>
											{`${range.startTime}~${range.endTime}`}
										</Card.Title></Card.Header
									>
									<Card.Content>
										<ul>
											<li>CI: {range.CI?.parameterName}</li>
											<li>MaxT: {range.MaxT?.parameterName} ˚C</li>
											<li>MinT: {range.MinT?.parameterName} ˚C</li>
											<li>Wx: {range.Wx?.parameterName}</li>
										</ul>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{/if}</Card.Content
				>
			</Card.Root>
			<Card.Content class="mt-3 flex w-full flex-wrap gap-1">
				{#each cityNames as name}
					<Button on:click={() => handleBtnClick(name)} variant="secondary">
						<span class="sr-only">{name}</span>
						<p>{name}</p>
					</Button>
				{/each}
			</Card.Content>
		</Card.Root>
		<Card.Root class="p-3">
			<Card.Content class="h-[750px] w-full">
				<div class="map h-full w-full" use:mapAction />
			</Card.Content>
		</Card.Root>
	</div>
</div>
