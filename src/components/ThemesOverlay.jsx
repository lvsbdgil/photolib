import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Icon, L, useLang } from '../ui.jsx';
import { getThemes } from '../api.js';

function ThemeLink({ theme, idx, onClick }) {
  const lang = useLang();
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'baseline',
        gap: 'clamp(14px, 3vw, 22px)',
        cursor: 'pointer',
        color: hover ? 'var(--accent)' : '#f7f5f0',
        transition: 'color 0.15s, transform 0.15s',
        transform: hover ? 'translateX(8px)' : 'translateX(0)',
      }}
    >
      <span style={{ ...T.caption, color: 'inherit', opacity: 0.5, width: 24, flexShrink: 0 }}>
        {String(idx + 1).padStart(2, '0')}
      </span>
      <span style={{ ...T.display, fontSize: 'clamp(26px, 5vw, 44px)', lineHeight: 1, color: 'inherit' }}>
        {lang === 'ru' ? theme.name_ru : theme.name_en}
      </span>
      <span style={{ ...T.caption, color: 'inherit', opacity: 0.4, marginLeft: 4 }}>
        {lang === 'ru' ? theme.name_en : theme.name_ru}
        {theme.photo_count != null ? ` · ${theme.photo_count}` : ''}
      </span>
    </div>
  );
}

export default function ThemesOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const lang = useLang();
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    if (open) getThemes().then(setThemes).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(14, 12, 10, 0.96)',
      backdropFilter: 'blur(16px)',
      color: '#f7f5f0',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.2s ease-out',
      overflowY: 'auto',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(14px, 3vw, 20px) clamp(16px, 4vw, 28px)',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 36, height: 36, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)', color: '#f7f5f0',
            cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {Icon.close(16)}
        </button>
        <div style={{ ...T.display, fontSize: 'clamp(13px, 2vw, 16px)', letterSpacing: '0.15em' }}>
          PHOTOLIB<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Theme list */}
      <div style={{
        flex: 1,
        padding: 'clamp(32px, 6vw, 60px) clamp(24px, 8vw, 80px) clamp(24px, 4vw, 40px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: 0,
      }}>
        <div>
          <div style={{ ...T.label, color: 'rgba(247,245,240,0.5)', marginBottom: 'clamp(16px, 3vw, 30px)' }}>
            <L ru="темы" en="themes" /> / {String(themes.length).padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 18px)' }}>
            {themes.map((t, i) => (
              <ThemeLink
                key={t.slug}
                theme={t}
                idx={i}
                onClick={() => { onClose(); navigate(`/themes/${t.slug}`); }}
              />
            ))}
          </div>
        </div>

        <div style={{
          ...T.caption, color: 'rgba(247,245,240,0.35)',
          marginTop: 32,
        }}>
          <span>А. Лычман</span>
        </div>
      </div>
    </div>
  );
}
