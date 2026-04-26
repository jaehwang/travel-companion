import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export function SettingsHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={16} color="#F97316" />
        <Text style={styles.backText}>돌아가기</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>설정</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function SettingsProfileCard({
  avatarUrl,
  userName,
  userEmail,
}: {
  avatarUrl?: string;
  userName: string;
  userEmail: string;
}) {
  return (
    <View style={styles.profileCard}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
      ) : (
        <View style={styles.profileAvatarPlaceholder}>
          <Ionicons name="person-outline" size={32} color="#9CA3AF" />
        </View>
      )}
      <Text style={styles.profileName}>{userName || '사용자'}</Text>
      <Text style={styles.profileEmail}>{userEmail}</Text>
    </View>
  );
}

export function SettingsCalendarSection(props: {
  calendarConnected: boolean;
  calendarLoading: boolean;
  calendarConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { calendarConnected, calendarLoading, calendarConnecting, onConnect, onDisconnect } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>연동</Text>
      <View style={styles.sectionCard}>
        <View style={styles.calendarRow}>
          <View style={styles.calendarInfo}>
            <View style={styles.calendarLabelRow}>
              <Ionicons name="calendar-outline" size={15} color="#4285F4" />
              <Text style={styles.calendarLabel}> Google Calendar</Text>
            </View>
            {calendarLoading ? (
              <ActivityIndicator size="small" color="#F97316" style={styles.calendarLoading} />
            ) : calendarConnected ? (
              <Text style={styles.calendarConnected}>연동됨</Text>
            ) : (
              <Text style={styles.calendarDisconnected}>미연동</Text>
            )}
          </View>
          {!calendarLoading && calendarConnected && (
            <TouchableOpacity onPress={onDisconnect} style={styles.disconnectButton}>
              <Text style={styles.disconnectText}>연동 해제</Text>
            </TouchableOpacity>
          )}
          {!calendarLoading && !calendarConnected && (
            <TouchableOpacity onPress={onConnect} style={styles.connectButton} disabled={calendarConnecting}>
              {calendarConnecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.connectText}>연동하기</Text>
              )}
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
  );
}

export function SettingsAccountSection({
  loggingOut,
  onLogout,
}: {
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>계정</Text>
      <TouchableOpacity onPress={onLogout} style={styles.logoutButton} disabled={loggingOut}>
        {loggingOut ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <Text style={styles.logoutText}>로그아웃</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
  headerSpacer: {
    width: 80,
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
  calendarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarLoading: {
    marginTop: 4,
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
  connectButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#4285F4',
    minWidth: 80,
    alignItems: 'center',
  },
  connectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disconnectButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  disconnectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  calendarDesc: {
    fontSize: 12,
    color: '#8B7355',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
