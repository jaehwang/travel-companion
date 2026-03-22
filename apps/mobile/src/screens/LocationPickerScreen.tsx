import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import LocationPickerContent from '../components/LocationPickerContent';
import type { AppStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<AppStackParamList, 'LocationPicker'>;
type PickerRouteProp = RouteProp<AppStackParamList, 'LocationPicker'>;

export default function LocationPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PickerRouteProp>();
  const { tripId, tripTitle, initialLatitude, initialLongitude } = route.params;

  return (
    <LocationPickerContent
      initialLatitude={initialLatitude}
      initialLongitude={initialLongitude}
      onConfirm={(lat, lng, placeName, placeId) => {
        navigation.navigate('CheckinForm', {
          tripId,
          tripTitle,
          locationResult: { latitude: lat, longitude: lng, placeName, placeId },
        } as any);
      }}
      onClose={() => navigation.goBack()}
    />
  );
}
