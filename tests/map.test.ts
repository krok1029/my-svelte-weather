import { expect, test } from './fixtures';

test('地圖 HTTP 錯誤不影響天氣並可單獨重試', async ({ page }) => {
	// GIVEN: The first map-data request returns a non-success HTTP status.
	await page.route('**/taiwan_geo.json', (route) => route.fulfill({ status: 500, json: {} }), {
		times: 1
	});
	await page.goto('/');
	await expect(page.getByText('地圖資料載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();
	await expect(page.getByRole('article')).toHaveCount(3);

	// WHEN: Retrying the map request.
	await page.getByRole('button', { name: '重新載入地圖', exact: true }).click();

	// THEN: The real geographic layer loads with the existing selected city.
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺北市');
	await expect(page.getByText('地圖資料載入失敗，請稍後重試。', { exact: true })).toHaveCount(0);
});

test('按鈕選取同步至地圖且移出地圖後保留選取', async ({ page }) => {
	// GIVEN: The real county layer has loaded.
	await page.goto('/');
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();

	// WHEN: Selecting Taipei and moving the pointer across and out of the map.
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();
	await page.locator('.map').hover();
	await page.getByText('請選擇縣市查看天氣資訊', { exact: true }).hover();

	// THEN: The shared selected city and weather remain selected.
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺北市');
	await expect(
		page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('article').first()).toContainText('最高溫：30°C');
});

test('點選地圖縣市同步選取按鈕與天氣卡片', async ({ page }) => {
	// GIVEN: The map is at its initial center and zoom with real county geometry.
	await page.goto('/');
	const map = page.locator('.map');
	await expect(map).toHaveAttribute('data-ready', 'true');
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await map.scrollIntoViewIfNeeded();
	const taichungPoint = await map.evaluate((element) => {
		const scale = 256 * 2 ** 8;
		const latitudeY = (latitude: number) => {
			const sine = Math.sin((latitude * Math.PI) / 180);
			return (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale;
		};
		return {
			x: element.clientWidth / 2 + ((120.67 - 120.9795) / 360) * scale,
			y: element.clientHeight / 2 + latitudeY(24.17) - latitudeY(23.5283)
		};
	});

	// WHEN: Clicking a point inside Taichung's actual polygon.
	await map.click({ position: taichungPoint });

	// THEN: The map selection is reflected by the corresponding button and forecast.
	await expect(map).toHaveAttribute('data-selected-city', '臺中市');
	await expect(
		page.getByRole('button', { name: '查看 臺中市 的天氣', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText('縣市：臺中市', { exact: true })).toBeVisible();
	await expect(page.getByRole('article').first()).toContainText('最高溫：32°C');
});
