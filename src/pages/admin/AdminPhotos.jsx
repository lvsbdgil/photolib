import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, L, useLang, Icon, Btn, Chip, ConfirmDialog, Empty } from '../../ui.jsx';
import { getThemes, getPhotos, updatePhoto, deletePhoto, bulkDeletePhotos, photoUrl } from '../../api.js';

// ── Photo detail slide-out panel ──────────────────────────────────────────────
function PhotoDetailPanel({ photo, themes, onClose, onDelete, onAssign }) {
  const lang = useLang();
  const [confirming, setConfirming] = useState(false);
  const theme = themes.find(t => t.slug === photo.theme_slug);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(14,12,10,0.5)' }} />

      {/* Panel */}
      <div style={{
        width: 'clamp(280px, 35vw, 400px)',
        maxWidth: '100%',
        background: 'var(--paper)',
        borderLeft: '1px solid var(--ink)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideRight 0.22s ease-out',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ ...T.label }}><L ru="Фото" en="Photo" /> · {photo.id}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28, height: 28, background: 'transparent',
              border: 'none', color: 'var(--ink)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {Icon.close(12)}
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 24px' }}>
          {/* Preview */}
          <div style={{
            aspectRatio: `${photo.width} / ${photo.height}`,
            background: 'var(--faint)',
            marginBottom: 20,
            overflow: 'hidden',
            maxHeight: 320,
          }}>
            <img src={photoUrl(photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <MetaRow label={<L ru="Файл" en="File" />} value={photo.original_name || photo.id} />
            <MetaRow label={<L ru="Размер" en="Dimensions" />} value={`${photo.width} × ${photo.height}`} />
            <MetaRow label={<L ru="Объём" en="File size" />} value={`${(photo.file_size / 1024 / 1024).toFixed(1)} MB`} />
            <MetaRow label={<L ru="Загружено" en="Uploaded" />} value={new Date(photo.uploaded_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')} />
          </div>

          {/* Theme assignment */}
          <div style={{ ...T.label, color: 'var(--dim)', marginBottom: 10 }}>
            <L ru="Тема" en="Theme" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={() => onAssign(null)}
              style={{
                ...T.body, fontSize: 13, padding: '9px 12px', textAlign: 'left',
                background: !photo.theme_slug ? 'var(--faintBg)' : 'transparent',
                border: `1px solid ${!photo.theme_slug ? 'var(--ink)' : 'var(--faint)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'var(--dim)',
              }}
            >
              <span><L ru="Без темы" en="Unassigned" /></span>
              {!photo.theme_slug && Icon.check(12)}
            </button>
            {themes.map(t => (
              <button
                key={t.slug}
                type="button"
                onClick={() => onAssign(t.slug)}
                style={{
                  ...T.body, fontSize: 13, padding: '9px 12px', textAlign: 'left',
                  background: photo.theme_slug === t.slug ? 'var(--faintBg)' : 'transparent',
                  border: `1px solid ${photo.theme_slug === t.slug ? 'var(--ink)' : 'var(--faint)'}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: 'var(--ink)',
                }}
              >
                <span>{lang === 'ru' ? t.name_ru : t.name_en}</span>
                {photo.theme_slug === t.slug && Icon.check(12)}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--faint)',
          display: 'flex', gap: 8, justifyContent: 'space-between',
        }}>
          <Btn variant="danger" icon={Icon.trash(12)} onClick={() => setConfirming(true)}>
            <L ru="Удалить" en="Delete" />
          </Btn>
          <Btn variant="primary" onClick={onClose}>
            <L ru="Готово" en="Done" />
          </Btn>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title={<L ru="Удалить фото?" en="Delete photo?" />}
          body={<L ru="Действие нельзя отменить." en="This cannot be undone." />}
          confirmLabel={<L ru="Удалить" en="Delete" />}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ ...T.label, color: 'var(--dim)', flexShrink: 0 }}>{label}</span>
      <span style={{ ...T.mono, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}

// ── Library tile ──────────────────────────────────────────────────────────────
function LibTile({ photo, theme, selected, anySelected, onSelect, onOpen }) {
  const lang = useLang();
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => anySelected ? onSelect() : onOpen()}
      style={{
        position: 'relative',
        aspectRatio: '1/1',
        background: 'var(--faint)',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: selected ? '2px solid var(--accent)' : 'none',
        outlineOffset: -2,
      }}
    >
      <img
        src={photoUrl(photo, 'thumb')}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Hover / selection overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: hover ? 'rgba(14,12,10,0.38)' : 'transparent',
        transition: 'background 0.15s',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: 6,
        opacity: hover || selected ? 1 : 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{
              width: 18, height: 18,
              border: `1.5px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.85)'}`,
              background: selected ? 'var(--accent)' : 'transparent',
              cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {selected && Icon.check(11, '#fff')}
          </button>
          {theme && (
            <span style={{ ...T.caption, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 4px' }}>
              {(lang === 'ru' ? theme.name_ru : theme.name_en).slice(0, 4).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ ...T.caption, fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>
          {photo.original_name?.split('.')[0] || photo.id}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminPhotos() {
  const lang = useLang();
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const loadAll = useCallback(() => {
    getThemes().then(setThemes);
    getPhotos({ theme: filter === 'all' ? undefined : filter }).then(setPhotos);
  }, [filter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleSel = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleAssign = async (themeSlug) => {
    if (!detail) return;
    await updatePhoto(detail, { theme_slug: themeSlug });
    loadAll();
    setDetail(null);
  };

  const handleDeleteOne = async () => {
    if (!detail) return;
    await deletePhoto(detail);
    setDetail(null);
    loadAll();
  };

  const handleBulkDelete = async () => {
    await bulkDeletePhotos([...selected]);
    setSelected(new Set());
    setBulkConfirm(false);
    loadAll();
  };

  const filtered = photos; // already filtered by server

  return (
    <div style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px) 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ ...T.display, fontSize: 'clamp(26px,4vw,40px)', margin: 0 }}>
            <L ru="Библиотека" en="Library" />
          </h1>
          <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 6 }}>
            {filtered.length} <L ru="кадров" en="frames" />
          </div>
        </div>

        {selected.size > 0 ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...T.caption, color: 'var(--ink)' }}>
              {selected.size} <L ru="выбрано" en="selected" />
            </span>
            <Btn variant="ghost" onClick={() => setSelected(new Set())}>
              <L ru="Снять" en="Clear" />
            </Btn>
            <Btn variant="danger" icon={Icon.trash(12)} onClick={() => setBulkConfirm(true)}>
              <L ru="Удалить" en="Delete" />
            </Btn>
          </div>
        ) : (
          <div style={{ ...T.caption, color: 'var(--dim)' }}>
            <L ru="клик — детали · чекбокс — выбор" en="click — details · checkbox — select" />
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          <L ru="Все" en="All" />
          <span style={{ opacity: 0.5, marginLeft: 6 }}>{themes.reduce((s, t) => s + (t.photo_count || 0), 0)}</span>
        </Chip>
        {themes.map(t => (
          <Chip key={t.slug} active={filter === t.slug} onClick={() => setFilter(t.slug)}>
            {lang === 'ru' ? t.name_ru : t.name_en}
            <span style={{ opacity: 0.5, marginLeft: 6 }}>{t.photo_count || 0}</span>
          </Chip>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
          gap: isMobile ? 4 : 6,
        }}>
          {filtered.map(p => (
            <LibTile
              key={p.id}
              photo={p}
              theme={themes.find(t => t.slug === p.theme_slug)}
              selected={selected.has(p.id)}
              anySelected={selected.size > 0}
              onSelect={() => toggleSel(p.id)}
              onOpen={() => setDetail(p.id)}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={Icon.image(48)}
          message={lang === 'ru' ? 'Нет фотографий' : 'No photos'}
          action={
            <Btn variant="secondary" onClick={() => navigate('/admin/upload')}>
              <L ru="Загрузить" en="Upload" />
            </Btn>
          }
        />
      )}

      {/* Detail panel */}
      {detail && (() => {
        const p = photos.find(x => x.id === detail);
        if (!p) return null;
        return (
          <PhotoDetailPanel
            photo={p}
            themes={themes}
            onClose={() => setDetail(null)}
            onDelete={handleDeleteOne}
            onAssign={handleAssign}
          />
        );
      })()}

      {bulkConfirm && (
        <ConfirmDialog
          title={<L ru="Удалить выбранное?" en="Delete selected?" />}
          body={lang === 'ru' ? `Будут удалены ${selected.size} фото.` : `${selected.size} photos will be deleted.`}
          confirmLabel={<L ru="Удалить" en="Delete" />}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}
    </div>
  );
}
