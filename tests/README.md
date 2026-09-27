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
- `mobile-summary.test.ts`：375px 直向與 667px 橫向的摘要／地圖／詳細預報順序、桌面側欄、鍵盤焦點、深色模式，以及摘要的載入／重試／空資料狀態。

測試以可見狀態與回應條件等待，不使用固定秒數等待、不吞掉斷言錯誤。失敗報告、截圖、影片與 trace 放在 `test-results/` 與 `playwright-report/`；CI 保留七天。

`district-weather.test.ts` 覆蓋縣市／行政區聚焦、不同地區預報、返回總覽、行政區失敗重試、
快速跨縣市切換，以及實際行政區端點的輸入驗證。瀏覽器時鐘從 fixture 的預報日期正常前進（讓地圖動畫可完成），
避免資料過期造成測試失效。`district-upstream.json` 保留官方 F-D0047-061 的 PascalCase
欄位及兩個行政區的部分原始時段，供單元測試驗證每小時溫度與 3 小時預報對齊。

行政區測試讀取實際框線，驗證點擊不被縣市遮住、框線獨立重試；地圖測試涵蓋縮放上下限及拖曳範圍。`src/lib/map/geometry.test.ts` 另驗證陸地、離島、洞與邊界交集，以及聚焦不修改來源資料。

`location-search.test.ts` 驗證本機縣市／行政區搜尋、台／臺與空白查詢、同名行政區、
方向鍵／Enter／Escape／Tab、輸入法組字、清單載入重試及行動裝置觸控。
行動瀏覽器另檢查 375px 直向與橫向深色模式不橫向溢出，並保留搜尋畫面的截圖於測試輸出目錄。

`freshness.test.ts` 以美西瀏覽器時區與可推進時鐘驗證台灣預報跨日時段、縣市與行政區時段到期、
摘要同步、背景頁籤停止輪詢、回到前景更新、失敗保留有效資料及重試節流。
頁面在前景每分鐘更新顯示時鐘，資料達五分鐘後獨立更新縣市與所選縣市的行政區預報；
失敗或仍為快取資料時，每五分鐘最多自動重試一次，也可使用原有手動更新按鈕。
