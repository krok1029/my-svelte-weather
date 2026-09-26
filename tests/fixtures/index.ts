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
	}
});

export { expect };
