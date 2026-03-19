import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { Trip } from '../../../../packages/shared/src/types';
import HomeScreen from '../screens/HomeScreen';
import TripScreen from '../screens/TripScreen';
import CheckinFormScreen from '../screens/CheckinFormScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type LocationPickerResult = {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string;
};

export type AppStackParamList = {
  Home: undefined;
  Trip: { trip: Trip };
  CheckinForm: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    // LocationPicker result - set when returning from LocationPicker
    locationResult?: LocationPickerResult;
  };
  LocationPicker: {
    initialLatitude?: number;
    initialLongitude?: number;
  };
  Settings: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFF8F0' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Trip" component={TripScreen} />
      <Stack.Screen
        name="CheckinForm"
        component={CheckinFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="LocationPicker"
        component={LocationPickerScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
