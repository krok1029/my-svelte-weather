<script lang="ts">
	import type { DistrictForecast } from '$lib/types/district-weather';
	import WeatherSymbol from './WeatherSymbol.svelte';
	import Droplets from '@lucide/svelte/icons/droplets';
	let { location, now }: { location: DistrictForecast; now: number } = $props();
	let expanded = $state(false);
	const periods = $derived(location.periods.filter((period) => Date.parse(period.endTime) > now));
	const visiblePeriods = $derived(expanded ? periods : periods.slice(0, 8));
	const format = (value: string) =>
		new Intl.DateTimeFormat('zh-TW', {
			timeZone: 'Asia/Taipei',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date(value));
	const temperature = (value: [number, number] | null) =>
		value === null
			? '暫無資料'
			: value[0] === value[1]
				? `${value[0]}°C`
				: `${value[0]}–${value[1]}°C`;
</script>

{#if periods.length === 0}
	<p role="status">暫無 {location.name} 的未來天氣資料。</p>
{:else}
	<div class="forecast-list">
		{#each visiblePeriods as period (period.startTime)}
			<article
				class="forecast-row"
				aria-label={`${location.name} ${format(period.startTime)} 的天氣預報`}
			>
				<div class="forecast-time">
					<strong>{format(period.startTime)}</strong><span
						>至 {format(period.endTime).split(' ')[1]}</span
					>
				</div>
				<div class="forecast-condition">
					<span class="weather-symbol"><WeatherSymbol weather={period.weather} /></span><span
						>{period.weather ?? '暫無資料'}</span
					>
				</div>
				<div class="forecast-values">
					<strong>{temperature(period.temperature)}</strong><span
						><Droplets size={13} />{period.rainProbability === null
							? '暫無資料'
							: `${period.rainProbability}%`}</span
					>
				</div>
				<div class="sr-only">
					體感溫度：{temperature(period.apparentTemperature)} 降雨機率：{period.rainProbability ===
					null
						? '暫無資料'
						: `${period.rainProbability}%`}
				</div>
			</article>
		{/each}
	</div>
	{#if periods.length > 8}<button
			class="text-action expand-forecast"
			aria-expanded={expanded}
			onclick={() => (expanded = !expanded)}>{expanded ? '收合預報' : '查看後續預報'}</button
		>{/if}
{/if}
