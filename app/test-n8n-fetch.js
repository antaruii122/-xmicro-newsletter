const url = "https://n8n.quicklyandgood.com/webhook/6b334af6-c189-45ed-89f7-4400a8149e05";

fetch(url, { method: 'POST' })
    .then(async r => {
        console.log("Status:", r.status);
        const text = await r.text();
        console.log("Response:", text);
    })
    .catch(e => console.error("Error:", e));
