import { expect, test } from './fixtures';
import districts from '../static/taiwan_districts.json' with { type: 'json' };

test('首頁載入完整縣市清單與實際地圖邊界', async ({ page }) => {
	// GIVEN: Weather is deterministic; geographic files are served by the app.
	// WHEN: Opening the homepage.
	await page.goto('/');

	// THEN: Both local datasets are rendered without selecting a city.
	await expect(page.getByText('三十六小時天氣預報', { exact: true })).toBeVisible();
	await expect(page.getByText('請選擇縣市查看天氣資訊', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: /^查看 .+ 的天氣$/ })).toHaveCount(
		districts.length
	);
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(0);
});

test('切換縣市同步更新按鈕與預報內容', async ({ page }) => {
	// GIVEN: Taipei is selected and its forecast has loaded.
	await page.goto('/');
	const taipei = page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true });
	const taichung = page.getByRole('button', { name: '查看 臺中市 的天氣', exact: true });
	await taipei.click();
	await expect(page.getByRole('article').first()).toContainText('最高溫：30°C');

	// WHEN: Selecting Taichung.
	await taichung.click();

	// THEN: Only Taichung remains selected and all forecasts belong to it.
	await expect(taichung).toHaveAttribute('aria-pressed', 'true');
	await expect(taipei).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByText('縣市：臺中市', { exact: true })).toBeVisible();
	await expect(page.getByText('縣市：臺北市', { exact: true })).toHaveCount(0);
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.getByRole('article').first()).toContainText('最高溫：32°C');
});

test('行動裝置可選縣市並閱讀預報與地圖', async ({ page }) => {
	// GIVEN: A narrow viewport.
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');

	// WHEN: Selecting Taipei on the small screen.
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();

	// THEN: Forecast and map remain available without horizontal page overflow.
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.locator('.map')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
