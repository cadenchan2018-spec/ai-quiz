## Ai quiz（Serverless 版）

### 你而家得到咩
- `index.html`: 前端頁面（**無再包含 AI Key**）
- `api/generate-sentences.js`: Vercel Serverless Function，代你向 SiliconFlow 叫 AI
- `vercel.json`: 路由設定（`/api/*` 走 function，其餘回到 `index.html`）

### 部署到 Vercel（建議）
1. 將整個資料夾推上 GitHub（或直接用 Vercel Import）
2. Vercel Project Settings → Environment Variables 加：
   - `SILICONFLOW_API_KEY` = 你的 SiliconFlow key
3. Deploy

### AI 供應商
`/api/generate-sentences` 只使用 OpenRouter。

- OpenRouter：`OPENROUTER_API_KEY`

OpenRouter 建議（可選）：
- `OPENROUTER_SITE_URL`：例如 `https://quiz.junyanedu.com`
- `OPENROUTER_APP_NAME`：例如 `JunyanEdu AI Quiz`

### 本機開啟
- 你可以直接用瀏覽器開 `index.html` 睇 UI。
- **注意**：AI 生成功能需要跑 Vercel（或 Vercel Dev）先會有 `/api/generate-sentences`。

