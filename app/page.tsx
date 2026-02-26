export default function HomePage() {
    return (
        <main className="container">
            <header>
                <div className="badge">System Initialized</div>
                <h1 className="hero-title">X-micro Newsletter</h1>
                <p className="hero-subtitle">
                    Aggregating critical hardware market intel, geopolitical shifts, and technical updates for the industry elite.
                </p>
                <a href="#" className="cta-button">Subscribe to Updates</a>
            </header>

            <section className="status-grid">
                <div className="card">
                    <h3>Market Intel</h3>
                    <p>Real-time tracking of GPU availability, CPU pricing cycles, and memory market fluctuations.</p>
                </div>
                <div className="card">
                    <h3>Geopolitical Shifts</h3>
                    <p>Analysis of sanctions, tariffs, and trade policies affecting global hardware supply chains.</p>
                </div>
                <div className="card">
                    <h3>Technical Updates</h3>
                    <p>Deep dives into architecture changes, manufacturing nodes, and next-gen platform shifts.</p>
                </div>
            </section>

            <footer style={{ marginTop: '8rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} X-micro Newsletter. All rights reserved.
            </footer>
        </main>
    );
}
