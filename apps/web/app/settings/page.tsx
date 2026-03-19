import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';
import CalendarConnectionSection from './CalendarConnectionSection';
import BackButton from './BackButton';

interface Props {
  searchParams: Promise<{ calendar?: string; error?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  const calendarConnected = !!(profile as any)?.settings?.calendar_sync_enabled;

  const params = await searchParams;
  const calendarSuccess = params.calendar === 'connected';
  const errorCode = params.error;

  const displayName = user.user_metadata?.full_name || user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--tc-bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <BackButton />
          <h1 style={{ flex: 1, fontSize: 20, fontWeight: 800, color: 'var(--tc-warm-dark)', margin: 0 }}>
            설정
          </h1>
        </div>

        {/* 알림 메시지 */}
        {calendarSuccess && (
          <div style={{
            padding: '12px 16px',
            background: '#ECFDF5',
            border: '1px solid #6EE7B7',
            borderRadius: 12,
            fontSize: 14,
            color: '#065F46',
            fontWeight: 600,
          }}>
            Google Calendar 연동이 완료되었습니다.
          </div>
        )}

        {errorCode && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 12,
            fontSize: 14,
            color: 'var(--color-danger)',
          }}>
            {errorCode === 'invalid_state' && '보안 검증에 실패했습니다. 다시 시도해 주세요.'}
            {errorCode === 'no_code' && '인증 코드를 받지 못했습니다. 다시 시도해 주세요.'}
            {errorCode === 'token_exchange_failed' && '토큰 교환에 실패했습니다. 다시 시도해 주세요.'}
            {errorCode === 'no_refresh_token' && 'Refresh token을 받지 못했습니다. 다시 시도해 주세요.'}
            {!['invalid_state', 'no_code', 'token_exchange_failed', 'no_refresh_token'].includes(errorCode) && '오류가 발생했습니다. 다시 시도해 주세요.'}
          </div>
        )}

        {/* 프로필 */}
        <div style={{
          background: 'var(--tc-card-bg)',
          borderRadius: 14,
          padding: '16px',
          boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: 'var(--tc-card-empty)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              👤
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
            <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* 캘린더 연동 */}
        <section>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--tc-warm-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            연동
          </p>
          <CalendarConnectionSection connected={calendarConnected} />
        </section>

        {/* 로그아웃 */}
        <section>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--tc-warm-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            계정
          </p>
          <div style={{
            background: 'var(--tc-card-bg)',
            borderRadius: 14,
            padding: '16px',
            boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
          }}>
            <LogoutButton />
          </div>
        </section>

      </div>
    </main>
  );
}
