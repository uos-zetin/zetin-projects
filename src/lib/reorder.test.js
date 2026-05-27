import { describe, it, expect } from 'vitest';
import { moveItem } from './reorder.js';

describe('moveItem', () => {
  it('항목을 앞에서 뒤로 옮긴다', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
  it('항목을 뒤에서 앞으로 옮긴다', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('원본 배열을 변경하지 않는다', () => {
    const arr = ['a', 'b', 'c'];
    moveItem(arr, 0, 1);
    expect(arr).toEqual(['a', 'b', 'c']);
  });
});
