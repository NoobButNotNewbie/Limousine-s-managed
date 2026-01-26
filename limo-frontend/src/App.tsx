import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BookingFlow from './pages/BookingFlow';
import Confirmation from './pages/Confirmation'; // Fix import
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <div className="app-background">
        <nav className="glass-panel" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1rem 2rem',
          borderRadius: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="container flex-between">
            <h1 style={{ margin: 0, background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem', fontWeight: 'bold' }}>
              LIMO • LUXURY
            </h1>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Đặt vé</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tra cứu</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Liên hệ</a>
            </div>
          </div>
        </nav>

        <main style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<BookingFlow />} />
            <Route path="/confirmation/:id" element={<Confirmation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
