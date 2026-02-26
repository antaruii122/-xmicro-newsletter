# X-Micro Newsletter Editor

A web app for manually curating articles before sending the weekly intelligence newsletter.

## How it works

1. n8n runs the searches and POSTs all articles to `/api/receive`
2. You open this app, review articles, check the ones you want
3. You click "Generar Newsletter" — selected articles are sent back to n8n
4. n8n's AI agent writes the analysis and sends the email

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/xmicro-newsletter.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repo
3. Vercel will auto-detect Next.js — click **Deploy**

### 3. Set up Vercel KV (database)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → select **KV (Redis)**
3. Name it `newsletter-kv`, click **Create**
4. Vercel will automatically add the KV environment variables to your project
5. Redeploy the project (Vercel dashboard → **Redeploy**)

---

## n8n Workflow Changes

In your n8n workflow, after the **Aggregate All Results** node:

### Step 1 — Add HTTP Request node (POST to web app)
- **Name:** Send Articles to Web App
- **Method:** POST
- **URL:** `https://YOUR-APP.vercel.app/api/receive`
- **Body (JSON):**
```json
{
  "all_results": {{ $json.all_results }},
  "total_articles": {{ $json.total_articles }},
  "resume_url": "PASTE_N8N_RESUME_WEBHOOK_URL_HERE"
}
```

### Step 2 — Add Wait node
- **Type:** Webhook
- Copy the **Resume URL** it generates — paste it into the HTTP Request body above as `resume_url`

### Step 3 — After the Wait node, add AI Agent
- The AI Agent now receives `{{ $json.selected_articles }}` — your manually chosen articles
- Update the AI Agent prompt to reference `$json.selected_articles` instead of all results

---

## Environment Variables (auto-set by Vercel KV)

These are set automatically when you connect Vercel KV:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

---

## Local Development

```bash
npm install
# Add a .env.local file with your KV credentials from Vercel dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
