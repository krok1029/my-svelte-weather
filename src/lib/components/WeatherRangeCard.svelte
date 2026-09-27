<script lang="ts">
	import type { WeatherTimeElement } from '@/types/weatherType';
	import WeatherSymbol from './WeatherSymbol.svelte';
	import Droplets from '@lucide/svelte/icons/droplets';
	let { range }: { range: WeatherTimeElement } = $props();
</script>

<article class="forecast-row" aria-label={`${range.startTime} 至 ${range.endTime} 的天氣預報`}>
	<div class="forecast-time"><strong>{range.startTime}</strong><span>至 {range.endTime}</span></div>
	<div class="forecast-condition">
		<span class="weather-symbol"><WeatherSymbol weather={range.Wx?.parameterName} /></span><span
			>{range.Wx?.parameterName ?? '暫無資料'}</span
		>
	</div>
	<div class="forecast-values">
		<strong
			>{range.MinT?.parameterName ?? '—'}–{range.MaxT?.parameterName ?? '—'}<small>°C</small
			></strong
		><span><Droplets size={13} />{range.PoP ? `${range.PoP.parameterName}%` : '暫無資料'}</span>
	</div>
	<div class="sr-only">
		最高溫：{range.MaxT?.parameterName}°C 低溫：{range.MinT?.parameterName}°C 降雨機率：{range.PoP
			? `${range.PoP.parameterName}${range.PoP.parameterUnit}`
			: '暫無資料'} 舒適度：{range.CI?.parameterName}
	</div>
</article>
