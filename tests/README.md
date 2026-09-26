# 瀏覽器測試

使用 Node.js 24 與專案 Yarn 執行：

```bash
nvm use
yarn install --immutable
yarn playwright install --with-deps
yarn test:unit
yarn test:integration
```

只執行 Chromium 或單一測試：

```bash
yarn test:integration --project=chromium
yarn test:integration tests/api.test.ts --project=chromium -g '天氣失敗'
```

Playwright 自動建置並啟動獨立 preview server；4173 必須空閒。測試覆蓋 Chromium、Firefox、WebKit、Mobile Chrome 與 Mobile Safari。CI 先執行型別、格式、Lint 與單元測試，再執行瀏覽器測試。

`fixtures/weather.json` 保留氣象署 F-C0032-001 的欄位結構，包含臺北、臺中三個時段及 `PoP` 的 20、0、60 百分比。各測試透過 `fixtures/index.ts` 攔截同源 `/api/weather`，不需任何真實 API Token。地圖邊界與縣市資料使用專案實際 JSON，僅將外部底圖圖磚替換為空白圖片。

- `test.ts`：首頁、縣市切換、行動裝置顯示。
- `weather-card.test.ts`：時段、溫度、PoP、缺值與空資料。
- `api.test.ts`：延遲回應、獨立失敗與重試、快取提示、同源請求。
- `map.test.ts`：地圖失敗與重試、選取狀態同步。

測試以可見狀態與回應條件等待，不使用固定秒數等待、不吞掉斷言錯誤。失敗報告、截圖、影片與 trace 放在 `test-results/` 與 `playwright-report/`；CI 保留七天。
