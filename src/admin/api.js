const json = (r) => {
  if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t || r.statusText)));
  return r.headers.get('content-type')?.includes('application/json') ? r.json() : r.text();
};
const opt = (method, body) => ({
  method,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: body == null ? undefined : JSON.stringify(body),
});

export const getStatus = () => fetch('/api/admin/status', { credentials: 'include' }).then(json);
export const signin = (id, pw) => fetch('/api/admin/signin', opt('POST', { id, pw })).then(json);
export const signout = () => fetch('/api/admin/signout', opt('POST')).then(json);

export const listProjects = () => fetch('/api/projects', { credentials: 'include' }).then(json);
export const createProject = (p) => fetch('/api/projects', opt('POST', p)).then(json);
export const updateProject = (id, p) => fetch(`/api/projects/${id}`, opt('PATCH', p)).then(json);
export const deleteProject = (id) => fetch(`/api/projects/${id}`, opt('DELETE')).then(json);
export const saveOrder = (ids) => fetch('/api/projects/order', opt('PUT', { ids })).then(json);

export const uploadImage = (projectId, file) => {
  const fd = new FormData();
  fd.set('projectId', projectId);
  fd.set('file', file);
  return fetch('/api/files', { method: 'POST', credentials: 'include', body: fd }).then(json);
};
