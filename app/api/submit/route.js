import { kv } from '@vercel/kv';

export async function POST(request) {
    try {
        const body = await request.json();
        const { selected_articles } = body;

        if (!selected_articles || selected_articles.length === 0) {
            return Response.json({ error: 'No articles selected' }, { status: 400 });
        }

        const resumeUrl = await kv.get('newsletter:resume_url');

        if (!resumeUrl) {
            return Response.json({ error: 'No n8n resume URL found.' }, { status: 400 });
        }

        const n8nResponse = await fetch(resumeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selected_articles,
                article_count: selected_articles.length,
                submitted_at: new Date().toISOString(),
            }),
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n responded with ${n8nResponse.status}`);
        }

        await kv.set('newsletter:status', 'sent', { ex: 86400 });

        return Response.json({
            success: true,
            message: `${selected_articles.length} artículos enviados a n8n.`,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
