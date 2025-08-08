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

- Node.js 與 SvelteKit 伺服器端渲染
- 透過 `fetch` 連線中央氣象局（CWA）開放資料 API

### 架構設計

前端直接向 CWA API 取得資料，SvelteKit 負責路由與 API Token 的伺服器端注入，架構簡潔易部署。

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

1. 安裝依賴
   ```bash
   yarn install
   ```
2. 在專案根目錄建立 `.env` 並設定中央氣象局 API Token
   ```bash
   PUBLIC_API_TOKEN=your_token_here
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
