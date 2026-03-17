import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import TripListScreen from './src/screens/TripListScreen';
import CheckinListScreen from './src/screens/CheckinListScreen';

export type AppStackParamList = {
  TripList: undefined;
  CheckinList: { tripId: string; tripTitle: string };
};

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF8F0' },
        headerTintColor: '#1F2937',
        headerBackTitle: '뒤로',
      }}
    >
      <AppStack.Screen
        name="TripList"
        component={TripListScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="CheckinList"
        component={CheckinListScreen}
        options={({ route }) => ({
          title: route.params.tripTitle,
        })}
      />
    </AppStack.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {session ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
