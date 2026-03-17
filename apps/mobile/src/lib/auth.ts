import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'travel-companion' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);

    // PKCE flow: code 파라미터로 세션 교환
    const code = url.searchParams.get('code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }

    // Implicit flow fallback: 토큰이 URL에 직접 포함된 경우
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const access_token = url.searchParams.get('access_token') ??
                         hashParams.get('access_token');
    const refresh_token = url.searchParams.get('refresh_token') ??
                          hashParams.get('refresh_token');

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}
