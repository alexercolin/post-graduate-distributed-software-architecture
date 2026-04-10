import { Link, useLocation } from 'react-router-dom';
import { OnlineIndicator } from './OnlineIndicator';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/notes', label: 'Notas' },
  { to: '/devtools', label: 'DevTools' },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          StudyNotes
        </Link>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'nav-link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <OnlineIndicator />
      </div>
    </header>
  );
}
