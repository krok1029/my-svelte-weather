import { expect, test } from '@playwright/test';

test('首頁顯示天氣預報標題', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /天氣預報/ })).toBeVisible();
});
