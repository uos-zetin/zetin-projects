import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginForm from './LoginForm.jsx';

describe('LoginForm', () => {
  it('아이디·비밀번호를 입력하고 제출하면 onLogin을 호출한다', async () => {
    const onLogin = vi.fn(() => Promise.resolve());
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'alice');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(onLogin).toHaveBeenCalledWith('alice', 'pw');
  });

  it('로그인 실패 시 오류 메시지를 보여준다', async () => {
    const onLogin = vi.fn(() => Promise.reject(new Error('관리자가 아닙니다.')));
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'eve');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('관리자가 아닙니다.')).toBeInTheDocument();
  });
});
