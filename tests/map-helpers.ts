import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export async function settleMap(page: Page) {
	const map = page.locator('.map');
	await expect(map).toHaveAttribute('data-moving', 'false');
	return map;
}

export async function clickCoordinate(page: Page, latitude: number, longitude: number) {
	const map = await settleMap(page);
	await map.scrollIntoViewIfNeeded();
	const position = await map.evaluate(
		(element, point) => {
			const data = (element as HTMLElement).dataset;
			const scale = 256 * 2 ** Number(data.zoom);
			const latitudeY = (lat: number) => {
				const sine = Math.sin((lat * Math.PI) / 180);
				return (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale;
			};
			return {
				x: element.clientWidth / 2 + ((point.longitude - Number(data.longitude)) / 360) * scale,
				y: element.clientHeight / 2 + latitudeY(point.latitude) - latitudeY(Number(data.latitude))
			};
		},
		{ latitude, longitude }
	);
	await map.click({ position });
}
