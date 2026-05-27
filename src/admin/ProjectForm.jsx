import { useState } from 'react';
import MarkdownField from './MarkdownField.jsx';
import ImageUploadField from './ImageUploadField.jsx';

const splitCsv = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
const joinCsv = (a) => (a || []).join(', ');

export default function ProjectForm({ project, onSave, onCancel }) {
  const isEdit = Boolean(project);
  const [f, setF] = useState({
    id: project?.id || '',
    title: project?.title || '',
    category: project?.category || '',
    year: project?.year ? String(project.year) : '',
    summary: project?.summary || '',
    description: project?.description || '',
    membersCsv: joinCsv(project?.members),
    techCsv: joinCsv(project?.tech),
    thumbnail: project?.thumbnail || '',
    images: project?.images || [],
    featured: project?.featured || false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.id || !f.title) { setError('ID와 제목은 필수입니다.'); return; }
    const payload = {
      id: f.id, title: f.title, category: f.category,
      year: f.year ? Number(f.year) : undefined,
      summary: f.summary, description: f.description,
      members: splitCsv(f.membersCsv), tech: splitCsv(f.techCsv),
      thumbnail: f.thumbnail || undefined, images: f.images,
      links: project?.links || [], featured: f.featured,
    };
    setBusy(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <label>ID<input value={f.id} disabled={isEdit} onChange={(e) => set('id')(e.target.value)} /></label>
      <label>제목<input value={f.title} onChange={(e) => set('title')(e.target.value)} /></label>
      <label>분류<input value={f.category} onChange={(e) => set('category')(e.target.value)} /></label>
      <label>연도<input type="number" value={f.year} onChange={(e) => set('year')(e.target.value)} /></label>
      <label>요약<input value={f.summary} onChange={(e) => set('summary')(e.target.value)} /></label>
      <label>부원 (쉼표로 구분)<input value={f.membersCsv} onChange={(e) => set('membersCsv')(e.target.value)} /></label>
      <label>기술 (쉼표로 구분)<input value={f.techCsv} onChange={(e) => set('techCsv')(e.target.value)} /></label>
      <MarkdownField label="개요" value={f.description} onChange={set('description')} />
      <ImageUploadField label="대표 이미지" projectId={f.id} value={f.thumbnail} onChange={set('thumbnail')} />
      <ImageUploadField label="갤러리 이미지" projectId={f.id} value={f.images} multiple onChange={set('images')} />
      <label className="project-form__check">
        <input type="checkbox" checked={f.featured} onChange={(e) => set('featured')(e.target.checked)} />추천
      </label>
      {error && <p className="project-form__error">{error}</p>}
      <div className="project-form__actions">
        <button type="button" onClick={onCancel}>취소</button>
        <button type="submit" disabled={busy}>저장</button>
      </div>
    </form>
  );
}
