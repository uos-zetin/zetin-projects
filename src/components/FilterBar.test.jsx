import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FilterBar from './FilterBar.jsx';

describe('FilterBar', () => {
  const props = {
    categories: ['robot', 'micromouse'],
    years: [2024, 2023],
    value: { category: '', year: '', query: '' },
  };

  it('카테고리 버튼을 클릭하면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'robot' }));
    expect(onChange).toHaveBeenCalledWith({ ...props.value, category: 'robot' });
  });

  it('연도를 선택하면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('연도'), '2023');
    expect(onChange).toHaveBeenCalledWith({ ...props.value, year: 2023 });
  });

  it('검색어를 입력하면 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<FilterBar {...props} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('검색'), '로');
    expect(onChange).toHaveBeenCalled();
  });
});
