import { expect, test } from '@playwright/test';

test.describe('地圖功能測試', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('Leaflet 地圖正確初始化', async ({ page }) => {
		// 檢查地圖容器
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toBeVisible({ timeout: 10000 });

		// 等待地圖載入
		await page.waitForTimeout(5000);

		// 檢查地圖容器的尺寸
		const boundingBox = await mapContainer.boundingBox();
		expect(boundingBox?.width).toBeGreaterThan(0);
		expect(boundingBox?.height).toBeGreaterThan(0);
	});

	test('地圖與縣市按鈕互動', async ({ page }) => {
		// 等待地圖和按鈕載入
		await expect(page.locator('.map')).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		// 點擊縣市按鈕
		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		const cityName = await firstButton.textContent();
		await firstButton.click();

		// 檢查縣市資訊是否顯示
		await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({
			timeout: 10000
		});

		// 地圖應該仍然可見
		await expect(page.locator('.map')).toBeVisible();
	});

	test('地圖響應式設計', async ({ page }) => {
		// 測試桌面尺寸
		await page.setViewportSize({ width: 1200, height: 800 });
		await expect(page.locator('.map')).toBeVisible({ timeout: 10000 });

		let mapBox = await page.locator('.map').boundingBox();
		const desktopWidth = mapBox?.width || 0;

		// 測試平板尺寸
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.waitForTimeout(1000);

		mapBox = await page.locator('.map').boundingBox();
		const tabletWidth = mapBox?.width || 0;

		// 測試手機尺寸
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForTimeout(1000);

		await expect(page.locator('.map')).toBeVisible();
		mapBox = await page.locator('.map').boundingBox();
		const mobileWidth = mapBox?.width || 0;

		// 驗證地圖在不同尺寸下都有合理的寬度
		expect(desktopWidth).toBeGreaterThan(0);
		expect(tabletWidth).toBeGreaterThan(0);
		expect(mobileWidth).toBeGreaterThan(0);
	});

	test('地圖載入錯誤處理', async ({ page }) => {
		// 攔截地圖相關的請求
		await page.route('**/taiwan_geo.json', (route) => route.abort());

		// 重新載入頁面
		await page.reload();

		// 檢查地圖容器仍然存在
		await expect(page.locator('.map')).toBeVisible({ timeout: 10000 });

		// 檢查基本功能仍然可用
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible();
	});

	test('地圖與天氣資料同步', async ({ page }) => {
		// 等待所有元素載入
		await expect(page.locator('.map')).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		const buttons = page.locator('button');
		const buttonCount = await buttons.count();

		if (buttonCount >= 2) {
			// 點擊第一個縣市
			const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
			const firstCity = await firstButton.textContent();
			await firstButton.click();

			await expect(page.getByText(`縣市：${firstCity}`)).toBeVisible({
				timeout: 10000
			});

			// 點擊第二個縣市
			const secondButton = page.getByRole('button', { name: /查看 .* 的天氣/ }).nth(1);
			const secondCity = await secondButton.textContent();
			await secondButton.click();

			await expect(page.getByText(`縣市：${secondCity}`)).toBeVisible({
				timeout: 10000
			});

			// 確認資料已切換
			await expect(page.getByText(`縣市：${firstCity}`)).not.toBeVisible();
		}
	});
});
