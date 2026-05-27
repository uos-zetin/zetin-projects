import { useState } from 'react';
import { uploadImage } from './api.js';
import { resolveAsset } from '../lib/asset.js';

export default function ImageUploadField({ label, projectId, value, multiple = false, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = multiple ? (value || []) : value ? [value] : [];

  const onFiles = async (files) => {
    setError('');
    setBusy(true);
    try {
      const paths = [];
      for (const file of files) {
        const { path } = await uploadImage(projectId || 'misc', file);
        paths.push(path);
      }
      onChange(multiple ? [...(value || []), ...paths] : paths[0]);
    } catch (err) {
      setError(err.message || '업로드 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="img-field">
      <span className="img-field__label">{label}</span>
      <div className="img-field__previews">
        {list.map((src) => (
          <img key={src} src={resolveAsset(src)} alt="" />
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        aria-label={label}
        disabled={busy || !projectId}
        onChange={(e) => onFiles([...e.target.files])}
      />
      {!projectId && <small>먼저 ID를 입력하면 업로드할 수 있습니다.</small>}
      {error && <p className="img-field__error">{error}</p>}
    </div>
  );
}
