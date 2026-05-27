import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectForm from './ProjectForm.jsx';

describe('ProjectForm', () => {
  it('새 프로젝트 입력 후 저장하면 onSave에 정규화된 객체를 넘긴다', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(<ProjectForm onSave={onSave} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText('ID'), 'new-bot');
    await userEvent.type(screen.getByLabelText('제목'), '새 로봇');
    await userEvent.type(screen.getByLabelText('분류'), '드론');
    await userEvent.type(screen.getByLabelText('연도'), '2026');
    await userEvent.type(screen.getByLabelText('기술 (쉼표로 구분)'), 'ROS, GPU');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-bot', title: '새 로봇', category: '드론', year: 2026, tech: ['ROS', 'GPU'],
    }));
  });

  it('기존 프로젝트는 ID를 수정할 수 없다', () => {
    render(<ProjectForm project={{ id: 'a', title: 'A' }} onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText('ID')).toBeDisabled();
  });

  it('링크를 추가해 입력하면 onSave payload에 포함된다', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(<ProjectForm onSave={onSave} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText('ID'), 'bot');
    await userEvent.type(screen.getByLabelText('제목'), '봇');
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }));
    await userEvent.type(screen.getByPlaceholderText('라벨'), 'GitHub');
    await userEvent.type(screen.getByPlaceholderText('https://...'), 'https://github.com/uos-zetin/x');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      links: [{ label: 'GitHub', url: 'https://github.com/uos-zetin/x' }],
    }));
  });

  it('URL이 빈 링크 행은 저장 시 제외된다', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(<ProjectForm onSave={onSave} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText('ID'), 'bot');
    await userEvent.type(screen.getByLabelText('제목'), '봇');
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }));
    await userEvent.type(screen.getByPlaceholderText('라벨'), '라벨만');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ links: [] }));
  });
});
