import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, L, useLang, Icon, Empty, Btn } from '../ui.jsx';
import Header from '../components/Header.jsx';
import ThemesOverlay from '../components/ThemesOverlay.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { getThemes, getPhotos, photoUrl, trackEvent } from '../api.js';

function PhotoTile({ photo, onClick }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: `${photo.width} / ${photo.height}`,
        background: 'var(--faint)',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = 'scale(1.04)';
      }}
      onMouseLeave={(e) => {
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = 'scale(1)';
      }}
    >
      <img
        src={photoUrl(photo)}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s, transform 0.4s ease',
        }}
      />
    </div>
  );
}

export default function ThemePage({ slug, toggleDark, dark, toggleLang }) {
  const navigate = useNavigate();
  const lang = useLang();
  const [theme, setTheme] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    getThemes().then(themes => setTheme(themes.find(t => t.slug === slug) || null));
    getPhotos({ theme: slug }).then(setPhotos);
    trackEvent('theme_view');
  }, [slug]);

  const cols = isMobile ? 2 : 3;
  const buckets = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => buckets[i % cols].push(p));

  if (!theme) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ ...T.caption, color: 'var(--dim)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <Header onMenu={() => setOverlayOpen(true)} toggleDark={toggleDark} dark={dark} toggleLang={toggleLang} />

      <div style={{ flex: 1 }}>
        {/* Title */}
        <div style={{
          padding: isMobile ? '8px 20px 28px' : '12px 40px 40px',
        }}>
          <div style={{ ...T.label, color: 'var(--dim)', marginBottom: 10 }}>
            <L ru="тема" en="theme" />
          </div>
          <h1 style={{ ...T.display, fontSize: 'clamp(40px, 8vw, 80px)', margin: 0, lineHeight: 0.95 }}>
            {lang === 'ru' ? theme.name_ru : theme.name_en}
          </h1>
          <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 10 }}>
            {lang === 'ru' ? theme.name_en : theme.name_ru}
            {photos.length > 0 && <> · {photos.length} <L ru="кадров" en="frames" /></>}
          </div>
        </div>

        {/* Masonry */}
        {photos.length > 0 ? (
          <div style={{
            padding: isMobile ? '0 16px 40px' : '0 32px 80px',
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isMobile ? 8 : 14,
          }}>
            {buckets.map((bucket, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 14 }}>
                {bucket.map((p) => (
                  <PhotoTile
                    key={p.id}
                    photo={p}
                    onClick={() => setLightbox(photos.findIndex(x => x.id === p.id))}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={Icon.image(48)}
            message={lang === 'ru' ? 'В этой теме пока нет фотографий' : 'No photos in this theme yet'}
            action={
              <Btn variant="secondary" onClick={() => navigate('/admin/upload')}>
                <L ru="Загрузить" en="Upload" />
              </Btn>
            }
          />
        )}

        {/* Footer */}
        {photos.length > 0 && (
          <div style={{
            margin: isMobile ? '0 16px' : '0 32px',
            padding: '24px 0 40px',
            display: 'flex', justifyContent: 'space-between',
            ...T.caption, color: 'var(--dim)',
            borderTop: '1px solid var(--faint)',
          }}>
            <span><L ru="конец темы" en="end of theme" /></span>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              ← <L ru="на главную" en="back home" />
            </span>
          </div>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          theme={theme}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
      <ThemesOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
    </div>
  );
}
