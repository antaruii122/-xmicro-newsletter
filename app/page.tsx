"use client";

import { useState, useEffect } from "react";

interface Article {
    title: string;
    url: string;
    category: string;
}

export default function NewsletterDashboard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);

    // Load articles from Redis on page mount
    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const res = await fetch("/api/articles");
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.articles || []);
                setArticles(list);
            }
        } catch (err) {
            console.error("Failed to load articles:", err);
        }
    };

    const handleFetchNews = async () => {
        setLoading(true);
        try {
            // Trigger n8n workflow
            await fetch("https://n8n.quicklyandgood.com/webhook/6b334af6-c189-45ed-89f7-4400a8149e05", {
                method: "POST"
            });

            // Poll every 5s until articles appear (max 90s)
            const start = Date.now();
            const poll = setInterval(async () => {
                const res = await fetch("/api/articles");
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.articles || []);
                    if (list.length > 0) {
                        setArticles(list);
                        clearInterval(poll);
                        setLoading(false);
                    }
                }
                if (Date.now() - start > 90000) {
                    clearInterval(poll);
                    setLoading(false);
                }
            }, 5000);
        } catch (err) {
            console.error("Error:", err);
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
            <h1 style={{ marginBottom: "1rem" }}>X-Micro Newsletter</h1>

            <button
                onClick={handleFetchNews}
                disabled={loading}
                style={{
                    padding: "0.6rem 1.4rem",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginBottom: "2rem",
                    fontSize: "1rem"
                }}
            >
                {loading ? "Fetching..." : "Fetch News"}
            </button>

            {articles.length === 0 ? (
                <p style={{ color: "#888" }}>No articles yet. Click "Fetch News" to load.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {articles.map((a, i) => (
                        <li key={i} style={{
                            borderBottom: "1px solid #e5e7eb",
                            padding: "0.75rem 0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem"
                        }}>
                            <span style={{
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                color: "#6b7280",
                                fontWeight: 600,
                                letterSpacing: "0.05em"
                            }}>
                                {a.category}
                            </span>
                            <a
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#1d4ed8", fontWeight: 500, textDecoration: "none" }}
                            >
                                {a.title}
                            </a>
                            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                                {(() => { try { return new URL(a.url).hostname.replace("www.", ""); } catch { return ""; } })()}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
