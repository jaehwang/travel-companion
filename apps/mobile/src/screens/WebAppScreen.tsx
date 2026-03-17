import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { supabase } from '../lib/supabase';

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://travel-companion.vercel.app';

type Props = {
  onSessionExpired: () => void;
};

export default function WebAppScreen({ onSessionExpired }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // 서버 사이드 쿠키 설정 엔드포인트를 통해 로드
        // 미들웨어가 쿠키를 확인하므로 localStorage 주입 대신 서버 쿠키를 직접 설정
        const url = `${WEB_APP_URL}/api/mobile-session?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
        setSourceUrl(url);
      } else {
        onSessionExpired();
      }
    });
  }, []);

  // Android 뒤로가기 버튼으로 웹 히스토리 이동
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      webViewRef.current?.goBack();
      return true;
    });
    return () => handler.remove();
  }, []);

  // 웹 앱이 /login으로 리다이렉트하면 세션 만료로 간주
  const handleNavigationChange = (navState: WebViewNavigation) => {
    if (navState.url.includes('/login')) {
      supabase.auth.signOut();
      onSessionExpired();
    }
  };

  if (sourceUrl === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' }}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: sourceUrl }}
      onNavigationStateChange={handleNavigationChange}
      style={{ flex: 1 }}
      // iOS 안전 영역 자동 처리
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
