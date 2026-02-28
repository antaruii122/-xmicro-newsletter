import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function GET() {
    try {
        const html = await kv.get('newsletter:preview_html');
        return Response.json({ html: html || null });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// Allow n8n or manual DELETE to clear the preview
export async function DELETE() {
    try {
        await kv.del('newsletter:preview_html');
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
