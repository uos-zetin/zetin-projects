import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectGrid from './ProjectGrid.jsx';

const projects = [
  { id: 'a', title: '로봇', year: 2024, summary: 's' },
  { id: 'b', title: '마우스', year: 2023, summary: 's' },
];

describe('ProjectGrid', () => {
  it('각 프로젝트를 카드로 렌더링한다', () => {
    render(<ProjectGrid projects={projects} onSelect={() => {}} />);
    expect(screen.getByText('로봇')).toBeInTheDocument();
    expect(screen.getByText('마우스')).toBeInTheDocument();
  });

  it('빈 배열이면 안내 문구를 보여준다', () => {
    render(<ProjectGrid projects={[]} onSelect={() => {}} />);
    expect(screen.getByText(/프로젝트가 없습니다/)).toBeInTheDocument();
  });

  it('카드 클릭 시 onSelect를 전달한다', async () => {
    const onSelect = vi.fn();
    render(<ProjectGrid projects={projects} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /로봇/ }));
    expect(onSelect).toHaveBeenCalledWith(projects[0]);
  });
});
