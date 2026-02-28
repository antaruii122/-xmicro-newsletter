import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST(request) {
    try {
        const body = await request.json();
        const { selected_articles, mode = 'generate' } = body;

        if (!selected_articles || selected_articles.length === 0) {
            return Response.json({ error: 'No articles selected' }, { status: 400 });
        }

        // Use the fixed Workflow 2 webhook URL from env
        const submitUrl = process.env.N8N_SUBMIT_WEBHOOK_URL;

        if (!submitUrl) {
            return Response.json({ error: 'N8N_SUBMIT_WEBHOOK_URL is not configured.' }, { status: 500 });
        }

        // If preview mode, clear any stale preview HTML so polling starts fresh
        if (mode === 'preview') {
            await kv.del('newsletter:preview_html');
        }

        const n8nResponse = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selected_articles,
                article_count: selected_articles.length,
                submitted_at: new Date().toISOString(),
                mode,
            }),
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n responded with ${n8nResponse.status}`);
        }

        await kv.set('newsletter:status', mode === 'preview' ? 'previewing' : 'sent', { ex: 86400 });

        return Response.json({
            success: true,
            mode,
            message: mode === 'preview'
                ? 'Preview requested. Generating HTML...'
                : `${selected_articles.length} artículos enviados a n8n.`,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
