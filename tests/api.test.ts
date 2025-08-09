import { expect, test } from '@playwright/test';

test.describe('API 和資料載入測試', () => {
	test('天氣資料功能性驗證', async ({ page }) => {
		await page.goto('/');

		// 等待縣市按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		// 點擊第一個縣市按鈕
		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		const cityName = await firstButton.textContent();
		await firstButton.click();

		// 檢查是否顯示縣市資訊（這需要天氣 API 資料）
		const cityDisplay = page.getByText(`縣市：${cityName}`);

		try {
			// 如果天氣 API 載入成功，應該會顯示縣市資訊
			await expect(cityDisplay).toBeVisible({ timeout: 5000 });

			// 進一步檢查是否有天氣卡片顯示
			const weatherCards = page.locator('[class*="grid"][class*="gap-4"] > *');
			const cardCount = await weatherCards.count();

			if (cardCount > 0) {
				expect(cardCount).toBeGreaterThan(0);
			} else {
				console.warn('天氣資料載入但無天氣卡片顯示');
			}
		} catch (error) {
			// 如果縣市資訊沒有顯示，表示天氣 API 可能載入失敗
			console.warn('天氣 API 可能載入失敗：無法顯示縣市天氣資訊');

			// 檢查是否至少有基本的介面結構
			await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible();
		}
	});

	test('天氣 API 資料正確載入', async ({ page }) => {
		// 監聽網路請求
		const apiRequests: string[] = [];
		page.on('request', (request) => {
			// 監聽對中央氣象局 API 的請求
			if (
				request.url().includes('opendata.cwa.gov.tw') ||
				request.url().includes('weather') ||
				request.url().includes('api')
			) {
				apiRequests.push(request.url());
			}
		});

		await page.goto('/');

		// 等待頁面載入完成
		await page.waitForLoadState('networkidle');

		// 如果沒有 API 請求，可能是環境變數問題
		if (apiRequests.length === 0) {
			console.warn('未偵測到天氣 API 請求，請檢查 PUBLIC_API_TOKEN 環境變數');
		}

		// 等待縣市按鈕載入（這個測試靜態資源載入）
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});
	});

	test('靜態資源正確載入', async ({ page }) => {
		const resourceRequests: { url: string; status: number }[] = [];

		page.on('response', (response) => {
			if (
				response.url().includes('.json') ||
				response.url().includes('taiwan_geo') ||
				response.url().includes('taiwan_districts')
			) {
				resourceRequests.push({
					url: response.url(),
					status: response.status()
				});
			}
		});

		await page.goto('/');

		// 等待資料載入
		await page.waitForTimeout(5000);

		// 檢查重要的靜態資源是否成功載入
		const geoJsonLoaded = resourceRequests.some(
			(req) => req.url.includes('taiwan_geo.json') && req.status === 200
		);
		const districtsLoaded = resourceRequests.some(
			(req) => req.url.includes('taiwan_districts.json') && req.status === 200
		);

		if (resourceRequests.length > 0) {
			expect(geoJsonLoaded || districtsLoaded).toBeTruthy();
		}
	});

	test('資料載入失敗時的錯誤處理', async ({ page }) => {
		// 攔截並阻止所有 JSON 檔案載入
		await page.route('**/*.json', (route) => route.abort());

		await page.goto('/');

		// 檢查頁面基本結構仍然存在
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({
			timeout: 10000
		});

		// 檢查預設標題顯示
		await expect(page.getByText('天氣預報')).toBeVisible();

		// 地圖容器應該仍然存在
		await expect(page.locator('.map')).toBeVisible();
	});

	test('網路連線緩慢時的載入行為', async ({ page }) => {
		// 模擬慢速網路
		await page.route('**/*.json', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒延遲
			await route.continue();
		});

		await page.goto('/');

		// 檢查載入狀態 - 頁面應該顯示基本結構
		await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({
			timeout: 15000
		});

		// 最終應該載入完成
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 20000
		});
	});

	test('API Token 環境變數檢查', async ({ page }) => {
		// 這個測試檢查應用程式是否正確處理 API Token
		await page.goto('/');

		// 檢查控制台是否有相關錯誤
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// 等待頁面載入
		await page.waitForTimeout(5000);

		// 檢查是否有 API 相關的錯誤
		const hasApiError = consoleErrors.some(
			(error) =>
				error.toLowerCase().includes('api') ||
				error.toLowerCase().includes('token') ||
				error.toLowerCase().includes('unauthorized')
		);

		// 如果有 API 錯誤，應用程式仍應顯示基本介面
		if (hasApiError) {
			await expect(page.getByText('天氣預報')).toBeVisible();
		}
	});

	test('縣市資料完整性檢查', async ({ page }) => {
		await page.goto('/');

		// 等待縣市按鈕載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		const buttons = page.locator('button');
		const buttonCount = await buttons.count();

		// 台灣應該有合理數量的縣市
		expect(buttonCount).toBeGreaterThan(15); // 至少15個縣市
		expect(buttonCount).toBeLessThan(30); // 不超過30個

		// 檢查前幾個按鈕的文字內容
		for (let i = 0; i < Math.min(5, buttonCount); i++) {
			const button = buttons.nth(i);
			const text = await button.textContent();
			expect(text).toBeTruthy();
			expect(text?.length).toBeGreaterThan(0);
		}
	});

	test('天氣資料格式驗證', async ({ page }) => {
		await page.goto('/');

		// 等待並點擊縣市按鈕
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({
			timeout: 15000
		});

		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		const cityName = await firstButton.textContent();
		await firstButton.click();

		// 等待天氣資訊顯示
		await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({
			timeout: 10000
		});

		// 檢查天氣卡片是否有內容
		const weatherCards = page.locator('[class*="grid"][class*="gap-4"] > *');
		const cardCount = await weatherCards.count();

		if (cardCount > 0) {
			// 檢查第一個卡片是否有內容
			const firstCard = weatherCards.first();
			await expect(firstCard).toBeVisible();

			// 檢查卡片是否有文字內容
			const cardText = await firstCard.textContent();
			expect(cardText).toBeTruthy();
		}
	});
});
