import { promises as fs } from 'node:fs';
import path from 'node:path';
import createError from 'http-errors';
import { getProjectsFile } from '../config.js';

let queue = Promise.resolve(); // 쓰기 직렬화
const serialize = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
};

export async function readProjects() {
  try {
    const raw = await fs.readFile(getProjectsFile(), 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeProjects(projects) {
  return serialize(async () => {
    const file = getProjectsFile();
    const tmp = `${file}.tmp`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify({ projects }, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, file); // 원자적 교체
    return projects;
  });
}

export async function addProject(project) {
  if (!project || !project.id) throw createError(400, 'id가 필요합니다.');
  const projects = await readProjects();
  if (projects.some((p) => p.id === project.id)) {
    throw createError(409, `이미 존재하는 id입니다: ${project.id}`);
  }
  return writeProjects([...projects, project]);
}

export async function updateProject(id, patch) {
  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw createError(404, '프로젝트를 찾을 수 없습니다.');
  projects[idx] = { ...projects[idx], ...patch, id }; // id는 변경 불가
  return writeProjects(projects);
}

export async function deleteProject(id) {
  const projects = await readProjects();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) throw createError(404, '프로젝트를 찾을 수 없습니다.');
  return writeProjects(next);
}

export async function reorder(ids) {
  const projects = await readProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const next = ids.map((id) => byId.get(id)).filter(Boolean);
  for (const p of projects) if (!ids.includes(p.id)) next.push(p);
  return writeProjects(next);
}
