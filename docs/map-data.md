# 縣市地圖資料

`static/taiwan_geo.json` 是供瀏覽器使用的精簡 GeoJSON。原始資料以 gzip 封存於
`data/taiwan_geo.source.json.gz`，不會進入 SvelteKit 的靜態網站產物。

## 來源與授權紀錄

原始檔直接保留自此專案的 `static/taiwan_geo.json`，最早加入此檔案的 commit 為
`3dfa07db709c1551301765ebde3a530d845ca1c4`。解壓後 SHA-256：

```text
db1f118396af033d9c52c804a9666149025f106c633d09e781e58bc4dcaef606
```

原始檔沒有來源網址、授權條款或製作日期 metadata；因此不能由縣市欄位名稱推定其官方來源、
更新年份或授權。封存保留全部原始屬性，方便日後查證。背景底圖的 OpenStreetMap attribution
與此縣市邊界資料的來源紀錄是分開的。

## 重新產生

需要 Python 3.10–3.13。工具僅供資料預處理，網站建置與執行不依賴 Python、Shapely 或 NumPy。

```bash
python3 -m venv /tmp/weather-map-tools
/tmp/weather-map-tools/bin/pip install -r scripts/requirements-map.txt
/tmp/weather-map-tools/bin/python scripts/optimize-map.py
/tmp/weather-map-tools/bin/python scripts/optimize-map.py --check
```

腳本以固定來源 checksum 驗證輸入，將 JSON 寫成 UTF-8，輸出壓縮前大小、gzip 大小、幾何數量
及實際偏移量。`--check` 會重新計算並逐 byte 比對已提交的產物；不一致時回傳失敗。

## 簡化與驗證

使用 Shapely 2.1.2、GEOS 3.13.1 的
[`coverage_simplify`](https://shapely.readthedocs.io/en/2.1.2/reference/shapely.coverage_simplify.html)，
在整份有效的 polygon coverage 上簡化，保留相鄰縣市共用邊界。沒有各縣市獨立簡化，也沒有四捨五入座標。
輸出的屬性只保留畫面查詢使用的 `NAME_2014`。

Visvalingam–Whyatt tolerance 為 `0.00005` 度；這是面積尺度參數，**不是**最大位移保證。
腳本另外逐一比對每個原始 ring 與結果 ring，確認結果頂點皆來自原始 ring、順序未變，並計算每段
被替換折線到保留弦線的最大距離。檢查所有原始頂點可界定整段折線的偏移；折線與弦線共用端點，
弦線到原始折線也落在此上限內。設定的接受上限為 `0.0002` 度，實測最大偏移
`0.00017964174416190373` 度；以每度 111,700 公尺換算的保守上限約 **20.1 公尺**。
這份資料適合縣市天氣瀏覽，不適合作為地籍或測量用途。

每次產生同時檢查：

- 所有輸入、輸出以及重新載入後的幾何均有效。
- 輸入、輸出及重新載入後皆通過
  [`coverage_is_valid`](https://shapely.readthedocs.io/en/2.1.2/reference/shapely.coverage_is_valid.html)：
  共用邊界頂點匹配、縣市之間沒有重疊。此檢查允許資料中原本存在的未覆蓋區域，並不表示填滿所有水域。
- 每個縣市的 geometry 類型、polygon 數量及 ring 數量保持一致，保留離島與洞。
- 每個 ring 都閉合且未退化、頂點沿原始順序保留，偏移量低於接受上限。
- 產出的 22 個 feature 與原始縣市名稱、順序一一對應。

## 量測結果

使用上述固定版本與來源產生；gzip 為 Python gzip level 9、`mtime=0`，是可比較的壓縮大小，
實際 HTTP 傳輸大小取決於部署平台的壓縮設定。

| 項目                   |    原始檔 | 瀏覽器產物 |  減少 |
| ---------------------- | --------: | ---------: | ----: |
| JSON bytes             | 9,242,405 |  4,464,196 | 51.7% |
| gzip bytes             | 3,029,287 |  1,530,722 | 49.5% |
| 頂點（含 ring 閉合點） |   320,823 |    154,959 | 51.7% |
| 縣市 feature           |        22 |         22 |     0 |
| Polygon                |       660 |        660 |     0 |
| Ring                   |       662 |        662 |     0 |

## 畫面生命週期

`WeatherMap.svelte` 透過 Svelte action 的 `update` 接收地理資料與 `selectedCity`，不再輪詢。
按鈕與地圖點擊共用頁面的選取狀態；滑鼠離開縣市時依該狀態恢復高亮。
`ResizeObserver` 會在容器大小變化時通知 Leaflet，元件移除時會停止 observer、清理縣市事件並移除地圖。

## 本機首次繪製基準

使用已安裝的 Playwright 執行同一份 production build。腳本自行啟動 `127.0.0.1:4175` preview，
結束時關閉 preview 與 Chromium；不需要 API Token，也不會存取氣象署。

```bash
CWA_API_TOKEN='' PUBLIC_API_TOKEN='' yarn build
node scripts/benchmark-map.mjs
```

可用 `MAP_BENCHMARK_SAMPLES=9 node scripts/benchmark-map.mjs` 調整樣本數（至少 3 次）。
每組先暖機一次，再以交錯順序各跑 5 次，每次使用新的 browser context。
原始資料從封存檔解壓，兩組 GeoJSON 都經由同一 Playwright route 提供；天氣回應固定為
`tests/fixtures/weather.json`，OpenStreetMap tiles 固定為相同的空白圖片。

2026-09-26，在 Apple M2 Pro、macOS arm64、Node 24.21.0、Chromium 153.0.8010.12，
1440 × 1000、device scale factor 1 下的中位數：

| 量測（毫秒）                         | 原始 GeoJSON | 精簡 GeoJSON |
| ------------------------------------ | -----------: | -----------: |
| Navigation → 第一次畫出縣市 Canvas   |        322.9 |        207.0 |
| GeoJSON `Response.json()` 讀取與解析 |         44.0 |         21.3 |
| JSON 就緒 → 第一次畫出縣市 Canvas    |         81.1 |         44.0 |

首次繪製指標的 5 次原始樣本為 `324.7, 296.0, 348.3, 314.3, 322.9` ms；
精簡後為 `207.0, 201.8, 209.2, 205.7, 240.1` ms。此輪中位數減少約 **35.9%**。
脚本會輸出全部樣本及執行環境，方便重新比較，不將此數字設成 CI 效能門檻。

第一次繪製定義為 `data-ready=true` 且 Leaflet overlay Canvas 出現非透明像素，
透過 `requestAnimationFrame` 與 `getImageData` 檢查；不是只等待 Canvas 元素存在。
Navigation 時間使用瀏覽器 `performance.now()` 的 navigation time origin。

限制：這是未做 CPU／網路節流的本機開發量測，包含 Playwright route 傳送 body、
JSON 解析、頁面初始化與繪製觀測的開銷；觀測以動畫影格為粒度，也包含 Canvas 像素讀取。
JSON 就緒到繪製包含 Svelte 更新、Leaflet 圖層建立和動畫影格等待，不能視為純 GPU 繪製時間。
兩組跑相同的新程式碼，因此只比較資料最佳化的影響，沒有量測其他頁面修正的效益。
沒有量到實際氣象署／底圖延遲、CDN 快取或 gzip 傳輸收益，也不是 LCP、行動裝置或正式環境保證。
