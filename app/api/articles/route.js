import { Redis } from '@upstash/redis'
const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

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
