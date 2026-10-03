# SvelteKit 3 升級確認

查核日期：2026-10-03。下方評估保留升級前版本，實作已升至 SvelteKit 3.0.0 與 adapter-auto 8.0.0。

## 實作紀錄

- 已使用官方遷移工具，將 Svelte 設定移入 `vite.config.ts`，移除 `svelte.config.js`。
- `$lib` 與自訂 `@/` 匯入統一改成 `#lib` subpath imports，更新元件產生器 aliases。
- `tsconfig.json` 繼承 `$app/tsconfig`，保留 `src`、`tests` 與根目錄 TypeScript 設定檔的檢查。
- 私有 Token 在 `src/env.ts` 明確宣告，使用 `$app/env/private` 在執行時取得。缺少 Token 仍由 API 回傳 503，不會讓應用啟動失敗。
- 天氣 API 改用 `Response.json()`；地區網址改用 `goto(..., { shallow: true })`，並相容唯讀 `page.url`。
- 型別檢查為 0 errors、0 warnings；Lint、62 個單元測試與生產建置通過。
- 完整 Playwright 回歸測試共 252 個通過，3 個桌面瀏覽器不適用的觸控案例依既有設定略過；覆蓋 Chromium、Firefox、WebKit、Mobile Chrome、Mobile Safari。
- 移開舊 `.svelte-kit` 產物後，離線 `yarn install --immutable`、`yarn check` 與重新建置均通過。尚未執行雲端部署驗證。
- 遷移工具列出的 `goto` 目的地皆為本站地區查詢網址；無 `invalidateAll` 使用，也不依賴開發伺服器靜態資源的跨來源存取，無須額外 CORS 設定。人工遷移項目已完成。

## 升級前評估

