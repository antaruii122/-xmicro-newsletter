import { Redis } from '@upstash/redis'
const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST(request) {
    try {
        const rawText = await request.text();

        let body;
        try {
            let parsed = JSON.parse(rawText);
            // n8n double-encodes: JSON.stringify() result gets re-encoded by HTTP Request node
            // So parsed may be a string that itself contains JSON — parse it again
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            body = parsed;
        } catch (parseErr) {
            return Response.json({
                error: 'Body is not valid JSON',
                raw_first_100: rawText.slice(0, 100),
                parse_error: parseErr.message
            }, { status: 400 });
        }

        const { all_results, total_articles, resume_url } = body;

        const articles = [];
        const categoryMap = {
            dram_pricing: 'DRAM',
            nand_storage: 'NAND',
            supply_chain: 'SUPPLY',
        };

        for (const [key, results] of Object.entries(all_results || {})) {
            const category = categoryMap[key] || key.toUpperCase();
            const items = Array.isArray(results) ? results : [results];

            for (const article of items) {
                if (!article || typeof article !== 'object') continue;

                const articleUrl = article.url || 'https://unknown-url.com/' + Math.random();

                articles.push({
                    id: Buffer.from(articleUrl).toString('base64').slice(0, 16),
                    headline: article.title || 'Sin título',
                    summary: article.content || article.snippet || '',
                    url: articleUrl,
                    source: (() => { try { return new URL(articleUrl).hostname.replace('www.', ''); } catch { return ''; } })(),
                    published_date: article.published_date || null,
                    category,
                    score: article.score || 0,
                });
            }
        }

        articles.sort((a, b) => b.score - a.score);

        await kv.set('newsletter:articles', JSON.stringify(articles), { ex: 86400 });
        if (resume_url) {
            await kv.set('newsletter:resume_url', resume_url, { ex: 86400 });
        }
        await kv.set('newsletter:status', 'pending', { ex: 86400 });

        return Response.json({ success: true, article_count: articles.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
