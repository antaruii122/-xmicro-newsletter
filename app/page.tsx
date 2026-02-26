"use client";

import { useState, useRef, useEffect } from "react";

// The exact structure matching n8n output
interface Article {
    id: string;
    headline: string;
    summary: string;
    url: string;
    source: string;
    category: "DRAM" | "NAND" | "SUPPLY";
    published_date: string;
    score: number;
}

// Mock Data matching n8n schema
const MOCK_ARTICLES: Article[] = [
    {
        id: "art-001",
        headline: "Samsung to cut legacy DRAM production by 30% in Q3",
        summary: "In a move to stabilize prices, Samsung Electronics announced a deeper cut to legacy DDR4 production, focusing resources on HBM3E and DDR5 advanced nodes.",
        url: "https://example.com/samsung-dram-cut",
        source: "Digitimes",
        category: "DRAM",
        published_date: "2026-02-25",
        score: 85
    },
    {
        id: "art-002",
        headline: "NAND Flash contract prices projected to rise 15% amid AI server demand",
        summary: "Enterprise SSD demand continues to outpace supply, leading major NAND manufacturers to aggressively raise contract prices for the upcoming quarter.",
        url: "https://example.com/nand-price-hike",
        source: "TrendForce",
        category: "NAND",
        published_date: "2026-02-26",
        score: 92
    },
    {
        id: "art-003",
        headline: "New TSMC Fab in Arizona faces delays due to localized supply chain bottlenecks",
        summary: "Critical materials including specialized chemicals are facing import delays, potentially pushing back full operational capacity for TSMC's new Arizona facility.",
        url: "https://example.com/tsmc-az-delay",
        source: "Bloomberg Tech",
        category: "SUPPLY",
        published_date: "2026-02-24",
        score: 78
    }
];

type FilterType = "ALL" | "DRAM" | "NAND" | "SUPPLY";

export default function InternalDashboard() {
    const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFetching, setIsFetching] = useState(false);

    // Filter logic
    const filteredArticles = articles.filter((article) => {
        const matchesFilter = activeFilter === "ALL" || article.category === activeFilter;
        const matchesSearch =
            article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Toggle single selection
    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    // Toggle all visible logic
    const toggleAllVisible = () => {
        if (filteredArticles.length === 0) return;

        // If all visible are selected, deselect them. Otherwise, select all visible.
        const allVisibleSelected = filteredArticles.every(a => selectedIds.has(a.id));

        if (allVisibleSelected) {
            // Remove visible ones from selection
            const next = new Set(selectedIds);
            filteredArticles.forEach(a => next.delete(a.id));
            setSelectedIds(next);
        } else {
            // Add all visible to selection
            const next = new Set(selectedIds);
            filteredArticles.forEach(a => next.add(a.id));
            setSelectedIds(next);
        }
    };

    const handleFetchNews = async () => {
        setIsFetching(true);
        try {
            // 1. Send POST to n8n webhook
            await fetch("https://n8n.quicklyandgood.com/webhook/6b334af6-c189-45ed-89f7-4400a8149e05", {
                method: "POST"
            });
            console.log("n8n webhook triggered");

            // 2. Poll the local API endpoint every 5 seconds
            const pollInterval = setInterval(async () => {
                try {
                    const res = await fetch("/api/articles");
                    if (res.ok) {
                        const data = await res.json();
                        // Assuming data returns an array, or an object containing an array. Adapt if necessary.
                        const fetchedArticles = Array.isArray(data) ? data : (data.articles || []);

                        if (fetchedArticles && fetchedArticles.length > 0) {
                            setArticles(fetchedArticles as Article[]);
                            setSelectedIds(new Set()); // Reset selections on new data
                            clearInterval(pollInterval);
                            clearTimeout(timeoutId);
                            setIsFetching(false);
                            console.log("Successfully fetched new articles");
                        }
                    }
                } catch (err) {
                    console.error("Error during polling:", err);
                }
            }, 5000);

            // 3. Set a 90 second timeout safety fallback
            const timeoutId = setTimeout(() => {
                clearInterval(pollInterval);
                setIsFetching(false);
                console.log("Polling timed out after 90 seconds");
                // We aren't strictly required to alert, but keeping the visual state clear.
            }, 90000);

        } catch (error) {
            console.error("Failed to trigger webhook:", error);
            setIsFetching(false);
        }
    };

    const handleGenerate = async () => {
        setIsFetching(true);
        try {
            const selectedArticles = articles.filter(a => selectedIds.has(a.id));
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selected_articles: selectedArticles })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || `Newsletter Generation Triggered successfully.`);
                setSelectedIds(new Set());
            } else {
                alert(`Error: ${data.error || 'Failed to submit.'}`);
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("An error occurred while submitting.");
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="header">
                <h1>Newsletter Generator (Internal Tool)</h1>
                <button
                    className={`fetch-btn ${isFetching ? 'pulsing' : ''}`}
                    onClick={handleFetchNews}
                    disabled={isFetching}
                >
                    {isFetching ? "Buscando noticias..." : "Buscar Noticias"}
                </button>
            </header>

            <div className="controls">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="filter-group">
                    {(["ALL", "DRAM", "NAND", "SUPPLY"] as FilterType[]).map((filter) => (
                        <button
                            key={filter}
                            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="article-list">
                {/* Bulk select visible */}
                {filteredArticles.length > 0 && (
                    <div className="article-card" style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none' }}>
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={filteredArticles.every(a => selectedIds.has(a.id))}
                                onChange={toggleAllVisible}
                                title="Select/Deselect all visible"
                                disabled={isFetching}
                            />
                        </div>
                        <div className="article-content" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Select All Visible
                        </div>
                    </div>
                )}

                {filteredArticles.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No articles found matching filters.
                    </div>
                ) : (
                    filteredArticles.map((article) => {
                        const isSelected = selectedIds.has(article.id);
                        return (
                            <div key={article.id} className={`article-card ${isSelected ? 'selected' : ''} ${isFetching ? 'loading' : ''}`}>
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        className="custom-checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(article.id)}
                                        disabled={isFetching}
                                    />
                                </div>
                                <div className="article-content">
                                    <div className="article-header">
                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-title">
                                            {article.headline}
                                        </a>
                                        <span className={`tag ${article.category}`}>{article.category}</span>
                                    </div>
                                    <div className="article-meta">
                                        <span>{article.source}</span>
                                        <span>&bull;</span>
                                        <span>{article.published_date}</span>
                                        <span>&bull;</span>
                                        <span>Score: {article.score}</span>
                                    </div>
                                    <p className="article-summary">{article.summary}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="action-bar">
                <div className="selection-info">
                    {selectedIds.size} article{selectedIds.size !== 1 ? 's' : ''} selected
                </div>
                <button
                    className="generate-btn"
                    disabled={selectedIds.size === 0 || isFetching}
                    onClick={handleGenerate}
                >
                    Generar Newsletter
                </button>
            </div>
        </div>
    );
}
