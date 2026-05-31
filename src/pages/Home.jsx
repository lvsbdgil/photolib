import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, L, useLang, Icon } from '../ui.jsx';
import Header from '../components/Header.jsx';
import ThemesOverlay from '../components/ThemesOverlay.jsx';
import { getPhotos, photoUrl, trackEvent } from '../api.js';

export default function Home({ toggleLang, toggleDark, dark }) {
  const lang = useLang();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const orientation = isMobile ? 'portrait' : 'landscape';
    getPhotos({ orientation, limit: 100 }).then((data) => {
      setPhotos(data);
      setIdx(data.length > 0 ? Math.floor(Math.random() * data.length) : 0);
    }).catch(() => {});
    trackEvent('home_view');
  }, [isMobile]);

  // Auto-rotate every 9 s
  useEffect(() => {
    if (!photos.length || overlayOpen) return;
    const t = setTimeout(() => setIdx(i => (i + 1) % photos.length), 9000);
    return () => clearTimeout(t);
  }, [idx, overlayOpen, photos.length]);

  const photo = photos[idx];
  const cycle = useCallback(() => {
    setLoaded(false);
    setIdx(i => (i + 1) % photos.length);
  }, [photos.length]);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') cycle();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cycle, photos.length]);

  if (!photos.length) {
    return (
      <div style={{
        width: '100%', height: '100vh',
        background: '#0e0c0a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#f7f5f0', gap: 16,
      }}>
        <div style={{ ...T.display, fontSize: 'clamp(22px, 4vw, 32px)', letterSpacing: '0.1em' }}>
          PHOTOLIB<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div style={{ ...T.caption, color: 'rgba(247,245,240,0.5)', textAlign: 'center' }}>
          <L ru="Фотографий пока нет." en="No photos yet." />{' '}
          <span
            onClick={() => navigate('/admin/upload')}
            style={{ color: 'var(--accent)', cursor: 'pointer', borderBottom: '1px solid currentColor' }}
          >
            <L ru="Загрузить →" en="Upload →" />
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOverlayOpen(true)}
          style={{
            marginTop: 24, ...T.mono, fontSize: 11,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.7)',
            padding: '8px 16px', cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          <L ru="Темы" en="Themes" />
        </button>
        <ThemesOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
      </div>
    );
  }

  return (
    <div
      onClick={cycle}
      style={{ position: 'relative', width: '100%', height: '100vh', background: '#0e0c0a', overflow: 'hidden', cursor: 'pointer' }}
    >
      {/* Photo */}
      <img
        key={photo.id}
        src={photoUrl(photo, isMobile ? 'web' : 'hd')}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          animation: 'photoIn 0.6s ease-out',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s',
        }}
      />

      {/* Gradient scrims */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 20%, transparent 65%, rgba(0,0,0,0.55) 100%)',
      }} />

      <Header variant="overlay" onMenu={() => setOverlayOpen(true)} toggleLang={toggleLang} />

      {/* Bottom strip */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: 'clamp(0px,1px,0px) clamp(16px,4vw,28px) clamp(18px,3vw,24px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        <span style={{ ...T.caption, color: 'rgba(247,245,240,0.7)' }}>
          {String(idx + 1).padStart(3, '0')} / {String(photos.length).padStart(3, '0')}
        </span>
      </div>

      {/* Dark/light toggle — bottom right corner */}
      <button
        type="button"
        onClick={toggleDark}
        title={dark ? 'Light mode' : 'Dark mode'}
        style={{
          position: 'absolute', bottom: 20, right: 20,
          width: 32, height: 32,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#f7f5f0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}
      >
        {dark ? '☀' : '◑'}
      </button>

      <ThemesOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
    </div>
  );
}
