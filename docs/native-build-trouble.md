# 네이티브 빌드 문제 기록

## expo-dev-client + React Native 0.83 호환성 문제 (2026-04-19)

### 증상

시뮬레이터 Debug 빌드에서 앱 실행 시 다음 오류 발생:

```
[React] [runtime not ready]: Error: Cannot find native module 'ExpoLocalization'
[React] [runtime not ready]: Error: Cannot find native module 'ExpoImage'
```

Release 빌드(`npx expo run:ios --configuration Release`)는 정상 동작.

### 원인

`[runtime not ready]` = JS 번들 평가 도중 네이티브 브릿지 준비 전에 네이티브 모듈 호출.

- `expo-localization`, `expo-image` 등 Expo 패키지는 모듈 최상위에서 `requireNativeModule`을 호출 (정상 패턴)
- `requireNativeModule`은 내부적으로 `globalThis.expo.modules`에서 모듈을 조회
- **expo-dev-client + RN 0.83** 조합에서 expo-dev-client가 사용자 앱 번들을 로드할 때 새 JS 컨텍스트에 `globalThis.expo.modules`가 재설치되지 않아 모든 Expo 네이티브 모듈 조회 실패
- Release 빌드는 expo-dev-client 없이 번들이 직접 포함되므로 문제 없음

### 해결

`expo-dev-client` 제거:

1. `apps/mobile/app.json` plugins에서 `"expo-dev-client"` 제거
2. `apps/mobile/package.json` dependencies에서 `"expo-dev-client"` 제거, `start` 스크립트에서 `--dev-client` 플래그 제거
3. `npm uninstall expo-dev-client` (apps/mobile)
4. `npx expo prebuild --clean -p ios`
5. `npx expo run:ios`

Hot reload / Fast Refresh는 expo-dev-client 없이도 정상 동작하므로 개발 경험 차이 없음.

### 시도했으나 효과 없었던 것

- `pod install` 후 재빌드
- `npx expo prebuild --clean -p ios` 후 재빌드 (expo-dev-client 유지 상태)

### 교훈

- 네이티브 모듈을 사용하는 패키지 추가 후 Debug 빌드를 즉시 확인할 것
- Expo SDK 업그레이드 시 expo-dev-client 호환성을 함께 확인할 것
- Release 빌드가 되고 Debug 빌드만 실패하면 expo-dev-client를 의심할 것
