import React, { useState, useEffect } from 'react';
import { T, L, useLang, Icon, Btn, Field, InlineEdit, ConfirmDialog } from '../../ui.jsx';
import { getThemes, createTheme, updateTheme, deleteTheme } from '../../api.js';

function ThemeRow({ theme, idx, onRename, onDelete, isMobile }) {
  const lang = useLang();
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 48px 64px' : '36px 1fr 1fr 120px 100px 80px',
        padding: 'clamp(10px,2vw,14px) 16px',
        borderBottom: '1px solid var(--faint)',
        alignItems: 'center',
        background: hover ? 'var(--faintBg)' : 'transparent',
        transition: 'background 0.15s',
        gap: 8,
      }}
    >
      {!isMobile && <span style={{ ...T.caption, color: 'var(--dim)' }}>{String(idx + 1).padStart(2, '0')}</span>}
      <InlineEdit value={theme.name_ru} onCommit={(v) => onRename('name_ru', v)} />
      {!isMobile && <InlineEdit value={theme.name_en} onCommit={(v) => onRename('name_en', v)} />}
      {!isMobile && <span style={{ ...T.caption, color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{theme.slug}</span>}
      {!isMobile && <span style={{ ...T.caption, color: 'var(--dim)' }}>{theme.created_at}</span>}
      <span style={{ ...T.mono, fontSize: 12 }}>{theme.photo_count ?? 0}</span>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          style={{
            width: 28, height: 28,
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--dim)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dim)')}
        >
          {Icon.trash(13)}
        </button>
      </div>
    </div>
  );
}

export default function AdminThemes() {
  const lang = useLang();
  const [themes, setThemes] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newRu, setNewRu] = useState('');
  const [newEn, setNewEn] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const load = () => getThemes().then(setThemes);
  useEffect(() => { load(); }, []);

  const commitNew = async () => {
    if (!newRu.trim() || !newEn.trim()) return;
    const slug = newEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSaving(true);
    try {
      await createTheme({ slug, name_ru: newRu.trim(), name_en: newEn.trim() });
      setNewRu(''); setNewEn(''); setCreating(false);
      load();
    } catch { }
    setSaving(false);
  };

  const handleRename = async (slug, field, val) => {
    await updateTheme(slug, { [field]: val });
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteTheme(confirmDelete.slug);
    setConfirmDelete(null);
    load();
  };

  return (
    <div style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px) 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ ...T.display, fontSize: 'clamp(26px,4vw,40px)', margin: 0 }}>
            <L ru="Темы" en="Themes" />
          </h1>
          <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 6 }}>
            {themes.length} <L ru="разделов" en="sections" />
          </div>
        </div>
        <Btn variant="primary" icon={Icon.plus(14, 'currentColor')} onClick={() => setCreating(true)}>
          <L ru="Новая тема" en="New theme" />
        </Btn>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{
          border: '1px solid var(--ink)',
          padding: 'clamp(14px,3vw,20px)',
          marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ ...T.label }}><L ru="Новая тема" en="New theme" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field
              label={<L ru="Название (RU)" en="Title (RU)" />}
              value={newRu}
              onChange={setNewRu}
              placeholder="Натюрморт"
              onKeyDown={(e) => e.key === 'Enter' && commitNew()}
            />
            <Field
              label={<L ru="Название (EN)" en="Title (EN)" />}
              value={newEn}
              onChange={setNewEn}
              placeholder="Still life"
              onKeyDown={(e) => e.key === 'Enter' && commitNew()}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { setCreating(false); setNewRu(''); setNewEn(''); }}>
              <L ru="Отмена" en="Cancel" />
            </Btn>
            <Btn variant="primary" icon={Icon.check(14)} onClick={commitNew} disabled={saving || !newRu || !newEn}>
              <L ru="Создать" en="Create" />
            </Btn>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ border: '1px solid var(--faint)' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 48px 64px' : '36px 1fr 1fr 120px 100px 80px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--faint)',
          ...T.label, color: 'var(--dim)',
          background: 'var(--faintBg)',
          gap: 8,
        }}>
          {!isMobile && <span>#</span>}
          <span>RU</span>
          {!isMobile && <span>EN</span>}
          {!isMobile && <span>Slug</span>}
          {!isMobile && <span><L ru="Создана" en="Created" /></span>}
          <span><L ru="Фото" en="Photos" /></span>
          <span style={{ textAlign: 'right' }}><L ru="—" en="—" /></span>
        </div>

        {themes.length === 0 && (
          <div style={{ ...T.caption, color: 'var(--dim)', padding: '40px 20px', textAlign: 'center' }}>
            <L ru="Нет тем" en="No themes yet" />
          </div>
        )}

        {themes.map((t, i) => (
          <ThemeRow
            key={t.slug}
            theme={t}
            idx={i}
            isMobile={isMobile}
            onRename={(field, val) => handleRename(t.slug, field, val)}
            onDelete={() => setConfirmDelete(t)}
          />
        ))}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={<L ru="Удалить тему?" en="Delete theme?" />}
          body={lang === 'ru'
            ? `Тема «${confirmDelete.name_ru}» будет удалена. Фото останутся без раздела.`
            : `Theme "${confirmDelete.name_en}" will be deleted. Photos will be unassigned.`}
          confirmLabel={<L ru="Удалить" en="Delete" />}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
