import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST(request) {
    try {
        const body = await request.json();
        const { html } = body;

        if (!html) {
            return Response.json({ error: 'No HTML provided' }, { status: 400 });
        }

        // Store with 10-minute TTL
        await kv.set('newsletter:preview_html', html, { ex: 600 });

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
