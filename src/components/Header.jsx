import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Icon, useLang } from '../ui.jsx';

export default function Header({ variant = 'solid', onMenu, showLangToggle = true, toggleLang }) {
  const navigate = useNavigate();
  const lang = useLang();
  const isOverlay = variant === 'overlay';
  const fg = isOverlay ? '#f7f5f0' : 'var(--ink)';
  const borderColor = isOverlay ? 'rgba(255,255,255,0.4)' : 'var(--ink)';

  return (
    <header style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: 'clamp(14px, 3vw, 20px) clamp(16px, 4vw, 28px)',
      position: isOverlay ? 'absolute' : 'relative',
      top: 0, left: 0, right: 0,
      zIndex: 10,
      color: fg,
    }}>
      <button
        type="button"
        onClick={onMenu}
        style={{
          width: 36, height: 36,
          background: 'transparent',
          border: `1px solid ${borderColor}`,
          color: fg,
          cursor: 'pointer', padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon.burger(16, fg)}
      </button>

      <div
        onClick={() => navigate('/')}
        style={{
          ...T.display,
          fontSize: 'clamp(13px, 2vw, 16px)',
          letterSpacing: '0.15em',
          cursor: 'pointer',
          color: fg,
        }}
      >
        PHOTOLIB<span style={{ color: 'var(--accent)' }}>.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        {showLangToggle && toggleLang && (
          <button
            type="button"
            onClick={toggleLang}
            style={{
              ...T.mono, fontSize: 11, color: fg, opacity: 0.8,
              background: 'transparent', border: 'none',
              padding: '6px 8px', cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {lang === 'ru' ? 'RU/EN' : 'EN/RU'}
          </button>
        )}
      </div>
    </header>
  );
}
