import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';
import { getCalendarStatus, disconnectCalendar } from '../lib/api';
import type { AppStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<AppStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        setUserEmail(user.email || '');
        setAvatarUrl(user.user_metadata?.avatar_url);
      }
    });

    // Check calendar status
    getCalendarStatus()
      .then(({ connected }) => setCalendarConnected(connected))
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.body}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
          )}
          <Text style={styles.profileName}>{userName || '사용자'}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연동</Text>
          <View style={styles.sectionCard}>
            <View style={styles.calendarRow}>
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarLabel}>📅 Google Calendar</Text>
                {calendarLoading ? (
                  <ActivityIndicator size="small" color="#F97316" style={{ marginTop: 4 }} />
                ) : calendarConnected ? (
                  <Text style={styles.calendarConnected}>연동됨</Text>
                ) : (
                  <Text style={styles.calendarDisconnected}>미연동</Text>
                )}
              </View>
              {!calendarLoading && calendarConnected && (
                <TouchableOpacity onPress={handleDisconnectCalendar} style={styles.disconnectButton}>
                  <Text style={styles.disconnectText}>연동 해제</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.calendarDesc}>
              {calendarConnected
                ? '캘린더가 연동되어 있습니다.'
                : '캘린더를 연동하면 여행 일정을 자동으로 가져올 수 있습니다.'}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={loggingOut}>
            {loggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.logoutText}>로그아웃</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarConnected: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  calendarDisconnected: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  disconnectButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disconnectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
