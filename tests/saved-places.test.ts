import { expect, test } from './fixtures';

test('地區網址可直接開啟，重新整理與新分頁保留同一地區', async ({ page, context }) => {
	await page.goto('/?city=臺北市&district=內湖區');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('臺北市');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'內湖區'
	);
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await page.reload();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
	const share = page.url();
	const second = await context.newPage();
	await second.goto(share);
	await expect(second.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'內湖區'
	);
	await second.close();
});

test('記住上次地區，但明確網址優先，上一頁下一頁與全臺總覽皆同步', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect.poll(() => new URL(page.url()).searchParams.get('district')).toBe('內湖區');
	await page.goto('/');
	await expect(page.getByRole('combobox', { name: '選擇行政區', exact: true })).toHaveValue(
		'內湖區'
	);
	await page.goto('/?city=臺中市&district=西屯區');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '西屯區');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await expect.poll(() => new URL(page.url()).searchParams.get('city')).toBe('臺北市');
	await page.goBack();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺中市');
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '西屯區');
	await page.goForward();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-city', '臺北市');
	await page.getByRole('button', { name: '全臺總覽', exact: true }).click();
	await expect.poll(() => new URL(page.url()).searchParams.has('city')).toBe(false);
	await page.reload();
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('');
});

test('常用地點可新增、跨重新整理選取與移除，無須帳號', async ({ page }) => {
	await page.goto('/?city=臺北市&district=內湖區');
	await page.getByRole('button', { name: '加入常用', exact: true }).click();
	await expect(page.getByRole('button', { name: '取消常用', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.reload();
	await page.getByRole('button', { name: '全臺總覽', exact: true }).click();
	await page.locator('.saved-places summary').click();
	await page.getByRole('button', { name: '臺北市 · 內湖區', exact: true }).click();
	await expect(page.locator('.map')).toHaveAttribute('data-selected-district', '內湖區');
	await page.getByRole('button', { name: '移除 臺北市 · 內湖區', exact: true }).click();
	await expect(page.getByRole('button', { name: '加入常用', exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('list', { name: '常用地點', exact: true })).toHaveCount(0);
});

test('無效網址不讀取先前地區，損毀或停用儲存不影響查天氣', async ({ page }) => {
	await page.addInitScript(() => {
		const get = Storage.prototype.getItem;
		const set = Storage.prototype.setItem;
		Storage.prototype.getItem = function (key) {
			if (key === 'island-weather.places.v1') throw new DOMException('Blocked', 'SecurityError');
			return get.call(this, key);
		};
		Storage.prototype.setItem = function (key, value) {
			if (key === 'island-weather.places.v1') throw new DOMException('Blocked', 'SecurityError');
			return set.call(this, key, value);
		};
	});
	await page.goto('/?city=unknown&district=內湖區');
	await expect(page.getByRole('combobox', { name: '選擇縣市', exact: true })).toHaveValue('');
	await page.getByRole('combobox', { name: '選擇縣市', exact: true }).selectOption('臺北市');
	await page.getByRole('combobox', { name: '選擇行政區', exact: true }).selectOption('內湖區');
	await expect(page.getByRole('article')).toContainText('29–30°C');
	await page.getByRole('button', { name: '加入常用', exact: true }).click();
	await expect(page.getByText('此瀏覽器無法儲存設定，常用地點只會保留到離開頁面。')).toBeVisible();
});

test('剪貼簿失敗時提供可手動複製的分享網址', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: () => Promise.reject(new Error('denied')) }
		});
	});
	await page.goto('/?city=臺北市&district=內湖區');
	await page.getByRole('button', { name: '分享地區', exact: true }).click();
	const link = page.getByRole('textbox', { name: '地區分享連結' });
	await expect(link).toBeVisible();
	const url = new URL(await link.inputValue());
	expect(url.searchParams.get('city')).toBe('臺北市');
	expect(url.searchParams.get('district')).toBe('內湖區');
});
