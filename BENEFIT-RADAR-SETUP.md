# 福利雷達一次性設定

完成後，系統每天台灣時間約上午 9:10 抓取最多 20 筆新福利，並在每天凌晨自動整理已截止活動。

## 1. 建立資料表

1. 打開 Supabase `SQL Editor`
2. 建立新查詢
3. 貼上 `benefit-radar.sql` 全部內容
4. 按 `Run`

## 2. 建立抓取函式

1. 到 Supabase `Edge Functions`
2. 建立函式，名稱填 `benefit-fetcher`
3. 將 `benefit-fetcher.ts` 全部貼進函式
4. 關閉 `Verify JWT`
5. 部署函式

## 3. 設定抓取密碼

1. 到 Edge Functions 的 `Secrets`
2. 新增：
   - 名稱：`BENEFIT_FETCH_SECRET`
   - 值：自行設定一串至少 24 字元的隨機文字
3. 不要把這串密碼上傳到 GitHub

## 4. 測試一次

在 Edge Function 測試工具送出：

- Method：`POST`
- Header：`x-benefit-secret`
- Value：剛設定的密碼
- Body：`{}`

成功後會顯示新增筆數。福利會出現在網站的「福利探索」。

## 5. 每日排程

1. 打開 `benefit-fetcher-cron.sql`
2. 把 `YOUR_BENEFIT_FETCH_SECRET` 換成同一串抓取密碼
3. 到 Supabase `SQL Editor` 建立新查詢
4. 貼上全部內容並按 `Run`

## 注意

- 系統最多新增 20 筆，不會為了湊數重複舊福利。
- 來源頁沒有新活動時，當天可能少於 10 筆。
- 系統會優先辨識官方頁面寫出的截止日期；例如活動到 6 月 9 日，6 月 10 日會移到「過期活動」。
- 找不到明確期限時，資料預設保留 30 天後離開主要列表。
- 官方網站改版時，個別來源可能暫時抓不到，可在 `benefit-fetcher.ts` 更新來源網址。
