import { expect, test, weatherEnvelope, weatherFixture } from './fixtures';

test('三個時段顯示真實 PoP 欄位、零降雨機率與溫度', async ({ page }) => {
	// GIVEN: The CWA-shaped fixture includes 20%, 0%, and 60% probabilities.
	await page.goto('/');

	// WHEN: Selecting Taipei.
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');

	// THEN: Each forecast carries the exact time and weather values.
	const cards = page.getByRole('article');
	await expect(cards).toHaveCount(3);
	await expect(cards.nth(0)).toContainText('09/26 12:00至 09/26 18:00');
	await expect(cards.nth(1)).toContainText('09/26 18:00至 09/27 06:00');
	await expect(cards.nth(2)).toContainText('09/27 06:00至 09/27 18:00');
	await expect(cards.nth(0)).toContainText('降雨機率：20百分比');
	await expect(cards.nth(1)).toContainText('降雨機率：0百分比');
	await expect(cards.nth(2)).toContainText('降雨機率：60百分比');
	await expect(cards.nth(0)).toContainText('晴時多雲');
	await expect(cards.nth(0)).toContainText('最高溫：30°C');
	await expect(cards.nth(0)).toContainText('低溫：25°C');
	await expect(cards.nth(0)).toContainText('舒適度：舒適');
});

test('缺少降雨機率時明確顯示暫無資料', async ({ page }) => {
	// GIVEN: Taipei has forecast periods but no PoP element.
	const data = structuredClone(weatherFixture);
	data.records.location[0].weatherElement = data.records.location[0].weatherElement.filter(
		(element) => element.elementName !== 'PoP'
	);
	await page.route('**/api/weather', (route) => route.fulfill({ json: weatherEnvelope(data) }));
	await page.goto('/');

	// WHEN: Selecting the city with incomplete data.
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');

	// THEN: Missing precipitation is distinguished from zero.
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.getByRole('article').filter({ hasText: '降雨機率：暫無資料' })).toHaveCount(3);
	await expect(page.getByText('降雨機率：0百分比', { exact: true })).toHaveCount(0);
});

test('選擇沒有預報的縣市會清除前一縣市卡片', async ({ page }) => {
	// GIVEN: Taipei's cards are visible and the fixture has no Kaohsiung forecast.
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByRole('article')).toHaveCount(3);

	// WHEN: Selecting Kaohsiung.
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('高雄市');

	// THEN: An explicit empty state replaces the previous city's data.
	await expect(page.getByText('暫無 高雄市 的天氣資料。', { exact: true })).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(0);
	await expect(page.getByText('縣市：臺北市', { exact: true })).toHaveCount(0);
});
