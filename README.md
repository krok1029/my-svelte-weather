# My Svelte Weather

## 專案簡介

My Svelte Weather 是一個使用 SvelteKit 建置的互動式天氣預報網站，提供台灣各縣市未來 36 小時的氣象資訊，並透過地圖介面呈現。

## 主要功能

- 於 Leaflet 地圖上瀏覽並選取各縣市
- 顯示所選縣市的 36 小時預報：溫度、降雨機率與天氣現象
- 介面以 SvelteKit、TypeScript 與 Tailwind CSS 打造

## 技術架構

### 前端技術棧

- SvelteKit
- TypeScript
- Tailwind CSS
- Leaflet

### 後端技術棧

- Node.js 24 與 SvelteKit 伺服器端 API
- 透過 `fetch` 連線中央氣象署（CWA）開放資料 API

### 架構設計

瀏覽器只呼叫本站的 `GET /api/weather`，由 SvelteKit 伺服器使用私有環境變數 `CWA_API_TOKEN` 向 CWA 取得資料。Token 不會注入頁面或傳送給瀏覽器。

API 回傳 `{ data, updatedAt, stale }`。每個伺服器實例各自保留 5 分鐘記憶體快取，同時到達的更新請求共用一次上游呼叫。上游超時或失敗時，最多回傳取得後 30 分鐘內的快取並標示 `stale: true`；超過期限或沒有可用資料時回傳不含上游細節的 503。`updatedAt` 是本站成功取得資料的時間，不是氣象署預報發布時間。

上游請求逾時為 8 秒，瀏覽器請求逾時為 12 秒。快取不跨實例共享，服務重啟或無伺服器冷啟動會清空，且不會在背景自動更新。

地圖資料來源、縮減與重建方式見 [地圖資料說明](docs/map-data.md)。測試方式與驗證範圍見 [測試說明](tests/README.md)。

## 專案結構

```
.
├── src/
│   ├── lib/          # 共用元件與工具
│   └── routes/       # 應用頁面
├── static/           # 靜態資源
├── tests/            # Playwright 測試
└── ...               # 其他設定檔案
```

## 快速開始

1. 使用 Node.js 24 並安裝依賴
   ```bash
   nvm install
   nvm use
   npm install --global corepack
   corepack enable
   yarn install
   ```
2. 在專案根目錄建立 `.env` 並設定中央氣象署 API Token
   ```bash
   CWA_API_TOKEN=your_token_here
   ```
3. 啟動開發伺服器 <http://localhost:5173>
   ```bash
   yarn dev
   ```
4. 建置與預覽生產版
   ```bash
   yarn build
   yarn preview
   ```

## 部署與環境變數遷移

此專案包含動態 API 路由，部署環境必須支援執行 SvelteKit 伺服器程式與對外 HTTPS 請求，不能只部署靜態檔案。專案目前使用 `adapter-auto`；若平台不在其支援範圍，請依平台改用對應的 SvelteKit adapter。自行部署 Node.js 伺服器時需要 Node.js 24 與適用的伺服器 adapter。`yarn preview` 用於本機建置驗證。

將本機 `.env` 與部署平台中的 `PUBLIC_API_TOKEN` 改成 `CWA_API_TOKEN`（可參考 `.env.example`），刪除舊的公開變數後重新建置與部署。此版本不會回退使用 `PUBLIC_API_TOKEN`。過去已部署的公開 Token 應在氣象署換發，並將新值僅設定在伺服器環境。沒有設定私有 Token 時，頁面仍可使用地圖與縣市選擇，天氣 API 會回傳 503 並顯示重試提示。
