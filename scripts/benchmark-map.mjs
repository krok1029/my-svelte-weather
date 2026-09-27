// Compare county geometry assets on one production build; routes isolate data processing cost.
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { cpus, platform, arch } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const samples = Number(process.env.MAP_BENCHMARK_SAMPLES ?? 5);
if (!Number.isInteger(samples) || samples < 3) throw new Error('Use at least three samples');
const baselineRef = process.env.MAP_BENCHMARK_BASELINE_REF;
if (!baselineRef) throw new Error('Set MAP_BENCHMARK_BASELINE_REF to the commit being compared');
const baselineCommit = execFileSync(
	'git',
	['rev-parse', '--verify', '--end-of-options', `${baselineRef}^{commit}`],
	{ cwd: root, encoding: 'utf8' }
).trim();
const port = Number(process.env.MAP_BENCHMARK_PORT ?? 4185);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const inputs = {
	original: execFileSync('git', ['show', `${baselineCommit}:static/taiwan_geo.json`], {
		cwd: root,
		maxBuffer: 16 * 1024 * 1024
	}),
	optimized: await readFile(resolve(root, 'static/taiwan_geo.json'))
};
const weather = JSON.parse(await readFile(resolve(root, 'tests/fixtures/weather.json'), 'utf8'));
const tile = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
	'base64'
);

process.env.CWA_API_TOKEN = '';
process.env.PUBLIC_API_TOKEN = '';
process.chdir(root);
const server = await preview({
	logLevel: 'error',
	preview: { host: '127.0.0.1', port, strictPort: true }
});
let browser;

async function measure(name) {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
		deviceScaleFactor: 1
	});
	try {
		const page = await context.newPage();
		await page.route('**/api/weather', (route) =>
			route.fulfill({
				json: { data: weather, updatedAt: '2026-09-26T04:00:00.000Z', stale: false }
			})
		);
		await page.route('**/taiwan_geo.json', (route) =>
			route.fulfill({
				contentType: 'application/json',
				body: inputs[name]
			})
		);
		await page.route(/^https:\/\/(?:[^/]+\.)?tile\.openstreetmap\.org\//, (route) =>
			route.fulfill({ contentType: 'image/png', body: tile })
		);
		await page.route('https://opendata.cwa.gov.tw/**', (route) => route.abort());
		await page.addInitScript(() => {
			const measurements = (window.__mapBenchmark = {});
			const originalJson = Response.prototype.json;
			Response.prototype.json = async function () {
				if (!this.url.endsWith('/taiwan_geo.json')) return originalJson.call(this);
				measurements.jsonStarted = performance.now();
				const result = await originalJson.call(this);
				measurements.jsonReady = performance.now();
				return result;
			};
			const detectPaint = () => {
				const canvas = document.querySelector(
					'.map[data-ready="true"] .leaflet-overlay-pane canvas'
				);
				if (canvas && measurements.jsonReady !== undefined) {
					const { width, height } = canvas;
					if (width > 0 && height > 0) {
						const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
						for (let i = 3; i < pixels.length; i += 4) {
							if (pixels[i] > 0) {
								measurements.painted = performance.now();
								return;
							}
						}
					}
				}
				requestAnimationFrame(detectPaint);
			};
			requestAnimationFrame(detectPaint);
		});
		await page.goto(`http://127.0.0.1:${port}/`);
		await page.waitForFunction(() => window.__mapBenchmark.painted !== undefined, undefined, {
			timeout: 30000
		});
		const result = await page.evaluate(() => {
			const { jsonStarted, jsonReady, painted } = window.__mapBenchmark;
			return {
				navigationToCountyPaintMs: painted,
				jsonReadAndParseMs: jsonReady - jsonStarted,
				jsonReadyToCountyPaintMs: painted - jsonReady
			};
		});
		return result;
	} finally {
		await context.close();
	}
}

try {
	browser = await chromium.launch();
	const measurements = { original: [], optimized: [] };
	await measure('original');
	await measure('optimized');
	for (let i = 0; i < samples; i += 1) {
		const order = i % 2 === 0 ? ['original', 'optimized'] : ['optimized', 'original'];
		for (const name of order) {
			measurements[name].push(await measure(name));
		}
	}
	const median = (values) => {
		const sorted = [...values].sort((a, b) => a - b);
		const middle = Math.floor(sorted.length / 2);
		return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
	};
	const medians = Object.fromEntries(
		Object.entries(measurements).map(([name, values]) => [
			name,
			Object.fromEntries(
				Object.keys(values[0]).map((metric) => [
					metric,
					median(values.map((value) => value[metric]))
				])
			)
		])
	);
	console.log(
		JSON.stringify(
			{
				baselineCommit,
				assetBytes: Object.fromEntries(
					Object.entries(inputs).map(([name, bytes]) => [
						name,
						{ json: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length }
					])
				),
				platform: `${platform()} ${arch()}`,
				cpu: cpus()[0].model,
				node: process.version,
				chromium: browser.version(),
				viewport: '1440x1000 @ 1x',
				samplesPerVariant: samples,
				warmupsPerVariant: 1,
				medians,
				samples: measurements
			},
			null,
			2
		)
	);
} finally {
	await browser?.close();
	await server.close();
}
