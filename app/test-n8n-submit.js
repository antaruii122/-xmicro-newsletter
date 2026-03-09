const url = "https://n8n.quicklyandgood.com/webhook/783f69b2-4bbf-417d-b207-79104a49bba4";
const body = {
    selected_articles: [
        { title: "Test Article 1", url: "https://example.com/1", category: "DRAM" },
        { title: "Test Article 2", url: "https://example.com/2", category: "NAND" }
    ],
    article_count: 2,
    submitted_at: new Date().toISOString(),
    mode: "preview"
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})
    .then(async r => {
        console.log("Status:", r.status);
        const text = await r.text();
        console.log("Response:", text);
    })
    .catch(e => console.error("Error:", e));
