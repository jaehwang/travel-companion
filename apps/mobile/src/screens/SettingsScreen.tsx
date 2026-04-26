import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';
import {
  completeCalendarConnect,
  connectCalendar,
  disconnectCalendar,
  fetchSettings,
} from '../lib/api';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  SettingsAccountSection,
  SettingsCalendarSection,
  SettingsHeader,
  SettingsProfileCard,
} from './settings/SettingsSections';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

function useSettingsState() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        setUserEmail(user.email || '');
        setAvatarUrl(user.user_metadata?.avatar_url);
      }
    });

    fetchSettings()
      .then((settings) => setCalendarConnected(!!settings.calendar_sync_enabled))
      .catch(() => setCalendarConnected(false))
      .finally(() => setCalendarLoading(false));
  }, []);

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
          } catch {
            Alert.alert('오류', '로그아웃에 실패했습니다.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleConnectCalendar = async () => {
    setCalendarConnecting(true);
    try {
      const url = await connectCalendar();
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        'travel-companion://calendar-callback',
      );

      if (result.type !== 'success') return;

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');
      const error = callbackUrl.searchParams.get('error');

      if (error || !code) {
        Alert.alert('오류', '캘린더 연동에 실패했습니다.');
        return;
      }

      await completeCalendarConnect(code);
      setCalendarConnected(true);
    } catch {
      Alert.alert('오류', '캘린더 연동에 실패했습니다.');
    } finally {
      setCalendarConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    Alert.alert('Google Calendar', '캘린더 연동을 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '연동 해제',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectCalendar();
            setCalendarConnected(false);
          } catch {
            Alert.alert('오류', '연동 해제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  return {
    userName,
    userEmail,
    avatarUrl,
    calendarConnected,
    calendarLoading,
    calendarConnecting,
    loggingOut,
    handleLogout,
    handleConnectCalendar,
    handleDisconnectCalendar,
  };
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    userName,
    userEmail,
    avatarUrl,
    calendarConnected,
    calendarLoading,
    calendarConnecting,
    loggingOut,
    handleLogout,
    handleConnectCalendar,
    handleDisconnectCalendar,
  } = useSettingsState();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SettingsHeader onBack={() => navigation.goBack()} />

      <ScrollView style={styles.body}>
        <SettingsProfileCard avatarUrl={avatarUrl} userName={userName} userEmail={userEmail} />
        <SettingsCalendarSection
          calendarConnected={calendarConnected}
          calendarLoading={calendarLoading}
          calendarConnecting={calendarConnecting}
          onConnect={() => {
            handleConnectCalendar();
          }}
          onDisconnect={() => {
            handleDisconnectCalendar();
          }}
        />
        <SettingsAccountSection
          loggingOut={loggingOut}
          onLogout={() => {
            handleLogout();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  body: {
    flex: 1,
    padding: 20,
  },
});
