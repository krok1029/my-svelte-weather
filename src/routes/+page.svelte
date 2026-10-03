<script lang="ts">
	import WeatherSummary from '#lib/components/WeatherSummary.svelte';
	import WeatherRangeCard from '#lib/components/WeatherRangeCard.svelte';
	import WeatherMap from '#lib/components/WeatherMap.svelte';
	import LocationSearch from '#lib/components/LocationSearch.svelte';
	import DistrictForecast from '#lib/components/DistrictForecast.svelte';
	import SavedPlaces from '#lib/components/SavedPlaces.svelte';
	import { fetchDistrictWeather } from '#lib/api/district-weather.js';
	import type { DistrictWeatherPayload } from '#lib/types/district-weather.js';
	import type { FeatureCollection } from 'geojson';
	import { onMount } from 'svelte';
	import { fetchWeatherData } from '#lib/api/index.js';
	import type { WeatherResponse } from '#lib/types/weatherType.js';
	import boundaryFiles from '../../static/boundaries/index.json';
	import WeatherSymbol from '#lib/components/WeatherSymbol.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Compass from '@lucide/svelte/icons/compass';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import weatherFactory from '#lib/factories/weather-location-factory.js';
	import { formatForecastTime, shouldRefreshWeather } from '#lib/weather/freshness.js';

	const lifetime = new AbortController();
	let now = $state(Date.now());
	let weatherPending = false;
	let weatherLastAttempt: number | null = null;
	let districtLastAttempt: number | null = null;
	let geo = $state.raw<FeatureCollection | null>(null);
	let cities = $state<Array<{ name: string; districts: Array<{ name: string }> }>>([]);
	const cityNames = $derived(cities.map((city) => city.name));
	let districtGeo = $state.raw<FeatureCollection | null>(null);
	let boundaryLoading = $state(false);
	let boundaryError = $state(false);
	let boundaryRequest: AbortController | undefined;
	let focusRequest = $state(0);
	const boundaryCache = new Map<string, FeatureCollection>();
	let selectedCity = $state<string | null>(null);
	let selectedDistrict = $state<string | null>(null);
	let districtData = $state.raw<DistrictWeatherPayload>();
	let districtLoading = $state(false);
	let districtError = $state(false);
	let districtRequest: AbortController | undefined;
	const districtSupported = $derived(
		selectedCity !== null && !['釣魚臺', '南海島'].includes(selectedCity)
	);
	const districts = $derived(
		cities.find((city) => city.name === selectedCity)?.districts.map((district) => district.name) ??
			districtData?.data.locations.map((location) => location.name) ??
			[]
	);
	const districtForecast = $derived(
		districtData?.data.locations.find((location) => location.name === selectedDistrict)
	);
	let weatherData = $state.raw<WeatherResponse>();
	let weatherLoading = $state(true);
	let geoLoading = $state(true);
	let citiesLoading = $state(true);
	let weatherError = $state(false);
	let geoError = $state(false);
	let citiesError = $state(false);
	let weatherStale = $state(false);
	let updatedAt = $state<string | null>(null);
	const activeUpdatedAt = $derived(selectedDistrict ? districtData?.updatedAt : updatedAt);
	const activeStale = $derived(selectedDistrict ? districtData?.stale : weatherStale);

	const selectedLocation = $derived(
		weatherData?.records.location.find(({ locationName }) => locationName === selectedCity)
	);
	const showData = $derived(selectedLocation ? weatherFactory(selectedLocation, now) : undefined);
	const retrievedTime = $derived(
		activeUpdatedAt
			? new Intl.DateTimeFormat('zh-TW', {
					timeZone: 'Asia/Taipei',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				}).format(new Date(activeUpdatedAt))
			: null
	);

	function selectCity(city: string | null) {
		selectedDistrict = null;
		focusRequest += 1;
		if (selectedCity === city) return;
		districtRequest?.abort();
		boundaryRequest?.abort();
		districtGeo = null;
		boundaryError = false;
		boundaryLoading = false;
		selectedCity = city;
		districtLastAttempt = null;
		districtData = undefined;
		districtError = false;
		districtLoading = false;
		if (city && !['釣魚臺', '南海島'].includes(city)) {
			void loadDistricts(city);
			void loadBoundaries(city);
		}
	}

	function selectDistrict(district: string | null) {
		selectedDistrict = district;
		focusRequest += 1;
	}

	async function loadDistricts(city: string) {
		if (districtLoading && !districtRequest?.signal.aborted) return;
		districtLastAttempt = Date.now();
		districtRequest?.abort();
		const request = new AbortController();
		districtRequest = request;
		districtLoading = true;
		districtError = false;
		try {
			const data = await fetchDistrictWeather(city, request.signal);
			if (!request.signal.aborted && selectedCity === city) districtData = data;
		} catch {
			if (!request.signal.aborted && selectedCity === city) districtError = true;
		} finally {
			if (districtRequest === request) districtLoading = false;
		}
	}

	async function loadBoundaries(city: string) {
		boundaryRequest?.abort();
		const request = new AbortController();
		boundaryRequest = request;
		boundaryLoading = true;
		boundaryError = false;
		try {
			const path = (boundaryFiles as Record<string, string>)[city];
			if (!path) throw new Error('No boundaries');
			let data = boundaryCache.get(city);
			if (!data) {
				const response = await fetch(path, {
					signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)])
				});
				if (!response.ok) throw new Error('Boundary unavailable');
				data = await response.json();
				if (
					!data ||
					data.type !== 'FeatureCollection' ||
					!Array.isArray(data.features) ||
					!data.features.every(
						(feature) =>
							feature.properties?.city === city &&
							typeof feature.properties?.name === 'string' &&
							['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
					)
				)
					throw new Error('Invalid boundaries');
				boundaryCache.set(city, data);
			}
			if (!request.signal.aborted && selectedCity === city) districtGeo = data;
		} catch {
			if (!request.signal.aborted && selectedCity === city) boundaryError = true;
		} finally {
			if (boundaryRequest === request) boundaryLoading = false;
		}
	}

	const districtNow = $derived(
		districtForecast?.periods.find((period) => Date.parse(period.endTime) > now)
	);
	const countyNow = $derived(showData?.timeElementsMap[0]);
	const summaryPeriodLabel = $derived(
		selectedDistrict
			? districtNow
				? `${formatForecastTime(districtNow.startTime)} 至 ${formatForecastTime(districtNow.endTime)} 預報`
				: '暫無未來預報'
			: countyNow
				? `${countyNow.startTime} 至 ${countyNow.endTime} 預報`
				: '暫無未來預報'
	);
	const summaryWeather = $derived(
		selectedDistrict ? districtNow?.weather : countyNow?.Wx?.parameterName
	);
	const summaryTemperature = $derived(
		selectedDistrict
			? districtNow?.temperature?.join('–')
			: countyNow
				? `${countyNow.MinT?.parameterName ?? '—'}–${countyNow.MaxT?.parameterName ?? '—'}`
				: null
	);
	const summaryRain = $derived(
		selectedDistrict ? districtNow?.rainProbability : countyNow?.PoP?.parameterName
	);
	const summaryComfort = $derived(
		selectedDistrict
			? districtNow?.apparentTemperature
				? `${districtNow.apparentTemperature.join('–')}°C`
				: '暫無資料'
			: (countyNow?.CI?.parameterName ?? '暫無資料')
	);

	async function fetchJson<T>(path: string): Promise<T> {
		const response = await fetch(path, {
			signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(15_000)])
		});
		if (!response.ok) throw new Error(`Request failed: ${response.status}`);
		return response.json();
	}

	async function loadWeather() {
		if (weatherPending) return;
		weatherPending = true;
		weatherLastAttempt = Date.now();
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
			weatherPending = false;
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
			const data =
				await fetchJson<Array<{ name: string; districts: Array<{ name: string }> }>>(
					'/taiwan_districts.json'
				);
			if (
				!Array.isArray(data) ||
				!data.every(
					(city) =>
						typeof city?.name === 'string' &&
						Array.isArray(city.districts) &&
						city.districts.every((district) => typeof district?.name === 'string')
				)
			) {
				throw new Error('Invalid city data');
			}
			if (!lifetime.signal.aborted) cities = data;
		} catch {
			if (!lifetime.signal.aborted) citiesError = true;
		} finally {
			if (!lifetime.signal.aborted) citiesLoading = false;
		}
	}

	function refreshStaleWeather() {
		if (shouldRefreshWeather(now, weatherLastAttempt, updatedAt, weatherStale || weatherError)) {
			void loadWeather();
		}
		if (
			selectedCity &&
			districtSupported &&
			shouldRefreshWeather(
				now,
				districtLastAttempt,
				districtData?.updatedAt,
				districtData?.stale || districtError
			)
		) {
			void loadDistricts(selectedCity);
		}
	}

	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const tick = () => {
			clearTimeout(timer);
			if (document.visibilityState !== 'visible') return;
			now = Date.now();
			refreshStaleWeather();
			timer = setTimeout(tick, 60_000 - (now % 60_000));
		};
		void loadWeather();
		void loadGeo();
		void loadCities();
		tick();
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', tick);
			lifetime.abort();
			districtRequest?.abort();
			boundaryRequest?.abort();
		};
	});
