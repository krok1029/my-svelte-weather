import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'yarn build && yarn preview --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		timeout: 120000,
		reuseExistingServer: false,
		env: { PUBLIC_API_TOKEN: '', CWA_API_TOKEN: '' }
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	timeout: 30000,
	expect: { timeout: 10000 },
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
		{ name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
	],
	reporter: [
		['html', { open: 'never' }],
		['list'],
		['junit', { outputFile: 'test-results/junit.xml' }]
	],
	outputDir: 'test-results/'
});
