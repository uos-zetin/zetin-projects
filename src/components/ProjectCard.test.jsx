import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectCard from './ProjectCard.jsx';

const p = {
  id: 'a', title: '라인트레이서', category: 'robot', year: 2024,
  summary: '빠른 로봇',
};

describe('ProjectCard', () => {
  it('제목/연도/요약을 렌더링한다', () => {
    render(<ProjectCard project={p} index={0} onSelect={() => {}} />);
    expect(screen.getByRole('heading', { name: '라인트레이서' })).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('빠른 로봇')).toBeInTheDocument();
  });

  it('클릭하면 onSelect를 project로 호출한다', async () => {
    const onSelect = vi.fn();
    render(<ProjectCard project={p} index={0} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /라인트레이서/ }));
    expect(onSelect).toHaveBeenCalledWith(p);
  });

  it('thumbnail이 있으면 이미지를 렌더링한다', () => {
    render(<ProjectCard project={{ ...p, thumbnail: 'data/images/x.jpg' }} index={0} onSelect={() => {}} />);
    const img = screen.getByRole('img', { name: '라인트레이서' });
    expect(img).toHaveAttribute('src', expect.stringContaining('data/images/x.jpg'));
  });
});
