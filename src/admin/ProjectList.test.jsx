import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectList from './ProjectList.jsx';

const projects = [
  { id: 'a', title: '로봇A' },
  { id: 'b', title: '로봇B' },
];

describe('ProjectList', () => {
  it('프로젝트 제목과 새 프로젝트/수정/삭제 컨트롤을 보여준다', () => {
    render(<ProjectList projects={projects} onNew={() => {}} onEdit={() => {}} onDelete={() => {}} onReorder={() => {}} />);
    expect(screen.getByText('로봇A')).toBeInTheDocument();
    expect(screen.getByText('로봇B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 프로젝트' })).toBeInTheDocument();
  });

  it('삭제 확인 후 onDelete를 호출한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDelete = vi.fn();
    render(<ProjectList projects={projects} onNew={() => {}} onEdit={() => {}} onDelete={onDelete} onReorder={() => {}} />);
    await userEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);
    expect(onDelete).toHaveBeenCalledWith('a');
  });
});
