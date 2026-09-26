<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import WeatherRangeCard from '$lib/components/WeatherRangeCard.svelte';
	import WeatherMap from '$lib/components/WeatherMap.svelte';
	import type { FeatureCollection } from 'geojson';
	import { onMount } from 'svelte';
	import { fetchWeatherData } from '$lib/api';
	import type { WeatherResponse } from '@/types/weatherType';
	import weatherFactory from '@/factories/weather-location-factory';

	const lifetime = new AbortController();
	let geo = $state.raw<FeatureCollection | null>(null);
	let cityNames = $state<string[]>([]);
	let selectedCity = $state<string | null>(null);
	let weatherData = $state.raw<WeatherResponse>();
	let weatherLoading = $state(true);
	let geoLoading = $state(true);
	let citiesLoading = $state(true);
	let weatherError = $state(false);
	let geoError = $state(false);
	let citiesError = $state(false);
	let weatherStale = $state(false);
	let updatedAt = $state<string | null>(null);

	const selectedLocation = $derived(
		weatherData?.records.location.find(({ locationName }) => locationName === selectedCity)
	);
	const showData = $derived(selectedLocation ? weatherFactory(selectedLocation) : undefined);
	const retrievedTime = $derived(
		updatedAt
			? new Intl.DateTimeFormat('zh-TW', {
					timeZone: 'Asia/Taipei',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				}).format(new Date(updatedAt))
			: null
	);

	function selectCity(city: string) {
		selectedCity = city;
	}

	async function fetchJson<T>(path: string): Promise<T> {
		const response = await fetch(path, {
			signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(15_000)])
		});
		if (!response.ok) throw new Error(`Request failed: ${response.status}`);
		return response.json();
	}

	async function loadWeather() {
		weatherLoading = true;
		weatherError = false;
		try {
			const result = await fetchWeatherData(lifetime.signal);
			if (lifetime.signal.aborted) return;
			weatherData = result.data;
			updatedAt = result.updatedAt;
			weatherStale = result.stale;
		} catch {
			if (!lifetime.signal.aborted) weatherError = true;
		} finally {
			if (!lifetime.signal.aborted) weatherLoading = false;
		}
	}

	async function loadGeo() {
		geoLoading = true;
		geoError = false;
		try {
			const data = await fetchJson<FeatureCollection>('/taiwan_geo.json');
			if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
				throw new Error('Invalid map data');
			}
			if (!lifetime.signal.aborted) geo = data;
		} catch {
			if (!lifetime.signal.aborted) geoError = true;
		} finally {
			if (!lifetime.signal.aborted) geoLoading = false;
		}
	}

	async function loadCities() {
		citiesLoading = true;
		citiesError = false;
		try {
			const data = await fetchJson<Array<{ name: string }>>('/taiwan_districts.json');
			if (!Array.isArray(data) || !data.every((city) => typeof city?.name === 'string')) {
				throw new Error('Invalid city data');
			}
			if (!lifetime.signal.aborted) cityNames = data.map((city) => city.name);
		} catch {
			if (!lifetime.signal.aborted) citiesError = true;
		} finally {
			if (!lifetime.signal.aborted) citiesLoading = false;
		}
	}

	onMount(() => {
		void loadWeather();
		void loadGeo();
		void loadCities();
		return () => lifetime.abort();
	});
</script>

<main class="m-4 overflow-hidden rounded-[0.5rem] border bg-background shadow-xl">
	<div class="grid items-start gap-6 p-4 md:p-8 lg:grid-cols-2">
		<Card.Root class="min-w-0 p-3">
			<Card.Header>
				<Card.Title>
					<h1>{weatherData?.records.datasetDescription ?? '天氣預報'}</h1>
				</Card.Title>
				<Card.Description>請選擇縣市查看天氣資訊</Card.Description>
				{#if retrievedTime}
					<p class="text-sm text-muted-foreground">資料取得時間：{retrievedTime}（台灣時間）</p>
				{/if}
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if weatherLoading}
					<p role="status">天氣資料載入中…</p>
				{/if}
				{#if weatherError}
					<div class="space-y-2">
						<p role="alert">天氣資料載入失敗，請稍後重試。</p>
						<Button variant="outline" onclick={loadWeather} disabled={weatherLoading}
							>重新載入天氣</Button
						>
					</div>
				{:else if weatherStale}
					<div class="space-y-2">
						<p role="status">目前顯示快取資料，氣象服務暫時無法更新。</p>
						<Button variant="outline" onclick={loadWeather} disabled={weatherLoading}
							>更新天氣</Button
						>
					</div>
				{/if}
				{#if selectedCity}
					<p aria-live="polite">縣市：{selectedCity}</p>
				{/if}
				{#if showData && showData.timeElementsMap.length > 0}
					<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
						{#each showData.timeElementsMap as range (range.startTime)}
							<WeatherRangeCard {range} />
						{/each}
					</div>
				{:else if selectedCity && !weatherLoading && !weatherError}
					<p role="status">暫無 {selectedCity} 的天氣資料。</p>
				{/if}
			</Card.Content>
			<Card.Content class="mt-3 space-y-3">
				{#if citiesLoading}
					<p role="status">縣市清單載入中…</p>
				{/if}
				{#if citiesError}
					<p role="alert">縣市清單載入失敗，請稍後重試。</p>
					<Button variant="outline" onclick={loadCities} disabled={citiesLoading}
						>重新載入縣市</Button
					>
				{/if}
				<div class="flex flex-wrap gap-2" role="group" aria-label="選擇縣市">
					{#each cityNames as name (name)}
						<Button
							class="min-h-11"
							aria-label={`查看 ${name} 的天氣`}
							aria-pressed={selectedCity === name}
							onclick={() => selectCity(name)}
							variant={selectedCity === name ? 'default' : 'secondary'}
						>
							{name}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root class="min-w-0 p-3">
			<Card.Content class="space-y-3">
				{#if geoLoading}
					<p role="status">地圖載入中…</p>
				{/if}
				{#if geoError}
					<p role="alert">地圖資料載入失敗，請稍後重試。</p>
					<Button variant="outline" onclick={loadGeo} disabled={geoLoading}>重新載入地圖</Button>
				{/if}
				<div class="h-[60vh] min-h-80 w-full lg:h-[750px]">
					<WeatherMap {geo} {selectedCity} onselect={selectCity} />
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</main>
