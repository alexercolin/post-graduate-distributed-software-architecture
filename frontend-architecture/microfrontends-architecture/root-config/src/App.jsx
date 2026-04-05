export default function App() {
  return (
    <main className="shell">
      <header className="shell__header">
        <div>
          <p className="shell__eyebrow">single-spa orchestrator</p>
          <h1>Microfrontends Architecture</h1>
          <p className="shell__description">
            The shell owns navigation and mounts one route-based microfrontend
            at a time.
          </p>
        </div>

        <nav className="shell__nav" aria-label="Microfrontend navigation">
          <a href="/movies">Movies</a>
          <a href="/my-list">My List</a>
        </nav>
      </header>

      <section className="shell__content">
        <div className="shell__panel">
          <p className="shell__panel-label">Mounted application</p>
          <div id="microfrontend-root" />
        </div>
      </section>
    </main>
  );
}
