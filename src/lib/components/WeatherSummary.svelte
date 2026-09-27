<script lang="ts">
	import WeatherSymbol from './WeatherSymbol.svelte';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Thermometer from '@lucide/svelte/icons/thermometer';

	let {
		weather,
		temperature,
		rain,
		comfort,
		comfortLabel = '舒適度',
		periodLabel = '最近時段預報',
		loading = false,
		error = false
	}: {
		weather?: string | null;
		temperature?: string | null;
		rain?: string | number | null;
		comfort: string;
		comfortLabel?: string;
		periodLabel?: string;
		loading?: boolean;
		error?: boolean;
	} = $props();
</script>

<div class="weather-summary">
	<div class="summary-top">
		<span>{periodLabel}</span><span>{weather ?? '暫無資料'}</span>
	</div>
	{#if temperature}
		<div class="summary-main">
			<strong>{temperature}<small>°C</small></strong>
			<span class="summary-icon"><WeatherSymbol {weather} size={55} /></span>
		</div>
	{:else}
		<p class="summary-unavailable">
			{loading ? '正在取得預報…' : error ? '預報暫時無法取得' : '目前沒有可用的時段預報'}
		</p>
	{/if}
	<div class="summary-metrics">
		<div>
			<Droplets size={16} aria-hidden="true" /><span
				>降雨機率<strong>{rain !== null && rain !== undefined ? `${rain}%` : '暫無資料'}</strong
				></span
			>
		</div>
		<div>
			<Thermometer size={16} aria-hidden="true" /><span
				>{comfortLabel}<strong>{comfort}</strong></span
			>
		</div>
	</div>
</div>
