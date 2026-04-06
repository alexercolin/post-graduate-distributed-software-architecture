// FavoriteButton é um componente exposto pelo movies-mf via Module Federation.
// Ele NÃO está instalado como pacote npm — é carregado em runtime do remoteEntry.js.
import FavoriteButton from "movies-mf/FavoriteButton";

const SAMPLE_MOVIES = ["Inception", "Interstellar", "The Dark Knight"];

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
        <li>
          <strong>FavoriteButton</strong>: consumido de `movies-mf` via Module
          Federation (não é um pacote npm)
        </li>
      </ul>

      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
          Componente remoto em ação:
        </p>
        {SAMPLE_MOVIES.map((title) => (
          <FavoriteButton key={title} movieTitle={title} />
        ))}
      </div>
    </section>
  );
}
