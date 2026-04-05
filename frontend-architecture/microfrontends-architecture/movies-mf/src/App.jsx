export default function App() {
  return (
    <section className="microfrontend microfrontend--movies">
      <p className="microfrontend__label">route-based microfrontend</p>
      <h2>Movies Microfrontend</h2>
      <p>
        This app owns the <strong>/movies</strong> route and is mounted by the
        `root-config` shell.
      </p>

      <ul className="microfrontend__facts">
        <li>App name: `movies-mf`</li>
        <li>Route owner: `/movies`</li>
        <li>Lifecycle controlled by: `single-spa` in the shell</li>
      </ul>
    </section>
  );
}
