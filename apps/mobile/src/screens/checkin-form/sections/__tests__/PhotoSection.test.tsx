import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PhotoSection from '../PhotoSection';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

describe('PhotoSection', () => {
  it('사진이 있을 때 삭제 버튼을 누르면 onClearPhoto를 호출한다', () => {
    const onClearPhoto = jest.fn();

    render(
      <PhotoSection
        photoPreview="https://example.com/photo.jpg"
        isProcessingPhoto={false}
        onClearPhoto={onClearPhoto}
      />,
    );

    fireEvent.press(screen.getByText('사진 삭제').parent!);

    expect(onClearPhoto).toHaveBeenCalledTimes(1);
  });

  it('사진 처리 중이면 로딩 문구를 표시한다', () => {
    render(
      <PhotoSection
        photoPreview=""
        isProcessingPhoto
        onClearPhoto={jest.fn()}
      />,
    );

    expect(screen.getByText('사진 처리 중...')).toBeTruthy();
  });
});
