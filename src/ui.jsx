import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Typography tokens ─────────────────────────────────────────────────────────
export const T = {
  display: { fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: '-0.02em' },
  h1:      { fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: '-0.01em' },
  label:   { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' },
  body:    { fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: 13, lineHeight: 1.5 },
  caption: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: 11 },
  mono:    { fontFamily: "'JetBrains Mono', monospace" },
};

// ── Context ───────────────────────────────────────────────────────────────────
export const LangCtx = createContext('ru');
export const useLang = () => useContext(LangCtx);

export function L({ ru, en }) {
  const lang = useLang();
  return lang === 'en' ? en : ru;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [breakpoint]);
  return mobile;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
export const Icon = {
  burger: (sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h8" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  ),
  close: (sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  ),
  arrow: (dir = 'right', sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none"
         style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  ),
  plus: (sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  ),
  trash: (sz = 14, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M6 4V2.5h4V4M5 4l.7 9.5h4.6L11 4M7 7v4M9 7v4"
            stroke={color} strokeWidth="1.3" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  ),
  check: (sz = 14, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3 3 7-7" stroke={color} strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  ),
  upload: (sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <path d="M8 11V2M5 5l3-3 3 3M2 12v2h12v-2"
            stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  ),
  grid: (sz = 14, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" stroke={color} strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" stroke={color} strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" stroke={color} strokeWidth="1.3" />
      <rect x="9" y="9" width="5" height="5" stroke={color} strokeWidth="1.3" />
    </svg>
  ),
  image: (sz = 16, color = 'currentColor') => (
    <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" stroke={color} strokeWidth="1.3" />
      <circle cx="5.5" cy="5.5" r="1" fill={color} />
      <path d="M2 11l3-3 2.5 2.5L10 8l4 4" stroke={color} strokeWidth="1.3" strokeLinecap="square" />
    </svg>
  ),
};

// ── Button ────────────────────────────────────────────────────────────────────
const btnVariants = {
  primary:   { background: 'var(--ink)',    color: 'var(--paper)', border: '1px solid var(--ink)' },
  secondary: { background: 'transparent',  color: 'var(--ink)',   border: '1px solid var(--ink)' },
  ghost:     { background: 'transparent',  color: 'var(--ink)',   border: '1px solid transparent' },
  danger:    { background: 'transparent',  color: 'var(--accent)', border: '1px solid var(--accent)' },
};
const btnSizes = {
  sm: { padding: '5px 10px',  fontSize: 10, height: 26 },
  md: { padding: '8px 14px',  fontSize: 11, height: 34 },
  lg: { padding: '12px 20px', fontSize: 13, height: 44 },
};

export function Btn({ children, onClick, variant = 'ghost', size = 'md', icon, style = {}, disabled, type = 'button' }) {
  const v = btnVariants[variant];
  const s = btnSizes[size];
  const [hover, setHover] = useState(false);
  const hoverBg = variant === 'secondary' ? 'var(--ink)' : variant === 'ghost' ? 'var(--faint)' : null;
  const hoverColor = variant === 'secondary' ? 'var(--paper)' : null;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...T.mono, ...s, ...v,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s',
        background: hover && hoverBg ? hoverBg : v.background,
        color: hover && hoverColor ? hoverColor : v.color,
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
}

export function IconBtn({ icon, onClick, label, style = {}, size = 34 }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: `1px solid ${hover ? 'var(--ink)' : 'var(--faint)'}`,
        color: 'var(--ink)',
        cursor: 'pointer', padding: 0,
        transition: 'border-color 0.15s',
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────
export function Field({ label, value, onChange, placeholder, onKeyDown }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ ...T.label, color: 'var(--dim)' }}>{label}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        style={{
          ...T.body,
          padding: '10px 12px',
          border: '1px solid var(--faint)',
          background: 'var(--paper)',
          color: 'var(--ink)',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--faint)')}
      />
    </label>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
export function Chip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...T.mono, fontSize: 11, letterSpacing: '0.05em',
        padding: '6px 12px',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
        border: '1px solid',
        borderColor: active ? 'var(--ink)' : 'var(--faint)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(14,12,10,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink)',
        padding: '24px 24px 20px',
        maxWidth: 380, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <h3 style={{ ...T.h1, fontSize: 18, margin: 0 }}>{title}</h3>
        <p style={{ ...T.body, margin: 0, color: 'var(--dim)' }}>{body}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn variant="ghost" onClick={onCancel}><L ru="Отмена" en="Cancel" /></Btn>
          <Btn variant="danger" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Inline edit ───────────────────────────────────────────────────────────────
export function InlineEdit({ value, onCommit, style: extraStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onCommit(draft.trim());
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        style={{
          ...T.h1, fontSize: 16, ...extraStyle,
          border: 'none', borderBottom: '1px solid var(--ink)',
          background: 'transparent', color: 'var(--ink)',
          outline: 'none', padding: '2px 0', width: '100%',
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        ...T.h1, fontSize: 16, ...extraStyle,
        cursor: 'text', padding: '2px 0',
        borderBottom: '1px solid transparent',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        display: 'inline-block', maxWidth: '100%',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--faint)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
    >
      {value}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--dim)' }}>
      <div style={{ marginBottom: 16, opacity: 0.4 }}>{icon || Icon.image(48)}</div>
      <div style={{ ...T.body, color: 'var(--dim)', marginBottom: action ? 20 : 0 }}>{message}</div>
      {action}
    </div>
  );
}
