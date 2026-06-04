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
