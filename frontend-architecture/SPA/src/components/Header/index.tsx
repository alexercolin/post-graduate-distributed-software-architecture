import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header>
      <h1>Header</h1>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/movies">Movies</Link></li>
        </ul>
      </nav>
    </header>
  );
};