SvelteKit 3.0 已於 2026-10-01 正式發布，官方提供自動遷移工具。
[發布公告](https://svelte.dev/blog/sveltekit-3-is-here)

## 版本條件

| 項目                           | 官方最低要求 | 本專案升級前鎖定／執行版本 |
| ------------------------------ | ------------ | -------------------------- |
| Node.js                        | 22.17        | 24.21.0                    |
| Svelte                         | 5.57.1       | 5.57.1                     |
| Vite                           | 8.0.12       | 8.3.1                      |
| TypeScript                     | 6            | 6.0.3                      |
| `@sveltejs/vite-plugin-svelte` | 7            | 7.3.1                      |
| `@sveltejs/kit`                | 3            | 2.70.3，需要升級           |

最低要求來自[官方升級指南](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Updated-dependencies)。
目前版本來自本機 `yarn.lock`、安裝結果與 Node 執行環境。官方建議先使用最新 2.x 查看棄用警告。

`adapter-auto` 7.0.1 的 peer dependency 僅接受 Kit `^2.0.0`，需要升為 8.0.0，並更新 lockfile。2026-10-03 即時讀取 npm registry，8.0.0 的 Kit peer 為 `^3.0.0-next.0`，包含正式版 3.0.0。
[舊版官方 package.json](https://raw.githubusercontent.com/sveltejs/kit/main/packages/adapter-auto/package.json)、[8.0.0 發布 metadata](https://registry.npmjs.org/@sveltejs/adapter-auto/latest)

`svelte-check` 4.7.6 已包含 Kit 3 頂層設定的修正；Vite 設定讀取支援於 4.6.0 加入。目前已使用 4.7.6，且遷移前 `yarn check` 為 0 errors、0 warnings。編輯器仍應使用支援 Vite 設定的 Svelte 擴充套件；本次沒有查核使用者實際安裝版本。
[svelte-check 官方變更紀錄](https://raw.githubusercontent.com/sveltejs/language-tools/master/packages/svelte-check/CHANGELOG.md)

## 必要變更與專案影響

- 將 `svelte.config.js` 的設定移入 `vite.config.ts` 的 `sveltekit({...})`，原本 `kit` 內選項提升一層；保留 preprocessing、adapter 與自訂 `@/*` alias 的效果。
- 將 `$lib` 改為 `#lib`，在 `package.json` 設定 `imports`，並補齊模組副檔名。專案搜尋共命中 38 個檔案，包含 `components.json`；後者的元件產生器 aliases 也須同步。
- `page.url` 改為唯讀，檢查 `SavedPlaces.svelte` 與接受 `URL` 的 `urlForPlace` 型別／複製方式。

上述框架變更依據[官方升級指南](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)；檔案範圍及調整建議依據本專案掃描。

`tsconfig.json` 改為繼承 `$app/tsconfig`，自行設定 `include`／`exclude`。本專案應明確包含實際的 `tests` 目錄，不能直接複製官方範例的單數 `test`。
[$app/tsconfig 文件](https://svelte.dev/docs/kit/$app-tsconfig)

## 建議一併清理與回歸驗證

`SavedPlaces.svelte` 使用的 `pushState`／`replaceState` 屬棄用 API，替代方式是 `goto(url, { shallow: true, state, replace })`。遷移後應驗證選取地區、網址分享、重新整理、上一頁／下一頁與記憶恢復；這些是本專案的主要行為風險。
[$app/navigation 文件](https://svelte.dev/docs/kit/$app-navigation)

兩支天氣 API 使用的 `$env/dynamic/private` 與 `json` 是棄用，並非本版直接移除；可以配合遷移工具整理成新環境變數 API 與 `Response.json()`。環境變數仍須保留伺服器私有及執行時取得的需求。
[棄用項目](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#env-deprecated)

本次掃描沒有發現 hooks、service worker 或 form actions；這些相關 breaking changes 不列為目前工作項目。Remote functions 仍屬實驗功能，本次升級沒有導入需求。
[正式版公告](https://svelte.dev/blog/sveltekit-3-is-here)

## 建議操作順序

1. 保留乾淨、可回復的 Git 基準，確認目前檢查通過；再核對最新 2.x 的棄用提示。
2. 可先列出遷移任務：

   ```bash
   npx sv migrate sveltekit-3 --tasks
   ```

3. 實際遷移時可逐任務審查，或一次執行全部並使用專案既有 Yarn：

   ```bash
   npx sv migrate sveltekit-3 --tasks all --confirm --install yarn
   ```

4. 檢查 diff、adapter peer dependency、lockfile、上述本專案影響，並搜尋 `@migration-task` 完成人工項目。
5. 執行型別檢查、生產建置、現有 API 與瀏覽器測試，再確認部署平台的 preview。

自動工具只轉換可辨識的程式模式；`package-json`、`tsconfig` 是必跑前置任務，部分任務完成不代表專案已可執行。工具可能呼叫現有 `format` 腳本，所以也要審查格式差異。`--confirm` 不略過 dirty working tree 檢查；不要將它誤認為 dry run。
[官方 CLI 文件](https://svelte.dev/docs/cli/sv-migrate)

## 部署平台條件

目前專案使用 `adapter-auto`，尚不能據此推斷正式部署平台。確定平台後，官方建議直接安裝對應 adapter，以將實際 adapter 固定於 lockfile。
[adapter-auto 文件](https://svelte.dev/docs/kit/adapter-auto)

- **Vercel**：Kit 3 adapter 不再支援 Edge runtime；使用 Node runtime，現行文件列出 `nodejs22.x`／`nodejs24.x` 等選項。此專案可以沿用 Node 24，但仍需核對平台設定。
  [遷移注意事項](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Adapters-adapter-vercel)、[Vercel runtime 文件](https://svelte.dev/docs/kit/adapter-vercel#Deployment-configuration)
- **Cloudflare**：Cloudflare 專屬 API 移出 `platform`；改用 `cloudflare:workers` 等原生介面，Wrangler 最低 `^4.67.0`。若實際部署於 Cloudflare，另核對 binding、相容性旗標與本機模擬。此專案目前未發現使用相關 `platform` API。
  [遷移注意事項](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Adapters-adapter-cloudflare)、[Cloudflare adapter 文件](https://svelte.dev/docs/kit/adapter-cloudflare)

即使本機 `adapter-auto` 建置成功，也不能單獨證明特定雲端 adapter 的輸出及執行時環境已驗證。
