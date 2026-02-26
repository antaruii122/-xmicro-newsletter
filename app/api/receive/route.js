import { kv } from '@vercel/kv';

export async function POST(request) {
    try {
        const body = await request.json();
        const { all_results, total_articles, resume_url } = body;

        const articles = [];
        const categoryMap = {
            dram_pricing: 'DRAM',
            nand_storage: 'NAND',
            supply_chain: 'SUPPLY',
        };

        for (const [key, results] of Object.entries(all_results || {})) {
            const category = categoryMap[key] || key.toUpperCase();
            for (const article of results) {
                articles.push({
                    id: Buffer.from(article.url).toString('base64').slice(0, 16),
                    headline: article.title || 'Sin título',
                    summary: article.content || article.snippet || '',
                    url: article.url,
                    source: (() => { try { return new URL(article.url).hostname.replace('www.', ''); } catch { return ''; } })(),
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
