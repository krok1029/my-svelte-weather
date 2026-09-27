// Real geometry keeps offshore county and district selection usable after precision reduction.
import { expect, test } from './fixtures';
import { settleMap } from './map-helpers';

for (const { city, district, count, latitude, longitude } of [
	{ city: '澎湖縣', district: '馬公市', count: 6, latitude: 23.6, longitude: 119.6 },
	{ city: '金門縣', district: '金城鎮', count: 6, latitude: 24.4, longitude: 118.3 },
	{ city: '連江縣', district: '南竿鄉', count: 4, latitude: 26.15, longitude: 119.95 }
]) {
	test(`${city}的島嶼框線與行政區聚焦保留`, async ({ page }) => {
		// GIVEN: The real offshore geometry loads in a stable map view.
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
		await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption(city);
		await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
		await expect(page.locator('.leaflet-district-boundaries-pane path')).toHaveCount(count);
		// WHEN: Selecting a district on the county's main island.
		await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption(district);
		const map = await settleMap(page);
		// THEN: District boundaries, focused view, and source attribution remain available.
		await expect(map).toHaveAttribute('data-selected-city', city);
		await expect(map).toHaveAttribute('data-selected-district', district);
		expect(Number(await map.getAttribute('data-latitude'))).toBeCloseTo(latitude, 0);
		expect(Number(await map.getAttribute('data-longitude'))).toBeCloseTo(longitude, 0);
		expect(Number(await map.getAttribute('data-zoom'))).toBeGreaterThan(8);
		await expect(page.locator('.leaflet-control-attribution')).toContainText('國土測繪中心');
	});
}
