"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Article {
    title: string;
    description?: string;
    url: string;
    category: string;
}

export default function NewsletterDashboard() {
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());

    // Load articles from Redis and previous selections from sessionStorage on mount
    useEffect(() => {
        fetchArticles();
        const savedSelections = sessionStorage.getItem("selectedArticles");
        if (savedSelections) {
            try {
                const parsed = JSON.parse(savedSelections);
                const urls = new Set<string>(parsed.map((a: Article) => a.url));
                setSelectedUrls(urls);
            } catch (e) {
                console.error("Failed to parse saved selections", e);
            }
        }
    }, []);

    // Save selections whenever they change
    useEffect(() => {
        const selectedArticles = articles.filter(a => selectedUrls.has(a.url));
        if (selectedArticles.length > 0) {
            sessionStorage.setItem("selectedArticles", JSON.stringify(selectedArticles));
        } else {
            sessionStorage.removeItem("selectedArticles");
        }
    }, [selectedUrls, articles]);

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

    const handleClearNews = async () => {
        if (!confirm("Are you sure you want to clear all fetched articles?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/clear", { method: "POST" });
            if (res.ok) {
                setArticles([]);
                setSelectedUrls(new Set());
                sessionStorage.removeItem("selectedArticles");
            } else {
                console.error("Failed to clear data");
            }
        } catch (err) {
            console.error("Error clearing data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchNews = async () => {
        setLoading(true);
        try {
            await fetch("https://n8n.quicklyandgood.com/webhook/6b334af6-c189-45ed-89f7-4400a8149e05", {
                method: "POST"
            });
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

    const toggleSelection = (url: string) => {
        const next = new Set(selectedUrls);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        setSelectedUrls(next);
    };

    const toggleExpand = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedUrls);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        setExpandedUrls(next);
    };

    const toggleAllVisible = () => {
        const allVisibleUrls = filteredArticles.map(a => a.url);
        const allSelected = allVisibleUrls.every(url => selectedUrls.has(url));

        const next = new Set(selectedUrls);
        if (allSelected) {
            allVisibleUrls.forEach(url => next.delete(url));
        } else {
            allVisibleUrls.forEach(url => next.add(url));
        }
        setSelectedUrls(next);
    };

    const filteredArticles = articles.filter(article => {
        const matchesFilter =
            activeFilter === "ALL" ||
            (article.category || "").toUpperCase() === activeFilter.toUpperCase();

        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            (article.title || "").toLowerCase().includes(q) ||
            (article.description || "").toLowerCase().includes(q) ||
            (article.url || "").toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="dashboard-container">
            <header className="header">
                <h1>X-Micro Market Intelligence</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="action-btn danger"
                        onClick={handleClearNews}
                        disabled={loading || articles.length === 0}
                    >
                        Clear All Data
                    </button>
                    <button
                        className="fetch-btn"
                        onClick={handleFetchNews}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite", width: "16px", height: "16px" }}>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fetching Latest...
                            </>
                        ) : "Fetch Market News"}
                    </button>
                </div>
            </header>

            <div className="controls">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search headlines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="filter-group">
                    {["ALL", "DRAM", "NAND", "SUPPLY"].map(filter => (
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

            {articles.length > 0 && (
                <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={toggleAllVisible}
                        className="action-btn secondary"
                        style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                        {filteredArticles.every(a => selectedUrls.has(a.url)) ? "Deselect All Visible" : "Select All Visible"}
                    </button>
                </div>
            )}

            {articles.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-secondary)", background: "var(--surface)", borderRadius: "0.5rem", marginTop: "2rem", border: "1px dashed var(--border)" }}>
                    <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No market data loaded.</p>
                    <p style={{ fontSize: "0.85rem" }}>Click "Fetch Market News" to grab the latest intelligence.</p>
                </div>
            ) : filteredArticles.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No articles match your filters.
                </div>
            ) : (
                <div className="article-grid">
                    {filteredArticles.map((article, i) => {
                        const isSelected = selectedUrls.has(article.url);
                        const isExpanded = expandedUrls.has(article.url);
                        return (
                            <div
                                key={i}
                                className={`article-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleSelection(article.url)}
                            >
                                <div className="card-header">
                                    <span className={`tag ${article.category || 'GENERAL'}`}>
                                        {article.category || 'NEWS'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="card-checkbox"
                                        checked={isSelected}
                                        readOnly
                                    />
                                </div>

                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="card-title"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {article.title}
                                </a>
                                {article.description ? (
                                    <p className="card-description">{article.description}</p>
                                ) : (
                                    <p className="card-description" style={{ fontStyle: 'italic', opacity: 0.5, color: 'var(--text-secondary)' }}>
                                        No text provided by source.
                                    </p>
                                )}

                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
                                        {article.url}
                                    </a>
                                </div>

                                <div className="card-footer">
                                    <span>
                                        {(() => {
                                            try { return new URL(article.url).hostname.replace("www.", ""); }
                                            catch { return "link"; }
                                        })()}
                                    </span>
                                    <button
                                        className="expand-btn"
                                        onClick={(e) => toggleExpand(article.url, e)}
                                    >
                                        {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sticky Bottom Bar */}
            <div className="action-bar" style={{ transform: selectedUrls.size > 0 ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div className="selection-info">
                    <span className="pill">{selectedUrls.size}</span>
                    <span>Article{selectedUrls.size !== 1 ? 's' : ''} Selected</span>
                </div>
                <button
                    className="action-btn success"
                    onClick={() => router.push('/review')}
                >
                    Review Selections &rarr;
                </button>
            </div>
        </div>
    );
}
