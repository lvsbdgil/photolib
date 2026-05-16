import React, { useState } from 'react';
import { T, Icon } from '../../ui.jsx';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(password);
    } catch {
      setError('Неверный пароль / Wrong password');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 340 }}>
        {/* Logo */}
        <div style={{
          ...T.display,
          fontSize: 18,
          letterSpacing: '0.15em',
          marginBottom: 40,
          textAlign: 'center',
        }}>
          PHOTOLIB<span style={{ color: 'var(--accent)' }}>.</span>
          <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 6, letterSpacing: '0.1em' }}>
            ADMIN
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ ...T.label, color: 'var(--dim)' }}>Пароль / Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                ...T.body,
                padding: '12px 14px',
                border: `1px solid ${error ? 'var(--accent)' : 'var(--faint)'}`,
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = 'var(--ink)'; }}
              onBlur={e => { if (!error) e.target.style.borderColor = 'var(--faint)'; }}
            />
          </label>

          {error && (
            <div style={{ ...T.caption, color: 'var(--accent)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              ...T.mono,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              padding: '13px 20px',
              background: loading || !password ? 'var(--faint)' : 'var(--ink)',
              color: loading || !password ? 'var(--dim)' : 'var(--paper)',
              border: 'none',
              cursor: loading || !password ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '…' : 'Войти / Sign in'}
          </button>
        </form>

        <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 32, textAlign: 'center' }}>
          Установите переменную <code style={{ ...T.mono, fontSize: 10 }}>ADMIN_PASSWORD</code> на сервере.
        </div>
      </div>
    </div>
  );
}
