import type { Page } from '@playwright/test';
import { expect, test, weatherEnvelope, districtWeatherEnvelope } from './fixtures';

test.use({ timezoneId: 'America/Los_Angeles' });

const selectTaipei = async (page: Page) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByRole('article')).toHaveCount(3);
};

async function visibility(page: Page, state: 'hidden' | 'visible') {
	await page.evaluate((value) => {
		Object.defineProperty(document, 'visibilityState', { configurable: true, value });
		document.dispatchEvent(new Event('visibilitychange'));
	}, state);
}

test('縣市預報隨時間移除結束時段，摘要標示台灣時間的跨日時段', async ({ page }) => {
	await selectTaipei(page);
	await expect(page.locator('.weather-summary')).toContainText('09/26 12:00 至 09/26 18:00 預報');
	await page.clock.fastForward(6 * 60 * 60_000);
	await expect(page.getByRole('article')).toHaveCount(2);
	await expect(page.locator('.weather-summary')).toContainText('09/26 18:00 至 09/27 06:00 預報');
	await expect(page.locator('.weather-summary')).toContainText('0%');
	await page.clock.fastForward(6 * 60 * 60_000);
	await expect(page.getByRole('article')).toHaveCount(2);
	await page.clock.fastForward(18 * 60 * 60_000);
	await expect(page.getByRole('article')).toHaveCount(0);
	await expect(page.locator('.weather-summary')).toHaveCount(0);
	await expect(page.getByText('暫無 臺北市 的天氣資料。', { exact: true })).toBeVisible();
});

test('行政區摘要與詳細時段一起前進，所有時段結束後顯示空狀態', async ({ page }) => {
	const payload = districtWeatherEnvelope();
	for (const location of payload.data.locations) {
		location.periods.push({
			...location.periods[0],
			startTime: '2026-09-26T15:00:00+08:00',
			endTime: '2026-09-26T18:00:00+08:00',
			temperature: [21, 22],
			rainProbability: 80
		});
	}
	await page.route('**/api/weather/districts?*', (route) => route.fulfill({ json: payload }));
	await selectTaipei(page);
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByRole('article')).toHaveCount(2);
	await page.clock.fastForward(3 * 60 * 60_000);
	await expect(page.getByRole('article')).toHaveCount(1);
	await expect(page.locator('.weather-summary')).toContainText('09/26 15:00 至 09/26 18:00 預報');
	await expect(page.locator('.weather-summary')).toContainText('21–22');
	await expect(page.locator('.weather-summary')).toContainText('80%');
	await page.clock.fastForward(3 * 60 * 60_000);
	await expect(page.getByRole('article')).toHaveCount(0);
	await expect(page.locator('.weather-summary')).toHaveCount(0);
	await expect(page.getByText('暫無 內湖區 的未來天氣資料。', { exact: true })).toBeVisible();
});

test('背景頁籤不輪詢，恢復可見後獨立更新縣市與行政區且不重疊', async ({ page }) => {
	let countyRequests = 0;
	let districtRequests = 0;
	let release!: () => void;
	const pending = new Promise<void>((resolve) => (release = resolve));
	await page.route('**/api/weather', async (route) => {
		countyRequests += 1;
		if (countyRequests > 1) await pending;
		await route.fulfill({ json: weatherEnvelope() });
	});
	await page.route('**/api/weather/districts?*', async (route) => {
		districtRequests += 1;
		if (districtRequests > 1) await pending;
		await route.fulfill({ json: districtWeatherEnvelope() });
	});
	await selectTaipei(page);
	await expect.poll(() => districtRequests).toBe(1);
	await visibility(page, 'hidden');
	await page.clock.fastForward(10 * 60_000);
	expect(countyRequests).toBe(1);
	expect(districtRequests).toBe(1);
	await visibility(page, 'visible');
	await expect.poll(() => countyRequests).toBe(2);
	await expect.poll(() => districtRequests).toBe(2);
	await visibility(page, 'visible');
	await visibility(page, 'visible');
	expect(countyRequests).toBe(2);
	expect(districtRequests).toBe(2);
	release();
	await expect(page.getByRole('button', { name: '更新天氣', exact: true })).toBeEnabled();
});

test('前景更新失敗保留有效預報且節制重試，行政區仍可更新', async ({ page }) => {
	let countyRequests = 0;
	let districtRequests = 0;
	await page.route('**/api/weather', (route) => {
		countyRequests += 1;
		return countyRequests === 1
			? route.fulfill({ json: weatherEnvelope() })
			: route.fulfill({ status: 503, json: {} });
	});
	await page.route('**/api/weather/districts?*', (route) => {
		districtRequests += 1;
		return route.fulfill({ json: districtWeatherEnvelope() });
	});
	await selectTaipei(page);
	await expect.poll(() => districtRequests).toBe(1);
	await page.clock.fastForward(6 * 60_000);
	await expect(page.getByText('天氣資料載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect.poll(() => districtRequests).toBe(2);
	await page.clock.fastForward(60_000);
	await visibility(page, 'visible');
	expect(countyRequests).toBe(2);
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByRole('article')).toContainText('29–30°C');
});
