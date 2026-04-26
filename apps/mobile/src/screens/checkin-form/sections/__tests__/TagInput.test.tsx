import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TagInput from '../TagInput';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const defaultProps = {
  tags: [],
  suggestions: [],
  aiSuggestions: [],
  onAddTag: jest.fn(),
  onRemoveTag: jest.fn(),
};

describe('TagInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('선택된 태그를 표시한다', () => {
    render(<TagInput {...defaultProps} tags={['맛집', '서울']} />);
    expect(screen.getByText('#맛집')).toBeTruthy();
    expect(screen.getByText('#서울')).toBeTruthy();
  });

  it('태그 입력 후 추가 버튼을 누르면 onAddTag를 호출한다', () => {
    const onAddTag = jest.fn();
    render(<TagInput {...defaultProps} onAddTag={onAddTag} />);
    fireEvent.changeText(screen.getByTestId('input-tag'), '광화문');
    fireEvent.press(screen.getByTestId('btn-add-tag'));
    expect(onAddTag).toHaveBeenCalledWith('광화문');
  });

  it('# 접두사를 제거하고 태그를 추가한다', () => {
    const onAddTag = jest.fn();
    render(<TagInput {...defaultProps} onAddTag={onAddTag} />);
    fireEvent.changeText(screen.getByTestId('input-tag'), '#광화문');
    fireEvent.press(screen.getByTestId('btn-add-tag'));
    expect(onAddTag).toHaveBeenCalledWith('광화문');
  });

  it('이미 선택된 태그는 추가하지 않는다', () => {
    const onAddTag = jest.fn();
    render(<TagInput {...defaultProps} tags={['광화문']} onAddTag={onAddTag} />);
    fireEvent.changeText(screen.getByTestId('input-tag'), '광화문');
    fireEvent.press(screen.getByTestId('btn-add-tag'));
    expect(onAddTag).not.toHaveBeenCalled();
  });

  it('AI 추천 태그 중 미선택인 것만 표시한다', () => {
    render(<TagInput {...defaultProps} tags={['이미선택']} aiSuggestions={['이미선택', 'AI추천']} />);
    expect(screen.queryByTestId('tag-ai-이미선택')).toBeNull();
    expect(screen.getByTestId('tag-ai-AI추천')).toBeTruthy();
  });

  it('AI 추천 태그를 누르면 onAddTag를 호출한다', () => {
    const onAddTag = jest.fn();
    render(<TagInput {...defaultProps} aiSuggestions={['추천태그']} onAddTag={onAddTag} />);
    fireEvent.press(screen.getByTestId('tag-ai-추천태그'));
    expect(onAddTag).toHaveBeenCalledWith('추천태그');
  });

  it('기존 제안 태그를 누르면 onAddTag를 호출한다', () => {
    const onAddTag = jest.fn();
    render(<TagInput {...defaultProps} suggestions={['서울', '맛집']} onAddTag={onAddTag} />);
    fireEvent.press(screen.getByTestId('tag-suggestion-서울'));
    expect(onAddTag).toHaveBeenCalledWith('서울');
  });

  it('제안 태그 중 AI 추천과 중복된 것은 표시하지 않는다', () => {
    render(<TagInput {...defaultProps} aiSuggestions={['AI태그']} suggestions={['AI태그', '일반태그']} />);
    expect(screen.queryByTestId('tag-suggestion-AI태그')).toBeNull();
    expect(screen.getByTestId('tag-suggestion-일반태그')).toBeTruthy();
  });

  it('선택된 태그를 누르면 onRemoveTag를 호출한다', () => {
    const onRemoveTag = jest.fn();
    render(<TagInput {...defaultProps} tags={['광화문']} onRemoveTag={onRemoveTag} />);
    fireEvent.press(screen.getByTestId('tag-selected-광화문'));
    expect(onRemoveTag).toHaveBeenCalledWith('광화문');
  });
});
