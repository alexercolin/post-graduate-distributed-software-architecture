export default function App() {
  return (
    <section className="microfrontend microfrontend--my-list">
      <p className="microfrontend__label">route-based microfrontend</p>
      <h2>My List Microfrontend</h2>
      <p>
        This app owns the <strong>/my-list</strong> route and is mounted by the
        `root-config` shell.
      </p>

      <ul className="microfrontend__facts">
        <li>App name: `my-list-mf`</li>
        <li>Route owner: `/my-list`</li>
        <li>Lifecycle controlled by: `single-spa` in the shell</li>
      </ul>
    </section>
  );
}
