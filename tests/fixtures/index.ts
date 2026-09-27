import { test as base, expect } from '@playwright/test';
import weatherJson from './weather.json' with { type: 'json' };
import type { WeatherResponse } from '../../src/lib/types/weatherType';

export const weatherFixture = weatherJson as WeatherResponse;
export const weatherEnvelope = (data = weatherFixture, stale = false) => ({
	data,
	updatedAt: '2026-09-26T04:00:00.000Z',
	stale
});

export const test = base.extend({
	page: async ({ page }, use) => {
		const browserErrors: string[] = [];
		page.on('pageerror', (error) => browserErrors.push(error.message));
		await page.clock.install({ time: new Date('2026-09-26T12:00:00+08:00') });
		await page.route('**/api/weather/districts?*', (route) =>
			route.fulfill({
				json: districtWeatherEnvelope(new URL(route.request().url()).searchParams.get('city') ?? '')
			})
		);
		await page.route('**/api/weather', (route) => route.fulfill({ json: weatherEnvelope() }));
		await page.route(/^https:\/\/(?:[^/]+\.)?tile\.openstreetmap\.org\//, (route) =>
			route.fulfill({
				contentType: 'image/png',
				body: Buffer.from(
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
					'base64'
				)
			})
		);
		await page.route('https://opendata.cwa.gov.tw/**', (route) => route.abort());
		await use(page);
		expect(browserErrors).toEqual([]);
	}
});

export { expect };

export const districtWeatherEnvelope = (city = '臺北市') => ({
	data: {
		city,
		locations: (city === '臺北市'
			? [
					{ name: '松山區', latitude: 25.051608, longitude: 121.568983, temperature: 33 },
					{ name: '內湖區', latitude: 25.069, longitude: 121.588, temperature: 29 }
				]
			: [{ name: '西屯區', latitude: 24.18, longitude: 120.65, temperature: 31 }]
		).map((location) => ({
			name: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
			periods: [
				{
					startTime: '2026-09-26T12:00:00+08:00',
					endTime: '2026-09-26T15:00:00+08:00',
					weather: '晴',
					temperature: [location.temperature, location.temperature + 1],
					apparentTemperature: [location.temperature + 2, location.temperature + 3],
					rainProbability: 0
				}
			]
		}))
	},
	updatedAt: '2026-09-26T04:00:00.000Z',
	stale: false
});
