import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST(request) {
    try {
        // Read raw body - n8n sends it in various encodings, handle all cases
        let text = await request.text();

        // n8n sometimes prepends "=" (URL-encoded form quirk) — strip it
        text = text.trim();
        if (text.startsWith('=')) text = text.slice(1);

        // n8n sometimes double-encodes (JSON string inside a JSON string) — unwrap
        let data = JSON.parse(text);
        if (typeof data === 'string') data = JSON.parse(data);

        // data.all_results is { dram_pricing: [...], nand_storage: [...], supply_chain: [...] }
        const all_results = data.all_results || {};
        const resume_url = data.resume_url || null;

        // Flatten all categories into a simple list of { title, url }
        const articles = [];
        for (const [category, items] of Object.entries(all_results)) {
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (item && item.title && item.url) {
                    articles.push({ title: item.title, url: item.url, category });
                }
            }
        }

        // Save to Redis
        await kv.set('newsletter:articles', JSON.stringify(articles), { ex: 86400 });
        if (resume_url) await kv.set('newsletter:resume_url', resume_url, { ex: 86400 });

        return Response.json({ success: true, count: articles.length });

    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
