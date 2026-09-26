import { expect, test, weatherEnvelope } from './fixtures';

test('天氣載入期間可先選縣市並在回應後自動顯示預報', async ({ page }) => {
	// GIVEN: Weather is held pending while static data can finish independently.
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/api/weather', async (route) => {
		await pending;
		await route.fulfill({ json: weatherEnvelope() });
	});
	await page.goto('/');
	await expect(page.getByText('天氣資料載入中…', { exact: true })).toBeVisible();
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();
	await expect(page.getByRole('article')).toHaveCount(0);

	// WHEN: The delayed weather response arrives.
	release();

	// THEN: The current selection fills automatically without a second click.
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.getByRole('article').first()).toContainText('降雨機率：20百分比');
	await expect(page.getByText('天氣資料載入中…', { exact: true })).toHaveCount(0);
});

test('天氣失敗不阻擋地圖與縣市並可單獨重試', async ({ page }) => {
	// GIVEN: The first weather request fails with a server error.
	await page.route(
		'**/api/weather',
		(route) => route.fulfill({ status: 503, json: { message: 'unavailable' } }),
		{ times: 1 }
	);
	await page.goto('/');
	await expect(page.getByText('天氣資料載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();

	// WHEN: Retrying only weather.
	await page.getByRole('button', { name: '重新載入天氣', exact: true }).click();

	// THEN: Forecast appears for the retained selection and the error clears.
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(page.getByText('天氣資料載入失敗，請稍後重試。', { exact: true })).toHaveCount(0);
	await expect(
		page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
});

test('縣市清單 HTTP 錯誤可重試且不阻擋天氣與地圖', async ({ page }) => {
	// GIVEN: The first city-list request returns an HTTP error.
	await page.route(
		'**/taiwan_districts.json',
		(route) => route.fulfill({ status: 500, json: [] }),
		{ times: 1 }
	);
	await page.goto('/');
	await expect(page.getByText('縣市清單載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await expect(page.getByText('三十六小時天氣預報', { exact: true })).toBeVisible();
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();

	// WHEN: Retrying the city list.
	await page.getByRole('button', { name: '重新載入縣市', exact: true }).click();

	// THEN: The actual city list becomes usable.
	await expect(page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true })).toBeVisible();
	await expect(page.getByText('縣市清單載入失敗，請稍後重試。', { exact: true })).toHaveCount(0);
});

test('快取資料標示來源並可更新為最新資料', async ({ page }) => {
	// GIVEN: The service returns a stale but usable response first.
	await page.route(
		'**/api/weather',
		(route) => route.fulfill({ json: weatherEnvelope(undefined, true) }),
		{ times: 1 }
	);
	await page.goto('/');
	await page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true }).click();
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(
		page.getByText('目前顯示快取資料，氣象服務暫時無法更新。', { exact: true })
	).toBeVisible();
	await expect(page.getByText(/^資料取得時間：/)).toBeVisible();

	// WHEN: Requesting a fresh forecast.
	await page.getByRole('button', { name: '更新天氣', exact: true }).click();

	// THEN: Fresh data replaces the stale status without losing the selection.
	await expect(
		page.getByText('目前顯示快取資料，氣象服務暫時無法更新。', { exact: true })
	).toHaveCount(0);
	await expect(page.getByRole('article')).toHaveCount(3);
	await expect(
		page.getByRole('button', { name: '查看 臺北市 的天氣', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
});

test('瀏覽器只向同源端點要求天氣且不傳送 Authorization', async ({ page }) => {
	// GIVEN: Requests are recorded before navigation.
	const weatherRequest = page.waitForRequest('**/api/weather');
	const upstreamRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('opendata.cwa.gov.tw')) upstreamRequests.push(request.url());
	});

	// WHEN: The homepage loads its weather data.
	await page.goto('/');
	const request = await weatherRequest;
	await expect(page.getByText('三十六小時天氣預報', { exact: true })).toBeVisible();

	// THEN: No API token or direct upstream request is made by the browser.
	expect(new URL(request.url()).pathname).toBe('/api/weather');
	expect(new URL(request.url()).search).toBe('');
	expect(request.headers().authorization).toBeUndefined();
	expect(upstreamRequests).toEqual([]);
});

test('未設定伺服器 Token 的實際端點回傳安全錯誤', async ({ request }) => {
	// GIVEN: The preview server starts with an empty private token.
	// WHEN: Calling the actual endpoint without the browser fixture interception.
	const response = await request.get('/api/weather');

	// THEN: The endpoint reports service unavailability without leaking configuration.
	expect(response.status()).toBe(503);
	expect(response.headers()['cache-control']).toBe('no-store');
	expect(await response.json()).toEqual({ message: '天氣資料暫時無法取得，請稍後重試。' });
});
