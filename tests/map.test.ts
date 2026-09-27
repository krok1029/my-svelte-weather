import { expect, test } from './fixtures';
import { clickCoordinate, settleMap } from './map-helpers';

test('地圖 HTTP 錯誤不影響天氣並可單獨重試', async ({ page }) => {
	// GIVEN: The first map-data request returns a non-success HTTP status.
	await page.route('**/taiwan_geo.json', (route) => route.fulfill({ status: 500, json: {} }), {
		times: 1
	});
	await page.goto('/');
	await expect(page.getByText('地圖資料載入失敗，請稍後重試。', { exact: true })).toBeVisible();
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.getByRole('article')).toHaveCount(3);

	// WHEN: Retrying the map request.
	await page.getByRole('button', { name: '重新載入地圖', exact: true }).click();

	// THEN: The real geographic layer loads with the existing selected city.
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺北市');
	await expect(page.getByText('地圖資料載入失敗，請稍後重試。', { exact: true })).toHaveCount(0);
});

test('選單選取同步至地圖且移出地圖後保留選取', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.leaflet-overlay-pane canvas')).toBeVisible();
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.locator('.map').hover();
	await page.getByRole('heading', { name: '每一地，都有自己的天氣。' }).hover();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺北市');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('臺北市');
	await expect(page.getByRole('article').first()).toContainText('最高溫：30°C');
});

test('點選實際縣市地圖同步選單與天氣', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
	await clickCoordinate(page, 24.17, 120.67);
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺中市');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('臺中市');
	await expect(page.getByRole('article').first()).toContainText('最高溫：32°C');
});

test('縮放有上下限，拖到完全沒有陸地時回復安全視野', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
	const map = await settleMap(page);
	await map.scrollIntoViewIfNeeded();
	const zoomIn = page.getByRole('button', { name: '放大地圖', exact: true });
	const zoomOut = page.getByRole('button', { name: '縮小地圖', exact: true });
	for (let i = 0; i < 10; i++) {
		if ((await zoomIn.getAttribute('aria-disabled')) === 'true') break;
		const before = Number(await map.getAttribute('data-zoom'));
		await zoomIn.click();
		await expect(map).toHaveAttribute('data-zoom', String(before + 1));
	}
	await expect(map).toHaveAttribute('data-zoom', '15');
	await expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
	for (let i = 0; i < 12; i++) {
		if ((await zoomOut.getAttribute('aria-disabled')) === 'true') break;
		const before = Number(await map.getAttribute('data-zoom'));
		await zoomOut.click();
		await expect(map).toHaveAttribute('data-zoom', String(before - 1));
	}
	await expect(map).toHaveAttribute('data-zoom', '6');
	await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
	// At overview scale, dragging many viewport widths cannot abandon Taiwan.
	for (let i = 0; i < 5; i++) {
		const box = await map.boundingBox();
		if (!box) throw new Error('Missing map');
		await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5, { steps: 8 });
		await page.mouse.up();
		await settleMap(page);
	}
	const center = await map.evaluate((el) => ({
		lat: Number((el as HTMLElement).dataset.latitude),
		lng: Number((el as HTMLElement).dataset.longitude)
	}));
	expect(center.lng).toBeGreaterThan(116);
	expect(center.lng).toBeLessThan(125);
	expect(center.lat).toBeGreaterThan(20);
	expect(center.lat).toBeLessThan(27);
});

test('拖曳到海上時保留上一個含陸地的視野', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('.map')).toHaveAttribute('data-ready', 'true');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect(page.locator('.map')).toHaveAttribute('data-boundaries-ready', 'true');
	const map = await settleMap(page);
	await map.scrollIntoViewIfNeeded();
	let restored = false;
	for (let i = 0; i < 8; i++) {
		const before = Number(await map.getAttribute('data-longitude'));
		const box = await map.boundingBox();
		if (!box) throw new Error('Missing map');
		await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5, { steps: 12 });
		await expect(map).toHaveAttribute('data-moving', 'true');
		await page.mouse.up();
		await settleMap(page);
		const after = Number(await map.getAttribute('data-longitude'));
		// These westward drags reach open sea well before the rectangular navigation limit.
		expect(after).toBeGreaterThan(119);
		if (Math.abs(after - before) < 0.0001) {
			restored = true;
			break;
		}
	}
	expect(restored).toBe(true);
});
