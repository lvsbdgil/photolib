import { useState, useEffect } from 'react';

export function useAuth() {
  const [state, setState] = useState({ loading: true, authenticated: false, dev: false });

  const check = () =>
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setState({ loading: false, authenticated: d.authenticated, dev: d.dev }))
      .catch(() => setState({ loading: false, authenticated: false, dev: false }));

  useEffect(() => { check(); }, []);

  const login = async (password) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) throw new Error('Wrong password');
    setState({ loading: false, authenticated: true, dev: false });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({ loading: false, authenticated: false, dev: false });
  };

  return { ...state, login, logout };
}
