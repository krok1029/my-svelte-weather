import { expect, test, districtWeatherEnvelope } from './fixtures';
import { clickCoordinate, settleMap } from './map-helpers';

test('選縣市會放大地圖，選行政區會顯示當地預報並再次聚焦', async ({ page }) => {
	// GIVEN: The real map and independent county/district forecasts are available.
	const tileZooms: number[] = [];
	page.on('request', (request) => {
		const url = new URL(request.url());
		if (url.hostname.endsWith('tile.openstreetmap.org'))
			tileZooms.push(Number(url.pathname.split('/')[1]));
	});
	await page.goto('/');
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();

	// WHEN: Selecting Taipei and then Neihu.
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect.poll(() => Math.max(...tileZooms)).toBeGreaterThan(8);
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');

	// THEN: The district has its own weather and the map requests district-level tiles.
	await expect(page.getByRole('heading', { name: /臺北市\s*\/\s*內湖區/ })).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(1);
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await expect(page.getByRole('article')).toContainText('降雨機率：0%');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
	await settleMap(page);
	await expect.poll(() => Math.max(...tileZooms)).toBeGreaterThanOrEqual(11);
	await expect(page.locator('.leaflet-district-boundaries-pane path')).toHaveCount(12);
	await expect(page.getByRole('button', { name: 'Toggle user menu' })).toHaveCount(0);
});

test('行政區切換、返回縣市與全臺總覽會清除先前選取', async ({ page }) => {
	// GIVEN: Neihu is selected.
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');

	// WHEN: Switching to Songshan.
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('松山區');

	// THEN: The forecast belongs to Songshan.
	await expect(page.getByRole('article')).toContainText('33–34°C');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'松山區'
	);

	// WHEN: Returning to the county forecast and then the Taiwan overview.
	await page.getByRole('button', { name: '返回縣市預報', exact: true }).click();
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '');
	await page.getByRole('button', { name: '全臺總覽', exact: true }).click();

	// THEN: County and district selections are both cleared.
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toBeDisabled();
	await expect(page.getByRole('article')).toHaveCount(0);
});

test('行政區失敗不冒用縣市預報，重試後顯示所選行政區', async ({ page }) => {
	// GIVEN: The first district request fails independently of the county weather.
	await page.route(
		'**/api/weather/districts?*',
		(route) => route.fulfill({ status: 503, json: {} }),
		{ times: 1 }
	);
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByRole('article')).toHaveCount(3);
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByText('行政區天氣載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(0);

	// WHEN: Retrying the district request.
	await page.getByRole('button', { name: '重新載入行政區天氣', exact: true }).click();

	// THEN: Only Neihu's district weather is displayed.
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await expect(page.getByText('行政區天氣載入失敗，請稍後重試。', { exact: true })).toHaveCount(0);
});

test('切換縣市後晚到的行政區回應不會覆蓋新縣市', async ({ page }) => {
	// GIVEN: Taipei's district response is held pending.
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/api/weather/districts?*', async (route) => {
		const city = new URL(route.request().url()).searchParams.get('city') ?? '';
		if (city === '臺北市') await pending;
		await route.fulfill({ json: districtWeatherEnvelope(city) });
	});
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');

	// WHEN: Switching to Taichung before releasing the Taipei response.
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺中市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('西屯區');
	release();

	// THEN: The map and forecast retain Taichung/Xitun.
	await expect(page.getByRole('heading', { name: /臺中市\s*\/\s*西屯區/ })).toBeVisible();
	await expect(page.getByRole('article')).toContainText('31–32°C');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺中市');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '西屯區');
	await expect(
		page.getByRole('button', { name: '查看 臺北市內湖區 的天氣', exact: true })
	).toHaveCount(0);
});

test('行政區端點驗證縣市並安全處理缺少 Token', async ({ request }) => {
	// GIVEN: The preview service has no private token.
	// WHEN: Requesting an unsupported and a supported city.
	const invalid = await request.get('/api/weather/districts?city=invalid');
	const unavailable = await request.get('/api/weather/districts?city=臺北市');

	// THEN: Invalid input is rejected and upstream configuration stays private.
	expect(invalid.status()).toBe(400);
	expect(unavailable.status()).toBe(503);
	expect(await unavailable.json()).toEqual({ message: '天氣資料暫時無法取得，請稍後重試。' });
});

test('行政區框線可點選，晚到的縣市邊界不會遮住行政區', async ({ page }) => {
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/taiwan_geo.json', async (route) => {
		const response = await route.fetch();
		await pending;
		await route.fulfill({ response });
	});
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	const map = page.locator('.map');
	await expect(map).toHaveAttribute('data-boundaries-ready', 'true');
	release();
	await expect(map).toHaveAttribute('data-ready', 'true');
	await settleMap(page);
	await expect(page.locator('.leaflet-district-boundaries-pane path')).toHaveCount(12);
	await clickCoordinate(page, 25.051608, 121.568983);
	await expect(map).toHaveAttribute('data-selected-district', '松山區');
	await expect(page.getByRole('article')).toContainText('33–34°C');
});

test('框線失敗可單獨重試，天氣與地區選擇仍可使用', async ({ page }) => {
	await page.route(
		'**/boundaries/63000.json',
		(route) => route.fulfill({ status: 503, json: {} }),
		{ times: 1 }
	);
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByText('行政區框線載入失敗。', { exact: true })).toBeVisible();
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await page.getByRole('button', { name: '重新載入框線', exact: true }).click();
	await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
	await expect(page.locator('.leaflet-district-boundaries-pane path')).toHaveCount(12);
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
});
