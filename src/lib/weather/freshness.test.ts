import { describe, expect, it } from 'vitest';
import { forecastTimestamp, formatForecastTime, shouldRefreshWeather } from './freshness';
import factory from '../factories/weather-location-factory';
import weatherJson from '../../../tests/fixtures/weather.json';
import type { WeatherLocation } from '../types/weatherType';

describe('forecast time', () => {
	it('interprets timezone-less CWA timestamps as Taiwan time and formats midnight', () => {
		expect(forecastTimestamp('2026-09-27 00:00:00')).toBe(Date.parse('2026-09-26T16:00:00Z'));
		expect(formatForecastTime('2026-09-26T16:00:00Z')).toBe('09/27 00:00');
	});

	it('drops ended county periods at the boundary, including overnight and fully expired data', () => {
		const location = weatherJson.records.location[0] as WeatherLocation;
		expect(factory(location, Date.parse('2026-09-26T17:59:59+08:00')).timeElementsMap).toHaveLength(
			3
		);
		const evening = factory(location, Date.parse('2026-09-26T18:00:00+08:00'));
		expect(evening.timeElementsMap).toHaveLength(2);
		expect(evening.timeElementsMap[0].startTime).toBe('09/26 18:00');
		expect(factory(location, Date.parse('2026-09-27T00:00:00+08:00')).timeElementsMap).toHaveLength(
			2
		);
		expect(factory(location, Date.parse('2026-09-27T18:00:00+08:00')).timeElementsMap).toEqual([]);
	});
});

describe('refresh policy', () => {
	const fetched = Date.parse('2026-09-26T04:00:00Z');
	const updatedAt = new Date(fetched).toISOString();
	it('refreshes aged, stale or missing data while leaving fresh data alone', () => {
		expect(shouldRefreshWeather(fetched + 299_999, fetched, updatedAt)).toBe(false);
		expect(shouldRefreshWeather(fetched + 300_000, fetched, updatedAt)).toBe(true);
		expect(shouldRefreshWeather(fetched, null, updatedAt, true)).toBe(true);
		expect(shouldRefreshWeather(fetched, null, undefined)).toBe(true);
	});
	it('limits retries even when the upstream keeps returning stale data', () => {
		expect(shouldRefreshWeather(fetched + 600_000, fetched + 599_000, updatedAt, true)).toBe(false);
		expect(shouldRefreshWeather(fetched + 900_000, fetched + 600_000, updatedAt, true)).toBe(true);
	});
});
