import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST() {
    try {
        await kv.del('newsletter:articles');
        await kv.del('newsletter:status');
        await kv.del('newsletter:resume_url');
        return Response.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