</script>

<svelte:head>
	<title>島嶼天氣｜探索縣市與行政區預報</title>
	<meta name="description" content="從臺灣縣市到鄉鎮市區，在互動地圖探索中央氣象署天氣預報。" />
</svelte:head>

<main class="weather-app">
	<div class="explorer-intro">
		<div>
			<p class="eyebrow">EXPLORE TAIWAN</p>
			<h1>每一地，都有自己的天氣。</h1>
			<p class="intro-copy">從縣市到行政區，看看接下來的晴雨變化。</p>
		</div>
		<span class="intro-coordinate">22 COUNTIES<br />ONE ISLAND, MANY SKIES</span>
	</div>
	<div class="explorer-layout">
		<section class="location-panel" aria-label="地區選擇">
			<div class="section-label">
				<span>01</span>
				<h2>你想看哪裡的天氣？</h2>
				<MapPin size={17} />
			</div>
			<LocationSearch
				{cities}
				loading={citiesLoading}
				onselect={({ city, district }) => {
					selectCity(city);
					if (district) selectDistrict(district);
				}}
			/>
			<div class="location-selects">
				<label
					>縣市<select
						aria-label="選擇縣市"
						value={selectedCity ?? ''}
						onchange={(event) => selectCity(event.currentTarget.value || null)}
						disabled={citiesLoading}
						><option value="">選擇縣市</option>{#each cityNames as name}<option value={name}
								>{name}</option
							>{/each}</select
					></label
				>
				<label
					>行政區<select
						aria-label="選擇行政區"
						value={selectedDistrict ?? ''}
						onchange={(event) => selectDistrict(event.currentTarget.value || null)}
						disabled={!selectedCity || !districtSupported}
						><option value="">{selectedCity ? '全縣市預報' : '先選擇縣市'}</option
						>{#each districts as name}<option value={name}>{name}</option>{/each}</select
					></label
				>
			</div>
			{#if citiesLoading}<p class="inline-status" role="status">縣市清單載入中…</p>{/if}
			{#if citiesError}<div class="status-box" role="alert">
					<span>縣市清單載入失敗，請稍後重試。</span><button
						class="text-action"
						onclick={loadCities}>重新載入縣市</button
					>
				</div>{/if}
			{#if !selectedCity}
				<div class="quick-locations">
					<span>快速看看</span>{#each ['臺北市', '臺中市', '高雄市'] as city}<button
							onclick={() => selectCity(city)}
							aria-label={`查看 ${city} 的天氣`}>{city}<ArrowUpRight size={12} /></button
						>{/each}
				</div>
			{:else}
				<div class="selection-path" aria-label="目前選取地區">
					<button onclick={() => selectCity(null)}>全臺</button><ChevronRight size={13} /><button
						onclick={() => selectDistrict(null)}
						aria-label="返回縣市預報">{selectedCity}</button
					>{#if selectedDistrict}<ChevronRight size={13} /><strong>{selectedDistrict}</strong>{/if}
				</div>
			{/if}
			<SavedPlaces
				{cities}
				{selectedCity}
				{selectedDistrict}
				onselect={(place) => {
					selectCity(place?.city ?? null);
					if (place?.district) selectDistrict(place.district);
				}}
			/>
		</section>

		{#if selectedCity || weatherLoading || weatherError || districtError || activeStale}
			<section class="summary-panel" aria-label="天氣摘要">
				{#if selectedCity}
					<div class="forecast-heading">
						<div>
							<p class="eyebrow">LOCAL FORECAST</p>
							<h2>
								{selectedCity}{#if selectedDistrict}<span> / {selectedDistrict}</span>{/if}
							</h2>
						</div>
						<button
							class="icon-action"
							aria-label="更新天氣"
							disabled={selectedDistrict ? districtLoading : weatherLoading}
							onclick={() =>
								selectedDistrict && selectedCity ? loadDistricts(selectedCity) : loadWeather()}
							><RefreshCw size={17} /></button
						>
					</div>
				{/if}
				{#if weatherLoading && !selectedDistrict}<p class="inline-status" role="status">
						天氣資料載入中…
					</p>{/if}
				{#if weatherError && !selectedDistrict}<div class="status-box" role="alert">
						<span>天氣資料載入失敗，請稍後重試。</span><button
							class="text-action"
							onclick={loadWeather}
							disabled={weatherLoading}>重新載入天氣</button
						>
					</div>{/if}
				{#if districtLoading && selectedDistrict}<p class="inline-status" role="status">
						行政區預報載入中…
					</p>{/if}
				{#if districtError}<div class="status-box" role="alert">
						<span>行政區天氣載入失敗，請稍後重試。</span><button
							class="text-action"
							disabled={districtLoading}
							onclick={() => selectedCity && loadDistricts(selectedCity)}>重新載入行政區天氣</button
						>
					</div>{/if}
				{#if activeStale}<p class="status-box" role="status">
						目前顯示快取資料，氣象服務暫時無法更新。
					</p>{/if}
				{#if selectedCity}
					<WeatherSummary
						hasPeriod={Boolean(selectedDistrict ? districtNow : countyNow)}
						periodLabel={summaryPeriodLabel}
						weather={summaryWeather}
						temperature={summaryTemperature}
						rain={summaryRain}
						comfort={summaryComfort}
						comfortLabel={selectedDistrict ? '體感溫度' : '舒適度'}
						loading={selectedDistrict ? districtLoading : weatherLoading}
						error={selectedDistrict ? districtError : weatherError}
					/>
				{/if}
			</section>
		{/if}

		<section class="map-panel" aria-label="互動地圖">
			<div class="map-toolbar">
				<div class="map-heading">
					<span class="live-dot"></span>
					<h2>{selectedDistrict ?? selectedCity ?? '全臺天氣地圖'}</h2>
					<span class="map-level"
						>{selectedDistrict ? '行政區' : selectedCity ? '縣市' : '總覽'}</span
					>
				</div>
				<div class="map-actions">
					<button
						title="重新聚焦選取地區"
						aria-label="重新聚焦選取地區"
						onclick={() => (focusRequest += 1)}><LocateFixed size={18} /><span>聚焦</span></button
					><button onclick={() => selectCity(null)} aria-label="全臺總覽"
						><Compass size={18} /><span>全臺</span></button
					>
				</div>
			</div>
			<div class="map-stage">
				<WeatherMap
					{geo}
					{selectedCity}
					onselect={selectCity}
					districts={districtData?.data.locations}
					{districtGeo}
					{selectedDistrict}
					onselectdistrict={selectDistrict}
					{focusRequest}
				/>
				{#if geoLoading}<div class="map-message" role="status">地圖載入中…</div>{/if}
				{#if geoError}<div class="map-message" role="alert">
						<span>地圖資料載入失敗，請稍後重試。</span><button class="text-action" onclick={loadGeo}
							>重新載入地圖</button
						>
					</div>{/if}
				{#if boundaryLoading}<div class="boundary-notice" role="status">
						正在載入 {selectedCity} 行政區框線…
					</div>{/if}
				{#if boundaryError}<div class="boundary-notice" role="alert">
						<span>行政區框線載入失敗。</span><button
							class="text-action"
							onclick={() => selectedCity && loadBoundaries(selectedCity)}>重新載入框線</button
						>
					</div>{/if}
				<div class="map-legend">
					<span class="legend-swatch selected"></span>已選地區{#if districtGeo}<span
							class="legend-swatch boundary"
						></span>行政區界線{/if}
				</div>
			</div>
			<div class="map-caption">
				<span
					>{selectedCity ? '點選有框線的行政區，查看當地預報' : '點選地圖上的縣市，開始探索'}</span
				><span>可拖曳 · 雙指縮放</span>
			</div>
		</section>

		<section class="forecast-panel" aria-label="天氣預報">
			{#if !selectedCity}
				<div class="forecast-empty">
					<div class="empty-weather"><WeatherSymbol weather="晴時多雲" size={64} /></div>
					<p class="eyebrow">A LITTLE WEATHER, A LITTLE WONDER</p>
					<h2>從一個地方開始。</h2>
					<p>選擇縣市或點選地圖，<br />讓下一段行程多一點準備。</p>
					<div class="empty-detail">
						<span>縣市 36 小時預報</span><span>行政區逐 3 小時預報</span>
					</div>
				</div>
			{/if}
			{#if selectedCity}
				<div class="forecast-section-title">
					<h3>{selectedDistrict ? '接下來的天氣' : '三十六小時天氣預報'}</h3>
					<span>{selectedDistrict ? '每 3 小時' : '分時預報'}</span>
				</div>
				{#if selectedDistrict}
					{#if districtForecast}{#key `${selectedCity}/${selectedDistrict}`}<DistrictForecast
								location={districtForecast}
								{now}
							/>{/key}{:else if !districtLoading && !districtError}<p
							class="inline-status"
							role="status"
						>
							暫無 {selectedDistrict} 的天氣資料。
						</p>{/if}
				{:else if showData && showData.timeElementsMap.length > 0}<div class="forecast-list">
						{#each showData.timeElementsMap as range (range.startTime)}<WeatherRangeCard
								{range}
							/>{/each}
					</div>
				{:else if !weatherLoading && !weatherError}<p class="inline-status" role="status">
						暫無 {selectedCity} 的天氣資料。
					</p>{/if}
			{/if}
			{#if retrievedTime && selectedCity}<p class="update-time">
					資料取得時間：{retrievedTime}（台灣時間）
				</p>{/if}
			{#if selectedCity && !districtSupported}<p class="inline-status">
					此地區暫無行政區天氣預報。
				</p>{/if}
		</section>
	</div>
	<footer class="weather-footer">
		<span>天氣資料／中央氣象署</span><span
			>行政區界線／<a href="https://data.gov.tw/dataset/7441" target="_blank" rel="noreferrer"
				>國土測繪中心</a
			></span
		><span>所有預報時間皆為台灣時間</span>
	</footer>
</main>
