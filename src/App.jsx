import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { LangCtx } from './ui.jsx';
import Home from './pages/Home.jsx';
import ThemePage from './pages/ThemePage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminPhotos from './pages/admin/AdminPhotos.jsx';
import AdminThemes from './pages/admin/AdminThemes.jsx';
import AdminUpload from './pages/admin/AdminUpload.jsx';

function ThemePageRoute() {
  const { slug } = useParams();
  return <ThemePage slug={slug} />;
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('photolib-lang') || 'ru');
  const [dark, setDark] = useState(() => localStorage.getItem('photolib-dark') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('photolib-dark', dark ? '1' : '0');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('photolib-lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(l => l === 'ru' ? 'en' : 'ru');
  const toggleDark = () => setDark(d => !d);

  return (
    <LangCtx.Provider value={lang}>
      <Routes>
        <Route path="/" element={<Home toggleLang={toggleLang} toggleDark={toggleDark} dark={dark} />} />
        <Route path="/themes/:slug" element={<ThemePageRoute />} />
        <Route path="/admin" element={<AdminLayout lang={lang} toggleLang={toggleLang} toggleDark={toggleDark} dark={dark} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="themes" element={<AdminThemes />} />
          <Route path="upload" element={<AdminUpload />} />
        </Route>
      </Routes>
    </LangCtx.Provider>
  );
}
