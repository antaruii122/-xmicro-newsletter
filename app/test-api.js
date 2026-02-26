const fs = require('fs');
const env = fs.readFileSync('../.env.local', 'utf8');
const urlMatch = env.match(/KV_REST_API_URL=\"?(https:\/\/[^\"]+)\"?/);
const tokenMatch = env.match(/KV_REST_API_TOKEN=\"?([^\"]+)\"?/);

if (!urlMatch || !tokenMatch) {
    console.log('Env missing');
    process.exit(1);
}

const url = urlMatch[1] + '/get/newsletter:articles';
const token = tokenMatch[1];

fetch(url, { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.json())
    .then(d => {
        try {
            const parsed = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
            console.log(JSON.stringify(parsed.slice(0, 3), null, 2));
        } catch (e) {
            console.error(e);
        }
    });
