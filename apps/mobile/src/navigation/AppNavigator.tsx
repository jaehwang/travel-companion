import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import TripScreen from '../screens/TripScreen';
import CheckinFormScreen from '../screens/CheckinFormScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CheckinsScreen from '../screens/CheckinsScreen';
import type { Trip } from '../../../../packages/shared/src/types';

export type LocationPickerResult = {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string;
};

export type TripsStackParamList = {
  Home: undefined;
  Trip: { trip: Trip };
};

export type CheckinsStackParamList = {
  Checkins: undefined;
};

export type MainTabParamList = {
  TripsTab: NavigatorScreenParams<TripsStackParamList>;
  CheckinsTab: NavigatorScreenParams<CheckinsStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CheckinForm: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    checkin?: import('../../../../packages/shared/src/types').Checkin;
  };
  LocationPicker: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
  };
  Settings: undefined;
};

// 하위 호환성을 위한 alias
export type AppStackParamList = RootStackParamList & TripsStackParamList;

const TripsStack = createStackNavigator<TripsStackParamList>();
const CheckinsStack = createStackNavigator<CheckinsStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFF8F0' } }}>
      <TripsStack.Screen name="Home" component={HomeScreen} />
      <TripsStack.Screen name="Trip" component={TripScreen} />
    </TripsStack.Navigator>
  );
}

function CheckinsStackNavigator() {
  return (
    <CheckinsStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFF8F0' } }}>
      <CheckinsStack.Screen name="Checkins" component={CheckinsScreen} />
    </CheckinsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8E0D4',
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="TripsTab"
        component={TripsStackNavigator}
        options={{
          tabBarLabel: '여행',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CheckinsTab"
        component={CheckinsStackNavigator}
        options={{
          tabBarLabel: '체크인',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFF8F0' },
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="CheckinForm"
        component={CheckinFormScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="LocationPicker"
        component={LocationPickerScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
    </RootStack.Navigator>
  );
}
