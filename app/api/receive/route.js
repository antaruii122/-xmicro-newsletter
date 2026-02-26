import { Redis } from '@upstash/redis'

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export async function POST(request) {
    let rawText = '';
    try {
        rawText = await request.text();

        // Try every possible way n8n might encode the body:
        // Strategy 1: direct JSON parse
        // Strategy 2: URL-decode then parse (handles application/x-www-form-urlencoded)
        // Strategy 3: regex-extract the JSON object from whatever prefix/suffix exists

        let data = null;

        const strategies = [
            // 1. Direct parse
            () => JSON.parse(rawText),
            // 2. URL-decode first (handles when n8n sends it as form value)
            () => JSON.parse(decodeURIComponent(rawText)),
            // 3. Strip leading "=" then parse
            () => JSON.parse(rawText.replace(/^=+/, '')),
            // 4. URL-decode then strip "=" then parse
            () => JSON.parse(decodeURIComponent(rawText).replace(/^=+/, '')),
            // 5. Extract first {...} block by regex (handles any prefix/suffix junk)
            () => {
                const m = rawText.match(/\{[\s\S]*\}/);
                if (!m) throw new Error('no JSON block found');
                return JSON.parse(m[0]);
            },
            // 6. URL-decode then extract first {...} block
            () => {
                const decoded = decodeURIComponent(rawText);
                const m = decoded.match(/\{[\s\S]*\}/);
                if (!m) throw new Error('no JSON block found after decode');
                return JSON.parse(m[0]);
            },
        ];

        for (const strategy of strategies) {
            try {
                let result = strategy();

                // If the result is a string, it means n8n sent the body as a JSON-escaped string
                // Example: `"={\"all_results\":...}"` -> JSON.parse -> `={"all_results":...}`
                // We must strip the leading '=' from this inner string and parse again!
                if (typeof result === 'string') {
                    const innerText = result.trim().replace(/^=+/, '');
                    result = JSON.parse(innerText);
                }

                // Make sure we actually got an object with all_results
                if (result && typeof result === 'object' && result.all_results) {
                    data = result;
                    break;
                }
            } catch (_) {
                // Try next strategy
            }
        }

        if (!data) {
            return Response.json({
                error: 'Could not parse body with any strategy',
                raw_start: rawText.slice(0, 100),
            }, { status: 400 });
        }

        // Flatten all categories into [{title, url, category}]
        const articles = [];
        for (const [category, items] of Object.entries(data.all_results || {})) {
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (item && item.title && item.url) {
                    articles.push({ title: item.title, url: item.url, category });
                }
            }
        }

        await kv.set('newsletter:articles', JSON.stringify(articles), { ex: 86400 });
        if (data.resume_url) await kv.set('newsletter:resume_url', data.resume_url, { ex: 86400 });

        return Response.json({ success: true, count: articles.length });

    } catch (err) {
        return Response.json({
            error: err.message,
            raw_start: rawText.slice(0, 100),
        }, { status: 500 });
    }
}
