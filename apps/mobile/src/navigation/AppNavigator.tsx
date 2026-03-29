import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TripScreen from '../screens/TripScreen';
import CheckinFormScreen from '../screens/CheckinFormScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CheckinsScreen from '../screens/CheckinsScreen';
import TripFormModal from '../components/TripFormModal';
import { useTripsStore } from '../store/tripsStore';
import type { Trip, TripFormData } from '../../../../packages/shared/src/types';

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
  AddTripTab: undefined;
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

// 탭바 + 버튼 동작/레이블 override (TripScreen 등에서 설정)
let _defaultPlusHandler: (() => void) | null = null;
let _overridePlusHandler: (() => void) | null = null;
let _plusLabel = '여행 추가';
const _plusLabelListeners = new Set<(label: string) => void>();

export function setTabPlusOverride(handler: (() => void) | null, label?: string) {
  _overridePlusHandler = handler;
  const newLabel = handler ? (label ?? '추가') : '여행 추가';
  _plusLabel = newLabel;
  _plusLabelListeners.forEach(fn => fn(newLabel));
}

function AddTripTabButton({ style, accessibilityState }: BottomTabBarButtonProps) {
  const color = accessibilityState?.selected ? '#F97316' : '#9CA3AF';
  const [label, setLabel] = useState(_plusLabel);

  useEffect(() => {
    setLabel(_plusLabel);
    _plusLabelListeners.add(setLabel);
    return () => { _plusLabelListeners.delete(setLabel); };
  }, []);

  return (
    <TouchableOpacity
      style={[style, { alignItems: 'center', justifyContent: 'center', gap: 2 }]}
      onPress={() => (_overridePlusHandler ?? _defaultPlusHandler)?.()}
      activeOpacity={0.7}
      testID="btn-tab-add"
    >
      <Ionicons name="add-circle-outline" size={24} color={color} />
      <Text style={{ fontSize: 10, color }}>{label}</Text>
    </TouchableOpacity>
  );
}

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const addTrip = useTripsStore((s) => s.addTrip);
  const navigation = useNavigation<any>();

  useEffect(() => {
    _defaultPlusHandler = () => setShowCreateModal(true);
    return () => { _defaultPlusHandler = null; };
  }, []);

  const handleCreateTrip = async (data: TripFormData) => {
    const trip: Trip = await addTrip(data);
    setShowCreateModal(false);
    navigation.navigate('MainTabs', {
      screen: 'TripsTab',
      params: { screen: 'Trip', params: { trip } },
    });
  };

  return (
    <>
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
          listeners={({ navigation: tabNav }) => ({
            tabPress: () => {
              tabNav.navigate('TripsTab', { screen: 'Home' });
            },
          })}
        />
        <Tab.Screen
          name="AddTripTab"
          component={TripsStackNavigator}
          options={{
            tabBarLabel: '',
            tabBarButton: (props) => <AddTripTabButton {...props} />,
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
      <TripFormModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTrip}
      />
    </>
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
