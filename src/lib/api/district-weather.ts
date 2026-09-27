import type { DistrictWeatherPayload } from '$lib/types/district-weather';

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown): value is string =>
	typeof value === 'string' && Number.isFinite(Date.parse(value));
const temperature = (value: unknown) =>
	value === null ||
	(Array.isArray(value) &&
		value.length === 2 &&
		value.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
		value[0] <= value[1]);

function isDistrictPayload(value: unknown, city: string): value is DistrictWeatherPayload {
	return (
		record(value) &&
		timestamp(value.updatedAt) &&
		typeof value.stale === 'boolean' &&
		record(value.data) &&
		value.data.city === city &&
		Array.isArray(value.data.locations) &&
		value.data.locations.every(
			(location) =>
				record(location) &&
				typeof location.name === 'string' &&
				typeof location.latitude === 'number' &&
				Math.abs(location.latitude) <= 90 &&
				typeof location.longitude === 'number' &&
				Math.abs(location.longitude) <= 180 &&
				Array.isArray(location.periods) &&
				location.periods.every(
					(period) =>
						record(period) &&
						timestamp(period.startTime) &&
						timestamp(period.endTime) &&
						Date.parse(period.endTime) > Date.parse(period.startTime) &&
						(period.weather === null || typeof period.weather === 'string') &&
						temperature(period.temperature) &&
						temperature(period.apparentTemperature) &&
						(period.rainProbability === null ||
							(typeof period.rainProbability === 'number' &&
								period.rainProbability >= 0 &&
								period.rainProbability <= 100))
				)
		)
	);
}

export async function fetchDistrictWeather(
	city: string,
	signal: AbortSignal
): Promise<DistrictWeatherPayload> {
	const response = await fetch(`/api/weather/districts?${new URLSearchParams({ city })}`, {
		signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)])
	});
	if (!response.ok) throw new Error('District weather unavailable');
	const result: unknown = await response.json();
	if (!isDistrictPayload(result, city)) throw new Error('Invalid district weather');
	return result;
}
