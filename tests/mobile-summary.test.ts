import { expect, test } from './fixtures';

for (const viewport of [
	{ width: 375, height: 667 },
	{ width: 667, height: 375 }
]) {
	test(`手機 ${viewport.width}×${viewport.height} 摘要在地圖之前且詳細預報在後`, async ({
		page,
		browserName
	}) => {
		await page.setViewportSize(viewport);
		await page.goto('/');
		await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
		const summary = page.getByRole('region', { name: '天氣摘要', exact: true });
		await expect(summary).toContainText('25–30°C');
		await expect(summary).toContainText('20%');
		await expect(page.locator('.weather-summary')).toHaveCount(1);
		await expect(summary.getByRole('heading', { name: '臺北市', exact: true })).toHaveCount(1);
		await expect(page.getByRole('article')).toHaveCount(3);
		const map = page.getByRole('region', { name: '互動地圖' });
		const details = page.getByRole('region', { name: '天氣預報', exact: true });
		const summaryBox = (await summary.boundingBox())!;
		const mapBox = (await map.boundingBox())!;
		const detailsBox = (await details.boundingBox())!;
		expect(summaryBox.y + summaryBox.height).toBeLessThan(mapBox.y);
		expect(mapBox.y + mapBox.height).toBeLessThan(detailsBox.y);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			viewport.width
		);
		await page.getByRole('button', { name: '更新天氣', exact: true }).focus();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(page.getByRole('button', { name: '重新聚焦選取地區' })).toBeFocused();

		await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
		await expect(summary).toContainText('29–30°C');
		await expect(summary).toContainText('0%');
		await expect(summary).toContainText('體感溫度');
		await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
		await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
		await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
		await expect(page.locator('.map')).toHaveAttribute('data-moving', 'false');
		await page.locator('.map').scrollIntoViewIfNeeded();
		await page.screenshot({
			path: `test-results/mobile-summary-${viewport.width}.png`,
			fullPage: true
		});

		await page.getByRole('button', { name: '切換顯示主題' }).click();
		await page.getByRole('menuitem', { name: '深色模式' }).click();
		await expect(page.locator('html')).toHaveClass(/dark/);
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(summary).toBeVisible();
		await page.locator('.map').scrollIntoViewIfNeeded();
		await page.screenshot({
			path: `test-results/mobile-summary-dark-${viewport.width}.png`,
			fullPage: true
		});
	});
}

test('桌面維持左側摘要與預報、右側地圖', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.locator('.weather-summary')).toContainText('25–30°C');
	const summary = (await page.locator('.summary-panel').boundingBox())!;
	const map = (await page.locator('.map-panel').boundingBox())!;
	const details = (await page.locator('.forecast-panel').boundingBox())!;
	expect(summary.x + summary.width).toBeLessThan(map.x);
	expect(details.x).toBe(summary.x);
	expect(details.y).toBeGreaterThan(summary.y);
	const layout = (await page.locator('.explorer-layout').boundingBox())!;
	const footer = (await page.locator('.weather-footer').boundingBox())!;
	expect(details.y + details.height).toBeLessThanOrEqual(layout.y + layout.height + 1);
	expect(map.y + map.height).toBeLessThanOrEqual(footer.y);
	await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
	await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
	await expect(page.locator('.map')).toHaveAttribute('data-moving', 'false');
	await page.screenshot({ path: 'test-results/mobile-summary-desktop.png', fullPage: true });
});

test('手機摘要保留載入與失敗資訊，重試成功後顯示預報', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		'**/api/weather',
		async (route) => {
			await pending;
			await route.fulfill({ status: 503, json: { message: 'unavailable' } });
		},
		{ times: 1 }
	);
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	const summary = page.getByRole('region', { name: '天氣摘要', exact: true });
	await expect(summary.getByRole('status')).toHaveText('天氣資料載入中…');
	await expect(summary).toContainText('正在取得預報…');
	await expect(summary.getByRole('button', { name: '更新天氣' })).toBeDisabled();
	release();
	await expect(summary.getByRole('alert')).toContainText('天氣資料載入失敗');
	await expect(page.getByRole('alert')).toHaveCount(1);
	await expect(summary).toContainText('預報暫時無法取得');
	await summary.getByRole('button', { name: '重新載入天氣' }).click();
	await expect(summary).toContainText('25–30°C');
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('手機缺值與空預報不顯示誤導性的溫度或降雨', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('高雄市');
	const summary = page.getByRole('region', { name: '天氣摘要', exact: true });
	await expect(summary).toContainText('目前沒有可用的時段預報');
	await expect(summary).not.toContainText('°C');
	await expect(summary).not.toContainText('%');
	await expect(summary).toContainText('降雨機率暫無資料');
	await page.getByRole('button', { name: '全臺總覽', exact: true }).click();
	await expect(page.locator('.weather-summary')).toHaveCount(0);
	await expect(summary).not.toBeVisible();
	await expect(page.getByRole('heading', { name: '從一個地方開始。' })).toBeVisible();
});
