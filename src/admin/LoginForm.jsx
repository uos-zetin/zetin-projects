import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(id, pw);
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>ZETIN 프로젝트 관리자</h1>
      <label>
        아이디
        <input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
      </label>
      <label>
        비밀번호
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <p className="admin-login__error">{error}</p>}
      <button type="submit" disabled={busy}>로그인</button>
    </form>
  );
}
