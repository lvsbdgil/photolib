import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { T, L, useLang, Icon } from '../../ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import AdminLogin from './AdminLogin.jsx';

const NAV = [
  { to: '/admin',         end: true, ru: 'Обзор',    en: 'Overview' },
  { to: '/admin/photos',             ru: 'Фото',      en: 'Photos'   },
  { to: '/admin/themes',             ru: 'Темы',      en: 'Themes'   },
  { to: '/admin/upload',             ru: 'Загрузка',  en: 'Upload'   },
];

export default function AdminLayout({ toggleLang, toggleDark, dark }) {
  const navigate = useNavigate();
  const lang = useLang();
  const { loading, authenticated, dev, login, logout } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...T.caption, color: 'var(--dim)' }}>…</div>
    </div>
  );

  if (!authenticated) return <AdminLogin onLogin={login} />;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Top bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px)',
        borderBottom: '1px solid var(--faint)',
        flexShrink: 0,
      }}>
        <div />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/')}
            style={{ ...T.display, fontSize: 'clamp(12px, 2vw, 15px)', letterSpacing: '0.15em', cursor: 'pointer' }}
          >
            PHOTOLIB<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <span style={{ ...T.caption, color: 'var(--dim)' }}>/ ADMIN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={toggleDark}
            style={{
              ...T.mono, fontSize: 11, color: 'var(--dim)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              letterSpacing: '0.05em', padding: '4px 8px',
            }}
          >
            {dark ? '☀ Light' : '◑ Dark'}
          </button>
          <button
            type="button"
            onClick={toggleLang}
            style={{
              ...T.mono, fontSize: 10, color: 'var(--dim)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {lang === 'ru' ? 'RU/EN' : 'EN/RU'}
          </button>
          {!dev && (
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              style={{
                ...T.mono, fontSize: 10, color: 'var(--dim)',
                background: 'transparent', border: '1px solid var(--faint)',
                cursor: 'pointer', letterSpacing: '0.1em', padding: '4px 10px',
              }}
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--faint)',
        padding: '0 clamp(4px, 2vw, 16px)',
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            style={({ isActive }) => ({
              ...T.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: 'clamp(10px,2vw,14px) clamp(10px,2vw,16px)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--ink)' : 'var(--dim)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'block',
              transition: 'color 0.15s',
            })}
          >
            {lang === 'ru' ? n.ru : n.en}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
