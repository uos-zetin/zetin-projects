import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectDetail from './ProjectDetail.jsx';

const project = {
  id: 'a', title: '라인트레이서', category: 'robot', year: 2024,
  members: ['홍길동'], description: '본문 설명', tech: ['STM32'],
  links: [{ label: '원본 글 보기', url: 'https://example.com/1' }],
};

describe('ProjectDetail', () => {
  it('project가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ProjectDetail project={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('제목/멤버/개요/링크를 드로어로 렌더링한다', () => {
    render(<ProjectDetail project={project} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '라인트레이서' })).toBeInTheDocument();
    expect(screen.getByText(/홍길동/)).toBeInTheDocument();
    expect(screen.getByText('본문 설명')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '원본 글 보기' })).toHaveAttribute('href', 'https://example.com/1');
  });

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn();
    render(<ProjectDetail project={project} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalled();
  });
});
