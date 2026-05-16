import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, L, useLang, Icon, Btn, Chip } from '../../ui.jsx';
import { getThemes, uploadPhotos } from '../../api.js';

function QueueRow({ item, onRemove, isMobile }) {
  const done = item.progress >= 100;
  const failed = item.failed;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr auto' : '1fr 90px 1fr 70px',
      alignItems: 'center', gap: 12,
      padding: '11px 16px',
      borderBottom: '1px solid var(--faint)',
      ...T.body, fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 26, height: 26, background: failed ? 'rgba(200,50,50,0.08)' : 'var(--faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {failed ? '✕' : done ? Icon.check(12) : (
            <div style={{ width: 8, height: 8, background: 'var(--accent)' }} />
          )}
        </div>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
      </div>

      {!isMobile && (
        <span style={{ ...T.caption, color: 'var(--dim)' }}>
          {(item.size / 1024 / 1024).toFixed(1)} MB
        </span>
      )}

      {!isMobile ? (
        <div style={{ height: 3, background: 'var(--faint)', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${item.progress}%`,
            background: failed ? 'rgba(200,50,50,0.5)' : done ? 'var(--ink)' : 'var(--accent)',
            transition: 'width 0.2s',
          }} />
        </div>
      ) : (
        <span style={{ ...T.caption, color: failed ? 'rgba(200,50,50,0.8)' : done ? 'var(--ink)' : 'var(--accent)' }}>
          {failed ? 'ERR' : `${item.progress}%`}
        </span>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        {!isMobile && (
          <span style={{ ...T.caption, color: failed ? 'rgba(200,50,50,0.8)' : done ? 'var(--ink)' : 'var(--dim)' }}>
            {failed ? 'ERR' : done ? 'OK' : `${item.progress}%`}
          </span>
        )}
        {(done || failed) && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              background: 'transparent', border: 'none', color: 'var(--dim)',
              cursor: 'pointer', padding: 2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {Icon.close(10)}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminUpload() {
  const lang = useLang();
  const fileInputRef = useRef(null);
  const [themes, setThemes] = useState([]);
  const [assignTheme, setAssignTheme] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    getThemes().then(data => {
      setThemes(data);
      if (data.length > 0 && !assignTheme) setAssignTheme(data[0].slug);
    });
  }, []);

  const enqueue = useCallback((files) => {
    const items = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      failed: false,
    }));
    setQueue(prev => [...prev, ...items]);
  }, []);

  const startUpload = useCallback(async () => {
    const pending = queue.filter(q => q.progress === 0 && !q.failed);
    if (!pending.length || uploading) return;
    setUploading(true);

    for (const item of pending) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 1 } : q));
      try {
        await uploadPhotos([item.file], assignTheme, (pct) => {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: Math.max(1, pct) } : q));
        });
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 100 } : q));
      } catch {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, failed: true } : q));
      }
    }
    setUploading(false);
  }, [queue, assignTheme, uploading]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length) enqueue(files);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length) enqueue(e.target.files);
    e.target.value = '';
  };

  const removeFromQueue = (id) => setQueue(prev => prev.filter(q => q.id !== id));
  const clearDone = () => setQueue(prev => prev.filter(q => q.progress < 100 && !q.failed));

  const pendingCount = queue.filter(q => q.progress < 100 && !q.failed).length;
  const doneCount = queue.filter(q => q.progress >= 100).length;

  return (
    <div style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px) 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...T.display, fontSize: 'clamp(26px,4vw,40px)', margin: 0 }}>
          <L ru="Загрузка" en="Upload" />
        </h1>
        <div style={{ ...T.caption, color: 'var(--dim)', marginTop: 6 }}>
          <L ru="JPEG · PNG · TIFF · WEBP, до 50 МБ на файл." en="JPEG · PNG · TIFF · WEBP, up to 50 MB per file." />
        </div>
      </div>

      {/* Theme selector */}
      {themes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...T.label, color: 'var(--dim)', marginBottom: 10 }}>
            <L ru="Добавить в тему" en="Add to theme" />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip active={assignTheme === null} onClick={() => setAssignTheme(null)}>
              <L ru="Без темы" en="No theme" />
            </Chip>
            {themes.map(t => (
              <Chip key={t.slug} active={assignTheme === t.slug} onClick={() => setAssignTheme(t.slug)}>
                {lang === 'ru' ? t.name_ru : t.name_en}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--ink)'}`,
          background: dragOver ? 'var(--faintBg)' : 'transparent',
          padding: isMobile ? '44px 20px' : '64px 40px',
          textAlign: 'center',
          marginBottom: 28,
          cursor: 'pointer',
          transition: 'all 0.15s',
          userSelect: 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', opacity: 0.7 }}>
          {Icon.upload(isMobile ? 24 : 32)}
        </div>
        <div style={{ ...T.h1, fontSize: 'clamp(16px,3vw,22px)', marginBottom: 8 }}>
          <L ru="Бросьте файлы сюда" en="Drop files here" />
        </div>
        <div style={{ ...T.caption, color: 'var(--dim)', marginBottom: 18 }}>
          <L ru="или нажмите чтобы выбрать" en="or click to pick files" />
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ ...T.h1, fontSize: 'clamp(15px,2.5vw,18px)', margin: 0 }}>
              <L ru="Очередь" en="Queue" /> · {queue.length}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {doneCount > 0 && (
                <button type="button" onClick={clearDone} style={{ ...T.caption, color: 'var(--dim)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  <L ru="очистить готовые" en="clear done" />
                </button>
              )}
              {pendingCount > 0 && (
                <Btn variant="primary" icon={Icon.upload(12, 'currentColor')} onClick={startUpload} disabled={uploading}>
                  <L ru="Загрузить" en="Upload" /> {pendingCount > 1 ? `(${pendingCount})` : ''}
                </Btn>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--faint)' }}>
            {queue.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                onRemove={() => removeFromQueue(item.id)}
                isMobile={isMobile}
              />
            ))}
          </div>

          {doneCount > 0 && (
            <div style={{ ...T.caption, color: 'var(--accent)', marginTop: 12, textAlign: 'center' }}>
              {doneCount} <L ru="файлов загружено" en="files uploaded" /> ✓
            </div>
          )}
        </div>
      )}
    </div>
  );
}
