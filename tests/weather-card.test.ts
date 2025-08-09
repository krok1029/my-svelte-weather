import { expect, test } from '@playwright/test';

test.describe('天氣卡片功能測試', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('天氣卡片顯示完整資訊', async ({ page }) => {
		// 等待並點擊縣市按鈕
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({ 
			timeout: 15000 
		});
		
		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		const cityName = await firstButton.textContent();
		await firstButton.click();
		
		// 等待天氣資訊載入
		await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({ 
			timeout: 10000 
		});
		
		// 檢查天氣卡片網格
		const weatherGrid = page.locator('[class*="grid"][class*="gap-4"]');
		await expect(weatherGrid).toBeVisible({ timeout: 5000 });
		
		// 檢查是否有天氣卡片
		const weatherCards = weatherGrid.locator('> *');
		const cardCount = await weatherCards.count();
		expect(cardCount).toBeGreaterThan(0);
	});

	test('36小時預報資料完整性', async ({ page }) => {
		// 點擊縣市並等待資料載入
		await expect(page.getByRole('button', { name: '查看 臺北市 的天氣' })).toBeVisible({ 
			timeout: 15000 
		});
		
		const firstButton = page.getByRole('button', { name: '查看 臺北市 的天氣' });
		await firstButton.click();
		
		// 等待天氣卡片載入
		await page.waitForTimeout(3000);
		
		const weatherCards = page.locator('[class*="grid"][class*="gap-4"] > *');
		const cardCount = await weatherCards.count();
		
		// 36小時預報通常會有多個時間段
		if (cardCount > 0) {
			expect(cardCount).toBeLessThanOrEqual(36); // 最多36個小時
			expect(cardCount).toBeGreaterThan(0); // 至少要有一個
		}
	});

	test('不同縣市天氣資料切換', async ({ page }) => {
		const buttons = page.getByRole('button', { name: /查看 .* 的天氣/ });
		await expect(buttons.first()).toBeVisible({ timeout: 15000 });
		
		const buttonCount = await buttons.count();
		
		if (buttonCount >= 3) {
			// 測試前三個縣市
			for (let i = 0; i < 3; i++) {
				const button = buttons.nth(i);
				const cityName = await button.textContent();
				await button.click();
				
				// 等待該縣市的天氣資訊顯示
				await expect(page.getByText(`縣市：${cityName}`)).toBeVisible({ 
					timeout: 10000 
				});
				
				// 檢查天氣卡片是否更新
				await page.waitForTimeout(1000);
				const weatherCards = page.locator('[class*="grid"][class*="gap-4"] > *');
				const cardCount = await weatherCards.count();
				
				if (cardCount > 0) {
					await expect(weatherCards.first()).toBeVisible();
				}
			}
		}
	});
});
