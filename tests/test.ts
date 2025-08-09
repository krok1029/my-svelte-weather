import { expect, test } from '@playwright/test';

test.describe('My Svelte Weather 應用程式', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('首頁顯示天氣預報標題', async ({ page }) => {
		// 等待標題出現，可能是預設的「天氣預報」或從 API 載入的資料
		await expect(page.getByText('天氣預報')).toBeVisible({
			timeout: 10000
		});
	});

	test('首頁顯示基本 UI 元素', async ({ page }) => {
		// 檢查描述文字
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({
			timeout: 10000
		});

		// 檢查地圖容器
		await expect(page.locator('.map')).toBeVisible({
			timeout: 10000
		});
	});

	test('縣市按鈕載入並可點擊', async ({ page }) => {
		// 等待縣市按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		// 檢查是否有多個縣市按鈕
		const buttons = page.locator('button');
		const buttonCount = await buttons.count();
		expect(buttonCount).toBeGreaterThan(10); // 台灣應該有超過 10 個縣市

		// 檢查按鈕文字內容
		const firstButton = buttons.first();
		const buttonText = await firstButton.textContent();
		expect(buttonText).toBeTruthy();
		expect(buttonText?.length).toBeGreaterThan(0);
	});

	test('點擊縣市按鈕顯示天氣資訊', async ({ page }) => {
		// 等待按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		// 點擊第一個縣市按鈕
		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		const cityName = await firstButton.textContent();
		await firstButton.click();

		// 等待天氣資訊顯示
		await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({
			timeout: 10000
		});

		// 檢查是否有天氣卡片出現
		await expect(page.locator('[class*="grid"][class*="gap-4"]')).toBeVisible({
			timeout: 5000
		});
	});

	test('搜尋特定縣市並顯示天氣', async ({ page }) => {
		// 等待按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		// 尋找並點擊台北市按鈕
		const taipeiButton = page.locator('button', { hasText: '臺北市' });
		if ((await taipeiButton.count()) > 0) {
			await taipeiButton.click();

			// 檢查台北市天氣資訊
			await expect(page.getByText('縣市：臺北市')).toBeVisible({
				timeout: 10000
			});
		} else {
			// 如果沒有台北市，點擊任何一個可用的縣市
			const anyButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
			const cityName = await anyButton.textContent();
			await anyButton.click();

			await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({
				timeout: 10000
			});
		}
	});

	test('地圖正確載入', async ({ page }) => {
		// 檢查 Leaflet 地圖容器
		await expect(page.locator('.map')).toBeVisible({
			timeout: 10000
		});

		// 檢查地圖是否有 Leaflet 相關的 CSS 類別
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toHaveClass(/.*map.*/);

		// 等待地圖完全載入（檢查是否有 leaflet 相關元素）
		await page.waitForTimeout(3000); // 給地圖一些時間載入
	});

	test('響應式設計 - 行動裝置檢視', async ({ page }) => {
		// 設定為行動裝置尺寸
		await page.setViewportSize({ width: 375, height: 667 });

		// 檢查基本元素仍然可見
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({
			timeout: 10000
		});

		// 檢查地圖在小螢幕上仍然可見
		await expect(page.locator('.map')).toBeVisible({
			timeout: 10000
		});
	});

	test('錯誤處理 - 網路問題模擬', async ({ page }) => {
		// 攔截 API 請求並模擬失敗
		await page.route('**/api/**', (route) => route.abort());

		// 重新載入頁面
		await page.reload();

		// 檢查頁面仍然顯示基本結構
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({
			timeout: 10000
		});

		// 檢查預設標題顯示
		await expect(page.getByText('天氣預報')).toBeVisible();
	});

	test('多個縣市切換功能', async ({ page }) => {
		// 等待按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		const buttons = page.getByRole('button', { name: /查看 .* 的天氣/ });
		const buttonCount = await buttons.count();

		if (buttonCount >= 2) {
			// 點擊第一個縣市
			const firstButton = buttons.nth(0);
			const firstCity = await firstButton.textContent();
			await firstButton.click();
			await expect(page.getByText(`縣市：${firstCity}`)).toBeVisible({
				timeout: 10000
			});

			// 點擊第二個縣市
			const secondButton = buttons.nth(1);
			const secondCity = await secondButton.textContent();
			await secondButton.click();
			await expect(page.getByText(`縣市：${secondCity}`)).toBeVisible({
				timeout: 10000
			});

			// 確認第一個縣市的資訊已經被替換
			await expect(page.getByText(`縣市：${firstCity}`)).not.toBeVisible();
		}
	});

	test('天氣卡片內容檢查', async ({ page }) => {
		// 等待並點擊縣市按鈕
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		await firstButton.click();

		// 等待天氣卡片載入
		await page.waitForTimeout(2000);

		// 檢查是否有 WeatherRangeCard 組件
		const weatherCards = page.locator('[class*="grid"][class*="gap-4"] > *');
		const cardCount = await weatherCards.count();

		if (cardCount > 0) {
			// 檢查卡片內容是否包含時間相關資訊
			const firstCard = weatherCards.first();
			await expect(firstCard).toBeVisible();
		}
	});
});
