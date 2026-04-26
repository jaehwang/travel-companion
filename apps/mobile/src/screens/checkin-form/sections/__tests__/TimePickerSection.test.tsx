import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TimePickerSection from '../TimePickerSection';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return () => <View testID="date-time-picker" />;
});

describe('TimePickerSection', () => {
  const defaultProps = {
    checkedInAt: null,
    onClose: jest.fn(),
    onClear: jest.fn(),
    onChangeDate: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('"언제 방문했나요?" 제목을 표시한다', () => {
    render(<TimePickerSection {...defaultProps} />);
    expect(screen.getByText('언제 방문했나요?')).toBeTruthy();
  });

  it('"완료" 버튼을 누르면 onClose를 호출한다', () => {
    const onClose = jest.fn();
    render(<TimePickerSection {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByText('완료'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('checkedInAt이 설정되면 "시각 지정 삭제" 버튼을 표시한다', () => {
    render(<TimePickerSection {...defaultProps} checkedInAt={new Date()} />);
    expect(screen.getByText('시각 지정 삭제')).toBeTruthy();
  });

  it('checkedInAt이 null이면 "시각 지정 삭제" 버튼을 표시하지 않는다', () => {
    render(<TimePickerSection {...defaultProps} checkedInAt={null} />);
    expect(screen.queryByText('시각 지정 삭제')).toBeNull();
  });

  it('"시각 지정 삭제"를 누르면 onClear를 호출한다', () => {
    const onClear = jest.fn();
    render(<TimePickerSection {...defaultProps} checkedInAt={new Date()} onClear={onClear} />);
    fireEvent.press(screen.getByText('시각 지정 삭제'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
