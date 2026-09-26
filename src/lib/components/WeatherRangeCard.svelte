<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { WeatherTimeElement } from '@/types/weatherType';
	export let range: WeatherTimeElement;
</script>

<article aria-label={`${range.startTime} 至 ${range.endTime} 的天氣預報`}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{`${range.startTime}~${range.endTime}`}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul>
				<li>天氣現象：{range.Wx?.parameterName}</li>
				<li>
					降雨機率：{range.PoP
						? `${range.PoP.parameterName}${range.PoP.parameterUnit}`
						: '暫無資料'}
				</li>
				<li>最高溫：{range.MaxT ? `${range.MaxT.parameterName}°C` : ''}</li>
				<li>低溫：{range.MinT ? `${range.MinT.parameterName}°C` : ''}</li>
				<li>舒適度：{range.CI?.parameterName}</li>
			</ul>
		</Card.Content>
	</Card.Root>
</article>
