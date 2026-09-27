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
在整份有效的 polygon coverage 上簡化，保留相鄰縣市共用邊界。沒有各縣市獨立簡化。簡化後將縣市座標四捨五入至小數 6 位；行政區使用 7 位。
輸出的屬性只保留畫面查詢使用的 `NAME_2014`。

Visvalingam–Whyatt tolerance 為 `0.00005` 度；這是面積尺度參數，**不是**最大位移保證。
腳本另外逐一比對每個原始 ring 與結果 ring，確認結果頂點皆來自原始 ring、順序未變，並計算每段
被替換折線到保留弦線的最大距離。檢查所有原始頂點可界定整段折線的偏移；折線與弦線共用端點，
弦線到原始折線也落在此上限內。設定的接受上限為 `0.0002` 度，實測最大偏移
`0.00017964174416190373` 度，加上座標四捨五入的最大誤差後，上限為
`0.00018034743672511346` 度；以每度 111,700 公尺換算的保守上限約 **20.15 公尺**。
這份資料適合縣市天氣瀏覽，不適合作為地籍或測量用途。

每次產生同時檢查：

- 所有輸入、輸出以及重新載入後的幾何均有效。
- 輸入、輸出及重新載入後皆通過
  [`coverage_is_valid`](https://shapely.readthedocs.io/en/2.1.2/reference/shapely.coverage_is_valid.html)：
  共用邊界頂點匹配、縣市之間沒有重疊。此檢查允許資料中原本存在的未覆蓋區域，並不表示填滿所有水域。
- 每個縣市的 geometry 類型、polygon 數量及 ring 數量保持一致，保留離島與洞。
- 簡化後每個 ring 都閉合且未退化、頂點沿原始順序保留，偏移量低於接受上限。
- 四捨五入前後逐 ring 檢查頂點數、方向、閉合、有效性及對應頂點位移；不再刪除任何頂點。
  直線兩端的位移上限也界定整條邊的位移。縣市實測額外位移不超過 0.079 公尺，
  行政區不超過 0.008 公尺。縣市序列化後仍須通過共用邊界 coverage 檢查。
- 產出的 22 個 feature 與原始縣市名稱、順序一一對應。

## 量測結果

使用上述固定版本與來源產生；gzip 為 Python gzip level 9、`mtime=0`，是可比較的壓縮大小，
實際 HTTP 傳輸大小取決於部署平台的壓縮設定。

| 項目                   |    原始檔 | 瀏覽器產物 |  減少 |
| ---------------------- | --------: | ---------: | ----: |
| JSON bytes             | 9,242,405 |  3,534,742 | 61.8% |
| gzip bytes             | 3,029,287 |  1,021,695 | 66.3% |
| 頂點（含 ring 閉合點） |   320,823 |    154,959 | 51.7% |
| 縣市 feature           |        22 |         22 |     0 |
| Polygon                |       660 |        660 |     0 |
| Ring                   |       662 |        662 |     0 |

## 畫面生命週期

`WeatherMap.svelte` 透過 Svelte action 的 `update` 接收地理資料與 `selectedCity`，不再輪詢。
按鈕與地圖點擊共用頁面的選取狀態；滑鼠離開縣市時依該狀態恢復高亮。
`ResizeObserver` 會在容器大小變化時通知 Leaflet，元件移除時會停止 observer、清理縣市事件並移除地圖。

## 本機首次繪製基準

使用已安裝的 Playwright 執行同一份 production build。腳本自行啟動 `127.0.0.1:4185` preview，
結束時關閉 preview 與 Chromium；不需要 API Token，也不會存取氣象署。
必須指定基準 commit，腳本直接讀取該 commit 的縣市產物，避免把本次改進與早期簡化混在一起。

```bash
CWA_API_TOKEN='' PUBLIC_API_TOKEN='' yarn build
MAP_BENCHMARK_BASELINE_REF=3becf06 MAP_BENCHMARK_SAMPLES=9 node scripts/benchmark-map.mjs
```

`MAP_BENCHMARK_PORT` 可調整 preview port。每組先暖機一次，再以交錯順序各跑 9 次，
每次使用新的 browser context。兩組 GeoJSON 都經由相同 Playwright route 提供；
天氣回應固定為 `tests/fixtures/weather.json`，OpenStreetMap tiles 固定為相同的空白圖片。

2026-09-27，在 Apple M2 Pro、macOS arm64、Node 24.21.0、Chromium 153.0.8010.12，
1440 × 1000、device scale factor 1 下的中位數：

| 量測（毫秒）                         | 精度調整前（3becf06） | 精度調整後 |
| ------------------------------------ | --------------------: | ---------: |
| Navigation → 第一次畫出縣市 Canvas   |                 193.8 |      183.3 |
| GeoJSON `Response.json()` 讀取與解析 |                  21.3 |       19.2 |
| JSON 就緒 → 第一次畫出縣市 Canvas    |                  43.1 |       43.4 |

首次繪製的 9 次基準樣本為 `190.4, 193.5, 194.7, 192.1, 200.6, 191.9, 200.9, 196.0, 193.8` ms；
調整後為 `181.3, 190.5, 180.8, 182.1, 180.8, 185.0, 185.8, 187.0, 183.3` ms。
此輪中位數減少約 **5.4%**；讀取與解析減少約 **9.9%**，JSON 就緒後繪製時間沒有改善。
腳本輸出完整 commit、全部樣本及執行環境，不將本機時間設成 CI 效能門檻。

第一次繪製定義為 `data-ready=true` 且 Leaflet overlay Canvas 出現非透明像素，
透過 `requestAnimationFrame` 與 `getImageData` 檢查；不是只等待 Canvas 元素存在。
Navigation 時間使用瀏覽器 `performance.now()` 的 navigation time origin。

限制：這是未做 CPU／網路節流的本機量測，包含 Playwright route 傳送 body、
JSON 解析、頁面初始化與繪製觀測的開銷；觀測以動畫影格為粒度，也包含 Canvas 像素讀取。
JSON 就緒到繪製包含 Svelte 更新、Leaflet 圖層建立和動畫影格等待，不能視為純 GPU 繪製時間。
兩組跑同一份程式碼，因此只比較資料精度調整的影響。
沒有量到行政區繪製時間、實際氣象署／底圖延遲、CDN 快取或 gzip 傳輸收益，
也不是 LCP、行動裝置或正式環境保證。基準腳本另外輸出的 gzip 大小使用 Node zlib，
可能與下表 Python gzip 的結果稍異；HTTP 壓縮大小由部署平台決定。

## 座標精度與資料大小

在保留既有簡化程度的前提下，縣市採小數 6 位、行政區採 7 位。
嘗試 5 位時有縣市與行政區幾何失效；6 位仍使宜蘭的一個狹窄行政區 ring 失效，
因此行政區保留 7 位。沒有進一步簡化行政區、刪除小島或加入低解析度替代圖層。
`map_precision.py` 與兩個產生器會拒絕無效的輸出，並由 `--check` 逐 byte 驗證重現性。

下表與 commit `3becf06b41115b62bbf742ecfd1d28dd06cd24cf` 比較，gzip 使用 Python level 9、`mtime=0`。
「所有行政區」包含 index，實際瀏覽仍只載入目前選取縣市。

| 資料         | 調整前 JSON bytes | 調整後 JSON bytes | 調整前 gzip bytes | 調整後 gzip bytes |
| ------------ | ----------------: | ----------------: | ----------------: | ----------------: |
| 縣市首次載入 |         4,464,196 |         3,534,742 |         1,530,722 |         1,021,695 |
| 高雄行政區   |         1,532,829 |           964,746 |           580,104 |           283,936 |
| 所有行政區   |        16,945,444 |        10,664,398 |         6,382,862 |         3,173,984 |

縣市原始 bytes 減少 **20.8%**，gzip 減少 **33.3%**；高雄原始 bytes 減少 **37.1%**，
gzip 減少 **51.1%**。所有既有頂點、feature 順序、名稱、行政區代碼、polygon 與 ring 數量保留。

## 鄉鎮市區框線

來源：[國土測繪中心鄉鎮市區界線](https://data.gov.tw/dataset/7441)，
[官方下載頁](https://maps.nlsc.gov.tw/pro/download.jsp)的「鄉鎮市區界線（TWD97 經緯度）」ZIP。
下載日期 2026-09-27；資料入口 metadata 更新日期為 2025-12-24，並不代表每條界線的測繪日期。
採用[政府資料開放授權條款第 1 版](https://data.gov.tw/license)。地圖與頁尾均標示來源。

`data/townships.source.zip` 原封保留下載檔，SHA-256：

```text
e028e5a750eee48cf7913330655e5e5c5bb1f176868fbd0afdfc661fca60557c
```

腳本讀取主圖層 `TOWN_MOI_1120317` 的 368 筆行政區，保留 22 縣市；不合併附件
`Town_Majia_Sanhe`，避免重複主圖層行政區。來源為 TWD97 經緯度（GRS80），在天氣地圖以經緯度呈現。

```bash
/tmp/weather-map-tools/bin/pip install -r scripts/requirements-map.txt
/tmp/weather-map-tools/bin/python scripts/build-townships.py
/tmp/weather-map-tools/bin/python scripts/build-townships.py --check
```

以 Shapely `simplify(0.00002, preserve_topology=True)` 逐行政區簡化，檢查幾何有效性、類型、
島嶼數量與 Hausdorff 距離；距離超過 0.000021 度時保留原始幾何。與縣市圖層的 coverage 簡化不同，
這份來源本身未通過 coverage 檢查，不能宣稱相鄰行政區完全沒有重疊或縫隙。
適合天氣探索，不作為法律界址、地籍或測量依據。

輸出 `static/boundaries/{COUNTYCODE}.json`，索引為 `static/boundaries/index.json`。
共 10,664,398 bytes，只有選中的縣市會載入，並在頁面生命週期內快取。
切換縣市會取消舊請求，框線錯誤可獨立重試，不阻擋天氣與選單。

縣市採 Canvas、行政區採較上層 SVG，框線與面積皆可點擊，避免底層縣市攔截事件。
聚焦使用最大連續陸塊，避免同縣市遠端附屬島嶼讓視角拉得過遠；所有圖形仍保留在資料中。
導航矩形涵蓋臺灣本島與金門、馬祖、澎湖等周邊離島（20.4–26.7°N、116.4–124.8°E），
這是瀏覽範圍而非法定領土界線；不涵蓋南海遠端島礁。
此外以既有縣市陸地幾何檢查視窗交集，完全移出陸地時回復上個安全中心與縮放。
