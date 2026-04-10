import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { InstallPrompt } from './components/InstallPrompt';
import { Home } from './pages/Home';
import { Notes } from './pages/Notes';
import { DevTools } from './pages/DevTools';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <InstallPrompt />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/devtools" element={<DevTools />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
