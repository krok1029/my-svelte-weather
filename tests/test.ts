import { expect, test } from '@playwright/test';

test('首頁顯示天氣預報標題', async ({ page }) => {
	await page.goto('/');
	
	// Wait for the page to load and look for the title text
	// The title should either be the default '天氣預報' or the actual dataset description
	await expect(page.getByText('天氣預報')).toBeVisible({
		timeout: 10000
	});
});

test('首頁顯示基本元素', async ({ page }) => {
	await page.goto('/');
	
	// Wait for the description text to appear
	await expect(page.getByText('請選擇縣市查看天氣資訊')).toBeVisible({ timeout: 10000 });
	
	// Check if the map container is present
	await expect(page.locator('.map')).toBeVisible({ timeout: 10000 });
});
