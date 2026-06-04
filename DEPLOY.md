# Optionality Network 部署說明

這是一個可直接部署的靜態 MVP。

## 直接部署

把 `outputs` 資料夾中的檔案上傳到任何靜態網站服務：

- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages
- 任何支援 HTML/CSS/JS 的主機

入口檔案是：

```text
index.html
```

## 最快上線方式

### Netlify 拖曳部署

1. 打開 Netlify 的部署頁。
2. 選擇 Add new site。
3. 選擇 Deploy manually。
4. 把整個 `outputs` 資料夾拖進去。
5. Netlify 會產生公開網址。

### Vercel 部署

1. 建立一個新專案。
2. 上傳或連接包含 `outputs` 內容的 repo。
3. Framework Preset 選 Other。
4. Build Command 留空。
5. Output Directory 設為 `outputs`，或如果只上傳 outputs 內容就設為 `.`。
6. 點 Deploy。

### Cloudflare Pages

1. 建立 Pages 專案。
2. 上傳 `outputs` 資料夾內容。
3. Build command 留空。
4. Output directory 設為 `/` 或 `outputs`，依上傳方式而定。

## MVP 功能

- 註冊會員申請
- 選擇我擁有的資源
- 選擇我需要的資源
- 後台審核會員
- 搜尋與篩選會員
- 發送合作請求
- 發布合作機會
- 處理合作請求
- 編輯資源分類
- 使用瀏覽器 localStorage 暫存資料

## 注意

目前資料存在使用者瀏覽器本機，適合 Demo、MVP 驗證和早期產品展示。
若要多人共用正式資料，下一步可接 Supabase，將會員、機會、請求、分類與管理員審核改成雲端資料庫。

## Supabase 雲端多人版

這個版本已經支援 Supabase。沒有設定 Supabase 時會跑 Demo 模式；設定後會變成真正多人共用網站。

### 1. 建立 Supabase 專案

到 Supabase 建立新專案，進入 SQL Editor，貼上並執行：

```text
supabase-schema.sql
```

執行前請把 SQL 最後的：

```text
your-email@example.com
```

改成你的登入 Email，這樣你才會是管理員，可以審核會員。

### 2. 填入網站設定

打開：

```text
config.js
```

改成你的 Supabase 專案資料：

```js
window.OPTIONALITY_CONFIG = {
  supabaseUrl: "https://your-project-id.supabase.co",
  supabasePublishableKey: "你的 publishable key",
  adminEmails: ["你的管理員 Email"]
};
```

Supabase URL 和 publishable key 在 Supabase 專案的 Project Settings / API 裡。

### 3. 設定登入 Redirect URL

到 Supabase：

```text
Authentication → URL Configuration
```

設定：

```text
Site URL: https://你的 GitHub 帳號.github.io/optionality-network/
Redirect URLs: https://你的 GitHub 帳號.github.io/optionality-network/
```

如果你用自訂網域，也把自訂網域加入 Redirect URLs。

### 4. 重新上傳到 GitHub

把這些檔案更新到 GitHub repo 根目錄：

```text
index.html
styles.css
app.js
config.js
supabase-schema.sql
DEPLOY.md
netlify.toml
vercel.json
```

GitHub Pages 重新部署後，網站會顯示「雲端模式」。
