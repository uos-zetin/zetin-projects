import { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useProjects } from './hooks/useProjects.js';
import ListView from './components/ListView.jsx';
import ProjectPage from './components/ProjectPage.jsx';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  const { projects, loading, error } = useProjects();
  const [filter, setFilter] = useState({ category: '', year: '', query: '' });

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <main className="app">
        <Routes>
          <Route
            path="/"
            element={
              <ListView
                projects={projects}
                loading={loading}
                error={error}
                filter={filter}
                onFilterChange={setFilter}
              />
            }
          />
          <Route
            path="/project/:id"
            element={<ProjectPage projects={projects} loading={loading} error={error} />}
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<p className="empty">관리자 로딩 중…</p>}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
