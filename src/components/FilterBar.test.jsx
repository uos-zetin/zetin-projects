import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FilterBar from './FilterBar.jsx';

describe('FilterBar', () => {
  const props = {
    categories: ['robot', 'micromouse'],
    years: [2024, 2023],
    value: { category: '', year: '', query: '' },
    count: { all: 5, byCat: { robot: 3, micromouse: 2 } },
  };

  it('카테고리 칩(카운트 포함)을 클릭하면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'robot 3' }));
    expect(onChange).toHaveBeenCalledWith({ ...props.value, category: 'robot' });
  });

  it('연도 버튼을 누르면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '2023' }));
    expect(onChange).toHaveBeenCalledWith({ ...props.value, year: 2023 });
  });

  it('검색어를 입력하면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('프로젝트, 부원 이름 검색'), '로');
    expect(onChange).toHaveBeenCalled();
  });
});
