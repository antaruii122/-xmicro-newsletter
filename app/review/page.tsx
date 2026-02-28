"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Article {
    title: string;
    description?: string;
    url: string;
    category: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000; // 2 minutes max

export default function ReviewPage() {
    const router = useRouter();
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollStart = useRef<number>(0);

    useEffect(() => {
        const stored = sessionStorage.getItem("selectedArticles");
        if (stored) {
            try { setSelectedArticles(JSON.parse(stored)); }
            catch (err) { console.error("Parse error", err); }
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
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

    /* ── 1. Generate Newsletter (fire-and-forget → email) ── */
    const handleGenerate = async () => {
        if (selectedArticles.length === 0) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "generate", selected_articles: selectedArticles })
            });
            const data = await res.json();
            if (res.ok) {
                alert("✅ Newsletter en camino — revisa tu bandeja de entrada en unos minutos.");
                sessionStorage.removeItem("selectedArticles");
                router.push("/");
            } else {
                alert(`Error: ${data.error || "Failed to submit."}`);
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("An error occurred while submitting.");
        } finally {
            setIsGenerating(false);
        }
    };

    /* ── 2. Preview HTML (poll until n8n posts back) ── */
    const handlePreview = async () => {
        if (selectedArticles.length === 0) return;
        setIsPreviewing(true);
        setPreviewHtml(null);

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "preview", selected_articles: selectedArticles })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(`Error: ${data.error || "Failed to request preview."}`);
                setIsPreviewing(false);
                return;
            }
        } catch (err) {
            console.error("Preview request error:", err);
            alert("An error occurred while requesting the preview.");
            setIsPreviewing(false);
            return;
        }

        // Start polling
        pollStart.current = Date.now();
        pollRef.current = setInterval(async () => {
            if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
                clearInterval(pollRef.current!);
                setIsPreviewing(false);
                alert("⏱ Preview timed out. n8n took too long to respond.");
                return;
            }
            try {
                const r = await fetch("/api/preview-html");
                const d = await r.json();
                if (d.html) {
                    clearInterval(pollRef.current!);
                    setPreviewHtml(d.html);
                    setIsPreviewing(false);
                }
            } catch (_) { /* keep polling */ }
        }, POLL_INTERVAL_MS);
    };

    /* ── Copy HTML to clipboard ── */
    const handleCopy = async () => {
        if (!previewHtml) return;
        try {
            await navigator.clipboard.writeText(previewHtml);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for browsers that block clipboard API
            const ta = document.createElement("textarea");
            ta.value = previewHtml;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
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
                        ← Back to Dashboard
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
                        ← Back to Dashboard
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
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", wordBreak: "break-all", marginTop: "4px", marginBottom: "8px" }}>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>
                                        {article.url}
                                    </a>
                                </div>
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

                    {/* ─── Action Bar ─── */}
                    <div className="review-actions">
                        <button
                            className="action-btn danger"
                            onClick={() => {
                                sessionStorage.removeItem("selectedArticles");
                                setSelectedArticles([]);
                            }}
                        >
                            Clear All
                        </button>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            {/* Button 2 – Preview HTML */}
                            <button
                                className={`action-btn preview-btn${isPreviewing ? " loading" : ""}`}
                                onClick={handlePreview}
                                disabled={isPreviewing || isGenerating || selectedArticles.length === 0}
                            >
                                {isPreviewing ? (
                                    <><span className="spinner" /> Generando vista previa…</>
                                ) : (
                                    <>&#128065; Ver HTML</>
                                )}
                            </button>

                            {/* Button 1 – Generate & Send */}
                            <button
                                className="action-btn success generate-btn"
                                onClick={handleGenerate}
                                disabled={isGenerating || isPreviewing || selectedArticles.length === 0}
                            >
                                {isGenerating ? (
                                    <><span className="spinner" /> Enviando…</>
                                ) : (
                                    <>&#9993; Generar Newsletter ({selectedArticles.length})</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── HTML Preview Modal ─── */}
            {previewHtml && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewHtml(null); }}>
                    <div className="modal-box">
                        <div className="modal-header">
                            <h2>Vista Previa del Newsletter</h2>
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <button
                                    className={`action-btn${copied ? " success" : ""}`}
                                    style={{ padding: "0.5rem 1.1rem", fontSize: "0.9rem" }}
                                    onClick={handleCopy}
                                >
                                    {copied ? "✓ Copiado!" : "⎘ Copiar HTML"}
                                </button>
                                <button
                                    className="action-btn secondary"
                                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                                    onClick={() => setPreviewHtml(null)}
                                >
                                    ✕ Cerrar
                                </button>
                            </div>
                        </div>

                        {/* Tabs: rendered preview + raw code */}
                        <div className="modal-tabs">
                            <PreviewTabs html={previewHtml} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Inner component: tabbed rendered/raw view ── */
function PreviewTabs({ html }: { html: string }) {
    const [tab, setTab] = useState<"preview" | "code">("preview");

    return (
        <>
            <div className="tab-bar">
                <button
                    className={`tab-btn${tab === "preview" ? " active" : ""}`}
                    onClick={() => setTab("preview")}
                >
                    Rendered Preview
                </button>
                <button
                    className={`tab-btn${tab === "code" ? " active" : ""}`}
                    onClick={() => setTab("code")}
                >
                    HTML Code
                </button>
            </div>

            {tab === "preview" ? (
                <iframe
                    srcDoc={html}
                    className="modal-iframe"
                    title="Newsletter Preview"
                    sandbox="allow-same-origin"
                />
            ) : (
                <pre className="html-code-block">{html}</pre>
            )}
        </>
    );
}
