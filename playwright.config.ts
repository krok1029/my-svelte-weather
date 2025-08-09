import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		timeout: 120000, // 增加超時時間
		reuseExistingServer: !process.env.CI, // 在本地開發時重用現有伺服器
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	
	// 測試配置
	timeout: 30000, // 每個測試的超時時間
	expect: {
		timeout: 10000, // expect 斷言的超時時間
	},
	
	// 重試配置
	retries: process.env.CI ? 2 : 0, // CI 環境重試2次，本地不重試
	
	// 並行配置
	workers: process.env.CI ? 1 : undefined, // CI 環境使用1個 worker
	
	// 瀏覽器配置
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry', // 在第一次重試時記錄 trace
		screenshot: 'only-on-failure', // 只在失敗時截圖
		video: 'retain-on-failure', // 只在失敗時保留影片
	},
	
	// 專案配置 - 可以測試不同瀏覽器
	projects: [
		{
			name: 'chromium',
			use: { 
				...devices['Desktop Chrome'],
				// 可以在這裡設定特定的瀏覽器選項
			},
		},
		{
			name: 'firefox',
			use: { 
				...devices['Desktop Firefox'] 
			},
		},
		{
			name: 'webkit',
			use: { 
				...devices['Desktop Safari'] 
			},
		},
		// 行動裝置測試
		{
			name: 'Mobile Chrome',
			use: { 
				...devices['Pixel 5'] 
			},
		},
		{
			name: 'Mobile Safari',
			use: { 
				...devices['iPhone 12'] 
			},
		},
	],
	
	// 報告配置
	reporter: [
		['html'], // HTML 報告
		['list'], // 控制台列表報告
		['junit', { outputFile: 'test-results/junit.xml' }], // JUnit XML 報告
	],
	
	// 輸出目錄
	outputDir: 'test-results/',
};

export default config;
