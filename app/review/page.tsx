"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Article {
    title: string;
    description?: string;
    url: string;
    category: string;
}

export default function ReviewPage() {
    const router = useRouter();
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("selectedArticles");
        if (stored) {
            try {
                setSelectedArticles(JSON.parse(stored));
            } catch (err) {
                console.error("Parse error", err);
            }
        }
    }, []);

    const removeArticle = (urlToRemove: string) => {
        const updated = selectedArticles.filter(a => a.url !== urlToRemove);
        setSelectedArticles(updated);
        if (updated.length > 0) {
            sessionStorage.setItem("selectedArticles", JSON.stringify(updated));
        } else {
            sessionStorage.removeItem("selectedArticles");
        }
    };

    const handleGenerate = async () => {
        if (selectedArticles.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selected_articles: selectedArticles })
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message || `Newsletter Generation Triggered successfully.`);
                // Clear selection and go back to dashboard
                sessionStorage.removeItem("selectedArticles");
                router.push("/");
            } else {
                alert(`Error: ${data.error || 'Failed to submit.'}`);
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("An error occurred while submitting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="review-container">
            <header className="header" style={{ marginBottom: "1rem" }}>
                <div>
                    <button
                        className="action-btn secondary"
                        onClick={() => router.push("/")}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", marginBottom: "1rem" }}
                    >
                        &larr; Back to Dashboard
                    </button>
                    <h1>Review Selections</h1>
                </div>
            </header>

            {selectedArticles.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", background: "var(--surface)", borderRadius: "0.5rem" }}>
                    <h3 style={{ marginBottom: "0.5rem" }}>No articles selected</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        Go back to the dashboard to select some articles for the newsletter.
                    </p>
                    <button className="action-btn" onClick={() => router.push("/")}>
                        &larr; Back to Dashboard
                    </button>
                </div>
            ) : (
                <div className="review-list">
                    <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        You have selected <strong>{selectedArticles.length}</strong> articles for generation.
                    </p>

                    {selectedArticles.map((article, i) => (
                        <div key={i} className="review-item">
                            <div className="review-item-content">
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="review-item-title"
                                >
                                    {article.title}
                                </a>
                                <div className="review-item-meta">
                                    <span className={`tag ${article.category}`}>{article.category}</span>
                                    <span>&bull;</span>
                                    <span>
                                        {(() => {
                                            try { return new URL(article.url).hostname.replace("www.", ""); }
                                            catch { return "link"; }
                                        })()}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={() => removeArticle(article.url)}
                                title="Remove from selection"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                        <button
                            className="action-btn danger"
                            onClick={() => {
                                sessionStorage.removeItem("selectedArticles");
                                setSelectedArticles([]);
                            }}
                        >
                            Clear All
                        </button>
                        <button
                            className="action-btn success"
                            onClick={handleGenerate}
                            disabled={isSubmitting || selectedArticles.length === 0}
                            style={{ padding: "0.8rem 1.5rem", fontSize: "1rem" }}
                        >
                            {isSubmitting ? "Generating..." : `Generate Newsletter (${selectedArticles.length})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
