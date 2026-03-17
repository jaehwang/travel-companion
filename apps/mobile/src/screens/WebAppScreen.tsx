import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://travel-companion.vercel.app';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Supabase가 localStorage에 세션을 저장하는 키
// 형식: sb-{projectRef}-auth-token
function getStorageKey(): string {
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

// 웹 앱의 localStorage에 Supabase 세션을 주입하는 스크립트
// injectedJavaScriptBeforeContentLoaded로 페이지 로드 전에 실행됨
function buildInjectionScript(session: Session): string {
  const storageKey = getStorageKey();
  const sessionJson = JSON.stringify(session)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  return `
    (function() {
      try {
        localStorage.setItem('${storageKey}', '${sessionJson}');
      } catch(e) {}
    })();
    true;
  `;
}

type Props = {
  onSessionExpired: () => void;
};

export default function WebAppScreen({ onSessionExpired }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [injectedScript, setInjectedScript] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInjectedScript(session ? buildInjectionScript(session) : 'true;');
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

  if (injectedScript === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' }}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: `${WEB_APP_URL}/checkin` }}
      injectedJavaScriptBeforeContentLoaded={injectedScript}
      onNavigationStateChange={handleNavigationChange}
      style={{ flex: 1 }}
      // iOS 안전 영역 자동 처리
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
