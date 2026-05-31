import React, { useEffect } from 'react';
import { T, Icon, useLang } from '../ui.jsx';
import { photoUrl } from '../api.js';

const NAV_BTN = (side) => ({
  position: 'absolute', top: '50%',
  [side]: 'clamp(12px, 3vw, 24px)',
  transform: 'translateY(-50%)',
  width: 44, height: 44,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#f7f5f0', cursor: 'pointer', padding: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

export default function Lightbox({ photos, index, theme, onClose, onIndex }) {
  const lang = useLang();
  const photo = photos[index];
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onIndex((index - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [index, photos.length, onClose, onIndex]);

  if (!photo) return null;

  const themeName = theme ? (lang === 'ru' ? theme.name_ru : theme.name_en) : '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(8, 7, 5, 0.97)',
      backdropFilter: 'blur(12px)',
      color: '#f7f5f0',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.18s ease-out',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(12px, 2vw, 20px) clamp(16px, 4vw, 28px)',
        flexShrink: 0,
      }}>
        <div style={{ ...T.label, color: 'rgba(247,245,240,0.7)', fontSize: 10 }}>
          {themeName}
          <span style={{ opacity: 0.5, marginLeft: 8 }}>
            / {String(index + 1).padStart(3, '0')} · {String(photos.length).padStart(3, '0')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 34, height: 34, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)', color: '#f7f5f0',
            cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {Icon.close(14)}
        </button>
      </div>

      {/* Image */}
      <div style={{
        flex: 1, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '8px 16px' : '16px 80px',
        minHeight: 0,
      }}>
        <img
          key={photo.id}
          src={photoUrl(photo, isMobile ? 'web' : 'hd')}
          alt=""
          style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain',
            animation: 'fadeIn 0.22s ease-out',
          }}
        />
        {!isMobile && (
          <>
            <button type="button" onClick={() => onIndex((index - 1 + photos.length) % photos.length)} style={NAV_BTN('left')}>
              {Icon.arrow('left', 18, '#f7f5f0')}
            </button>
            <button type="button" onClick={() => onIndex((index + 1) % photos.length)} style={NAV_BTN('right')}>
              {Icon.arrow('right', 18, '#f7f5f0')}
            </button>
          </>
        )}
      </div>

      {/* Bottom strip */}
      <div style={{
        padding: isMobile ? '12px 16px 20px' : '14px 28px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        flexShrink: 0,
      }}>
        {isMobile ? (
          <>
            <button type="button" onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
              style={{ width: 36, height: 36, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#f7f5f0', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {Icon.arrow('left', 14, '#f7f5f0')}
            </button>
            <span style={{ ...T.caption, color: 'rgba(247,245,240,0.6)', flex: 1, textAlign: 'center' }}>
              {photo.original_name || photo.id}
            </span>
            <button type="button" onClick={() => onIndex((index + 1) % photos.length)}
              style={{ width: 36, height: 36, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#f7f5f0', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {Icon.arrow('right', 14, '#f7f5f0')}
            </button>
          </>
        ) : (
          <>
            <span style={{ ...T.caption, color: 'rgba(247,245,240,0.45)', minWidth: 120 }}>
              {photo.original_name || photo.id}
            </span>
            {/* Index dots */}
            <div style={{ display: 'flex', gap: 3, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {photos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => onIndex(i)}
                  style={{
                    width: 6, height: 14, background: '#f7f5f0',
                    opacity: i === index ? 0.9 : 0.18,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                />
              ))}
            </div>
            <span style={{ ...T.caption, color: 'rgba(247,245,240,0.35)', minWidth: 80, textAlign: 'right' }}>
              ← → ESC
            </span>
          </>
        )}
      </div>
    </div>
  );
}
