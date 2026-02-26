import { kv } from '@vercel/kv';

export async function GET() {
    try {
        const raw = await kv.get('newsletter:articles');
        const status = await kv.get('newsletter:status');

        if (!raw) {
            return Response.json({ articles: [], status: 'empty' });
        }

        const articles = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Response.json({ articles, status: status || 'pending' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
