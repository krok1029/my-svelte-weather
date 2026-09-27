import { expect, test } from './fixtures';

test('直接搜尋內湖與松山會選取縣市及行政區，原下拉選單仍可操作', async ({ page }) => {
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('內湖');
	const option = page.getByRole('option', { name: '內湖區 臺北市', exact: true });
	await expect(option).toBeVisible();
	const bounds = await option.boundingBox();
	expect(bounds?.height).toBeGreaterThanOrEqual(44);
	await option.click();
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('臺北市');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'內湖區'
	);
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await expect(input).toBeFocused();
	await expect(input).toHaveAttribute('aria-expanded', 'false');
	await input.fill(' 松山 ');
	await input.press('Enter');
	await expect(page.getByRole('article')).toContainText('33–34°C');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByRole('article')).toContainText('29–30°C');
});

test('同名行政區保留縣市資訊，鍵盤上下選取與 Escape 不改變目前位置', async ({ page }) => {
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('中正區');
	const options = page.getByRole('listbox', { name: '地區搜尋結果' }).getByRole('option');
	await expect(options).toHaveCount(2);
	await expect(options.nth(0)).toContainText('臺北市');
	await expect(options.nth(1)).toContainText('基隆市');
	await input.press('ArrowDown');
	await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
	await expect(input).toHaveAttribute(
		'aria-activedescendant',
		(await options.nth(0).getAttribute('id'))!
	);
	await input.press('ArrowDown');
	await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
	await input.press('ArrowUp');
	await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
	await input.press('Escape');
	await expect(input).toHaveValue('中正區');
	await expect(page.getByRole('listbox')).toHaveCount(0);
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('');
	await input.press('ArrowUp');
	await input.press('Enter');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('基隆市');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'中正區'
	);
});

test('台與臺搜尋相同，選縣市結果會回到全縣市預報', async ({ page }) => {
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('內湖');
	await input.press('Enter');
	await expect(page.getByRole('article')).toHaveCount(1);
	await input.fill(' 台北市 ');
	await page.getByRole('option', { name: '臺北市 全縣市預報', exact: true }).click();
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue('');
	await expect(page.getByRole('article')).toHaveCount(3);
	await input.fill('臺北市');
	await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(13);
});

test('空白與無結果查詢保留提示，Tab 離開搜尋收起結果', async ({ page }) => {
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('   ');
	await expect(page.getByRole('listbox')).toHaveCount(0);
	await expect(page.getByText('輸入地名，直接前往預報。', { exact: true })).toBeVisible();
	await input.fill('不存在的地名');
	await expect(
		page.getByText('找不到符合的地區，請試試縣市或行政區名稱，例如「內湖」。', { exact: true })
	).toBeVisible();
	await input.press('Enter');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('');
	await input.fill('松山');
	await input.press('Tab');
	await expect(page.getByRole('listbox')).toHaveCount(0);
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toBeFocused();
});

test('輸入法組字 Enter 不提前選取地區', async ({ page }) => {
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('內湖');
	await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('');
	await expect(input).toHaveAttribute('aria-expanded', 'true');
	await input.press('Enter');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'內湖區'
	);
});

test('搜尋清單失敗時可隨既有重試恢復', async ({ page }) => {
	await page.route(
		'**/taiwan_districts.json',
		(route) => route.fulfill({ status: 503, body: '' }),
		{ times: 1 }
	);
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await expect(page.getByText('地區清單暫時無法使用。', { exact: true })).toBeVisible();
	await expect(input).toBeDisabled();
	await page.getByRole('button', { name: '重新載入縣市', exact: true }).click();
	await expect(input).toBeEnabled();
	await input.fill('內湖');
	await expect(page.getByRole('option', { name: '內湖區 臺北市', exact: true })).toBeVisible();
});

test('小螢幕搜尋結果可觸控選取且不橫向溢出', async ({ page, isMobile }, testInfo) => {
	test.skip(!isMobile, 'Touch behavior is covered by mobile browser projects.');
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/');
	const input = page.getByRole('combobox', { name: '搜尋縣市或行政區', exact: true });
	await input.fill('松山');
	await page.screenshot({ path: testInfo.outputPath('search-portrait.png') });
	await page.getByRole('option', { name: '松山區 臺北市', exact: true }).tap();
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'松山區'
	);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true
	);
	await page.setViewportSize({ width: 812, height: 375 });
	await page.evaluate(() => document.documentElement.classList.add('dark'));
	await input.fill('中正區');
	await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(2);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true
	);
	await page
		.locator('.location-search')
		.screenshot({ path: testInfo.outputPath('search-landscape-dark.png') });
});
