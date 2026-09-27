import { expect, test } from './fixtures';
import districts from '../static/taiwan_districts.json' with { type: 'json' };

test('首頁顯示完整縣市選單、快捷選擇與地圖', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: '每一地，都有自己的天氣。' })).toBeVisible();
	await expect(
		page.getByRole('combobox', { name: '選擇縣市', exact: true }).locator('option')
	).toHaveCount(districts.length + 1);
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toBeDisabled();
	await expect(page.getByRole('button', { name: /^查看 .+ 的天氣$/ })).toHaveCount(3);
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(0);
});

test('切換縣市同步更新選單與預報內容', async ({ page }) => {
	await page.goto('/');
	const cities = page.getByRole('combobox', { name: '選擇縣市', exact: true });
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();
	await expect(page.getByRole('article').first()).toContainText('最高溫：30°C');
	await cities.selectOption('臺中市');
	await expect(cities).toHaveValue('臺中市');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺中市');
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.getByRole('article').first()).toContainText('最高溫：32°C');
});

test('手機版選擇地區、地圖與預報沒有橫向溢出', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.locator('.map')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('主題選單位於地圖上方且深色模式可使用', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
	await page.getByRole('button', { name: '切換顯示主題' }).click();
	await page.getByRole('menuitem', { name: '深色模式' }).click();
	await expect(page.locator('html')).toHaveClass(/dark/);
	await expect(page.locator('.map')).toBeVisible();
});
