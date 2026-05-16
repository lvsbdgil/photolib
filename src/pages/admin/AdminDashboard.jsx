import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, L, useLang, Icon, Btn } from '../../ui.jsx';
import { getStats, getPhotos, photoUrl } from '../../api.js';

function StatCard({ label, value, delta }) {
  return (
    <div style={{ padding: 'clamp(14px,3vw,22px)', background: 'var(--paper)' }}>
      <div style={{ ...T.label, color: 'var(--dim)', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ ...T.display, fontSize: 'clamp(26px,4vw,38px)', lineHeight: 1 }}>{value}</span>
        {delta && <span style={{ ...T.caption, color: 'var(--accent)' }}>{delta}</span>}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', padding: 'clamp(14px,3vw,20px) clamp(12px,2vw,18px)',
        background: 'transparent',
        border: `1px solid ${hover ? 'var(--ink)' : 'var(--faint)'}`,
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 0.15s', color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon}
        <span style={{ ...T.caption, color: 'var(--dim)' }}>→</span>
      </div>
      <div>
        <div style={{ ...T.h1, fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div style={{ ...T.caption, color: 'var(--dim)' }}>{desc}</div>
      </div>
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const lang = useLang();
  const [stats, setStats] = useState({ totalPhotos: 0, totalThemes: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    getStats().then(setStats);
    getPhotos({ limit: 8 }).then(setRecent);
  }, []);

  const statCards = [
    { ru: 'Фото',         en: 'Photos',        value: String(stats.totalPhotos).padStart(3, '0') },
    { ru: 'Тем',          en: 'Themes',         value: String(stats.totalThemes).padStart(2, '0') },
    { ru: 'Загружено',    en: 'Uploads',        value: String(stats.totalUploads || 0).padStart(3, '0') },
    { ru: 'Просмотры',    en: 'Views',          value: String(stats.homeViews || 0).padStart(3, '0') },
  ];

  return (
    <div style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px) 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ ...T.display, fontSize: 'clamp(26px,4vw,40px)', margin: 0 }}>
          <L ru="Обзор" en="Overview" />
        </h1>
        <span style={{ ...T.caption, color: 'var(--dim)' }}>
          {new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div style={{ ...T.caption, color: 'var(--dim)', marginBottom: 32 }}>
        <L ru="Добро пожаловать в панель управления." en="Welcome to the dashboard." />
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, background: 'var(--faint)',
        border: '1px solid var(--faint)',
        marginBottom: 40,
      }}>
        {statCards.map((s, i) => (
          <StatCard key={i} label={<L ru={s.ru} en={s.en} />} value={s.value} delta={s.delta} />
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ ...T.h1, fontSize: 'clamp(16px,2.5vw,22px)', margin: '0 0 14px' }}>
        <L ru="Быстрые действия" en="Quick actions" />
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 40 }}>
        <ActionCard
          icon={Icon.upload(20)}
          title={<L ru="Загрузить фото" en="Upload photos" />}
          desc={<L ru="JPG · PNG · TIFF · WEBP, до 50 МБ" en="JPG · PNG · TIFF · WEBP, up to 50 MB" />}
          onClick={() => navigate('/admin/upload')}
        />
        <ActionCard
          icon={Icon.plus(20)}
          title={<L ru="Новая тема" en="New theme" />}
          desc={<L ru="Создать раздел портфолио" en="Create a portfolio section" />}
          onClick={() => navigate('/admin/themes')}
        />
        <ActionCard
          icon={Icon.grid(18)}
          title={<L ru="Библиотека" en="Library" />}
          desc={<L ru={`${stats.totalPhotos} файлов`} en={`${stats.totalPhotos} files`} />}
          onClick={() => navigate('/admin/photos')}
        />
      </div>

      {/* Recent uploads */}
      {recent.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ ...T.h1, fontSize: 'clamp(16px,2.5vw,20px)', margin: 0 }}>
              <L ru="Недавние загрузки" en="Recent uploads" />
            </h2>
            <button
              type="button"
              onClick={() => navigate('/admin/photos')}
              style={{ ...T.caption, color: 'var(--ink)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              <L ru="все →" en="all →" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            {recent.map(p => (
              <div
                key={p.id}
                onClick={() => navigate('/admin/photos')}
                style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', background: 'var(--faint)', cursor: 'pointer' }}
              >
                <img src={photoUrl(p, 'thumb')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
