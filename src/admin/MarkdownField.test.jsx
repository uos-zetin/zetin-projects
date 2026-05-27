import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import MarkdownField from './MarkdownField.jsx';

function Harness() {
  const [v, setV] = useState('');
  return <MarkdownField label="개요" value={v} onChange={setV} />;
}

describe('MarkdownField', () => {
  it('입력하면 미리보기에 마크다운이 렌더링된다', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText('개요'), '**굵게**');
    const preview = screen.getByTestId('md-preview');
    expect(preview.querySelector('strong')).toHaveTextContent('굵게');
  });
});
