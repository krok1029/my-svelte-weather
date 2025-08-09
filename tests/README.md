# My Svelte Weather 測試套件

這個目錄包含了 My Svelte Weather 應用程式的完整 Playwright 端到端測試套件。

## 測試檔案結構

```
tests/
├── test.ts              # 主要 UI 和基本功能測試
├── weather-card.test.ts # 天氣卡片功能測試
├── map.test.ts          # 地圖功能測試
├── api.test.ts          # API 和資料載入測試
└── README.md           # 本說明檔案
```

## 測試涵蓋範圍

### 🎨 基本 UI 測試 (`test.ts`)
- 首頁標題顯示
- 基本 UI 元素載入
- 縣市按鈕功能
- 天氣資訊顯示
- 響應式設計
- 錯誤處理
- 多縣市切換

### 🌦️ 天氣卡片測試 (`weather-card.test.ts`)
- 天氣卡片顯示
- 36小時預報資料完整性
- 不同縣市資料切換

### 🗺️ 地圖功能測試 (`map.test.ts`)
- Leaflet 地圖初始化
- 地圖與縣市按鈕互動
- 響應式地圖設計
- 地圖載入錯誤處理
- 地圖與天氣資料同步

### 🔌 API 和資料測試 (`api.test.ts`)
- 天氣 API 資料載入
- 靜態資源載入
- 資料載入失敗處理
- 網路連線緩慢處理
- API Token 環境變數檢查
- 縣市資料完整性
- 天氣資料格式驗證

## 運行測試

### 使用 npm/yarn 腳本

```bash
# 運行所有測試
yarn test:integration

# 運行特定測試檔案
yarn test:ui          # 基本 UI 測試
yarn test:weather     # 天氣卡片測試
yarn test:map         # 地圖功能測試
yarn test:api         # API 測試

# 可視化測試（開啟瀏覽器）
yarn test:headed

# 除錯模式
yarn test:debug

# 查看測試報告
yarn test:report

# 安裝 Playwright 瀏覽器
yarn test:install
```

### 使用測試腳本

```bash
# 使用便利腳本
./scripts/test.sh all      # 所有測試
./scripts/test.sh ui       # UI 測試
./scripts/test.sh weather  # 天氣測試
./scripts/test.sh map      # 地圖測試
./scripts/test.sh api      # API 測試
./scripts/test.sh headed   # 可視化測試
./scripts/test.sh debug    # 除錯模式
./scripts/test.sh report   # 查看報告
```

### 直接使用 Playwright

```bash
# 運行所有測試
npx playwright test

# 運行特定測試檔案
npx playwright test test.ts
npx playwright test weather-card.test.ts

# 運行特定測試案例
npx playwright test --grep "首頁顯示天氣預報標題"

# 可視化模式
npx playwright test --headed

# 除錯模式
npx playwright test --debug

# 產生測試報告
npx playwright show-report
```

## 測試配置

測試配置位於 `playwright.config.ts`，包含：

- **多瀏覽器支援**: Chrome, Firefox, Safari
- **行動裝置測試**: Pixel 5, iPhone 12
- **自動重試**: CI 環境重試 2 次
- **截圖和影片**: 失敗時自動記錄
- **測試報告**: HTML, 列表, JUnit 格式

## 環境需求

1. **Node.js**: 版本 16 或以上
2. **Playwright 瀏覽器**: 運行 `yarn test:install` 安裝
3. **開發伺服器**: 測試會自動啟動 preview 伺服器
4. **環境變數**: 確保 `.env` 檔案包含必要的 API Token

## 測試最佳實踐

### ✅ 好的做法
- 使用有意義的測試名稱
- 適當的等待時間和超時設定
- 檢查多種瀏覽器和裝置
- 測試錯誤情況和邊界條件

### ❌ 避免的做法
- 硬編碼的等待時間
- 依賴特定的測試順序
- 忽略非同步操作
- 過度依賴 CSS 選擇器

## 故障排除

### 常見問題

1. **測試超時**
   - 檢查網路連線
   - 確認 API Token 設定正確
   - 增加超時時間

2. **元素找不到**
   - 檢查選擇器是否正確
   - 確認元素載入時間
   - 使用 `--headed` 模式除錯

3. **API 相關錯誤**
   - 檢查 `.env` 檔案
   - 確認 API Token 有效
   - 檢查網路連線

### 除錯技巧

```bash
# 使用除錯模式
npx playwright test --debug

# 產生 trace 檔案
npx playwright test --trace on

# 查看測試執行過程
npx playwright test --headed --slowMo=1000
```

## 持續整合

這些測試可以整合到 CI/CD 流程中：

```yaml
# GitHub Actions 範例
- name: Run Playwright tests
  run: |
    yarn install
    yarn test:install
    yarn test:integration
```

## 貢獻指南

新增測試時請遵循：

1. 使用描述性的測試名稱
2. 適當的 `describe` 群組
3. 清理測試資料
4. 添加適當的註解
5. 更新此 README 檔案
