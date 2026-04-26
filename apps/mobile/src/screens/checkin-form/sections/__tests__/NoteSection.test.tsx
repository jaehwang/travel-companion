import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NoteSection from '../NoteSection';

describe('NoteSection', () => {
  it('placeholder를 표시한다', () => {
    render(<NoteSection value="" onChangeText={jest.fn()} />);
    expect(screen.getByPlaceholderText('이 순간을 기록해보세요...')).toBeTruthy();
  });

  it('value를 표시한다', () => {
    render(<NoteSection value="오늘 정말 좋았다" onChangeText={jest.fn()} />);
    expect(screen.getByDisplayValue('오늘 정말 좋았다')).toBeTruthy();
  });

  it('텍스트가 변경되면 onChangeText를 호출한다', () => {
    const onChangeText = jest.fn();
    render(<NoteSection value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText('이 순간을 기록해보세요...'), '새 메모');
    expect(onChangeText).toHaveBeenCalledWith('새 메모');
  });
});
