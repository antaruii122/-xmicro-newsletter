const fs = require('fs');
const env = fs.readFileSync('../.env.local', 'utf8');
const urlMatch = env.match(/KV_REST_API_URL=\"?(https:\/\/[^\"]+)\"?/);
const tokenMatch = env.match(/KV_REST_API_TOKEN=\"?([^\"]+)\"?/);

if (!urlMatch || !tokenMatch) {
    process.exit(1);
}

const url = urlMatch[1] + '/keys/*';
const token = tokenMatch[1];

fetch(url, { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.json())
    .then(d => {
        console.log('Keys:', d.result);
    });
