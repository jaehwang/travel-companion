import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, Modal, StyleSheet, Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TripScreen from '../screens/trip/TripScreen';
import CheckinFormScreen from '../screens/checkin-form/CheckinFormScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CheckinsScreen from '../screens/CheckinsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SearchScreen from '../screens/SearchScreen';
import MapBrowseScreen from '../screens/MapBrowseScreen';
import CheckinDetailScreen from '../screens/CheckinDetailScreen';
import TripFormModal from '../components/TripFormModal';
import { useTripsStore } from '../store/tripsStore';
import type { Trip, TripFormData } from '@travel-companion/shared';

export type LocationPickerResult = {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string;
};

export type TripsStackParamList = {
  Home: undefined;
  Trip: { trip: Trip; scrollToCheckinId?: string };
};

export type CheckinsStackParamList = {
  Checkins: undefined;
};

export type MapStackParamList = {
  MapBrowse: undefined;
};

export type MainTabParamList = {
  TripsTab: NavigatorScreenParams<TripsStackParamList>;
  CheckinsTab: NavigatorScreenParams<CheckinsStackParamList>;
  ScheduleTab: undefined;
  MakeTab: undefined;
  MapTab: NavigatorScreenParams<MapStackParamList>;
  SearchTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CheckinForm: {
    tripId?: string;
    tripTitle?: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    checkin?: import('@travel-companion/shared').Checkin;
  };
  LocationPicker: {
    tripId?: string;
    tripTitle?: string;
    initialLatitude?: number;
    initialLongitude?: number;
  };
  CheckinDetail: {
    checkin: import('@travel-companion/shared').Checkin;
  };
  Settings: undefined;
};

// 하위 호환성을 위한 alias
export type AppStackParamList = RootStackParamList & TripsStackParamList;

// TripScreen에서 설정하는 체크인 컨텍스트 (여행 화면에 있을 때만 non-null)
type TripCheckinContext = {
  tripId: string;
  tripTitle: string;
  initialLatitude?: number;
  initialLongitude?: number;
  initialPlace?: string;
  initialPlaceId?: string;
} | null;

let _tripCheckinContext: TripCheckinContext = null;
let _defaultPlusHandler: (() => void) | null = null;

export function setTripCheckinContext(ctx: TripCheckinContext) {
  _tripCheckinContext = ctx;
}

function MakeTabButton({ style }: BottomTabBarButtonProps) {
  const [showSheet, setShowSheet] = useState(false);
  const navigation = useNavigation<any>();

  const handleTrip = () => {
    setShowSheet(false);
    setTimeout(() => _defaultPlusHandler?.(), 50);
  };

  const handleCheckin = () => {
    const ctx = _tripCheckinContext;
    setShowSheet(false);
    setTimeout(() => navigation.navigate('CheckinForm', ctx ? {
      tripId: ctx.tripId,
      tripTitle: ctx.tripTitle,
      initialLatitude: ctx.initialLatitude,
      initialLongitude: ctx.initialLongitude,
      initialPlace: ctx.initialPlace,
      initialPlaceId: ctx.initialPlaceId,
    } : {}), 50);
  };

  return (
    <>
      <TouchableOpacity
        style={[style, { alignItems: 'center', justifyContent: 'center', gap: 2 }]}
        onPress={() => setShowSheet(true)}
        activeOpacity={0.7}
        testID="btn-tab-make"
      >
        <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>만들기</Text>
      </TouchableOpacity>

      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowSheet(false)}
      >
        <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={() => setShowSheet(false)} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <TouchableOpacity style={sheetStyles.item} onPress={handleTrip} activeOpacity={0.7} testID="btn-make-trip">
            <View style={sheetStyles.iconWrap}>
              <Ionicons name="airplane-outline" size={22} color="#F97316" />
            </View>
            <Text style={sheetStyles.itemLabel}>여행</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheetStyles.item} onPress={handleCheckin} activeOpacity={0.7} testID="btn-make-checkin">
            <View style={sheetStyles.iconWrap}>
              <Ionicons name="location-outline" size={22} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sheetStyles.itemLabel}>체크인</Text>
              {_tripCheckinContext && (
                <Text style={sheetStyles.itemSub}>{_tripCheckinContext.tripTitle}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

const TAB_ITEM_WIDTH = 64;
const TAB_COUNT = 6;
const TAB_BAR_SIDE_INSET = Math.max(
  0,
  (Dimensions.get('window').width - TAB_COUNT * TAB_ITEM_WIDTH) / 2
);

const TripsStack = createStackNavigator<TripsStackParamList>();
const CheckinsStack = createStackNavigator<CheckinsStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
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

function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFF8F0' } }}>
      <MapStack.Screen name="MapBrowse" component={MapBrowseScreen} />
    </MapStack.Navigator>
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
            paddingLeft: TAB_BAR_SIDE_INSET,
            paddingRight: TAB_BAR_SIDE_INSET,
          },
          tabBarItemStyle: {
            flex: 0,
            width: TAB_ITEM_WIDTH,
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
          name="CheckinsTab"
          component={CheckinsStackNavigator}
          options={{
            tabBarLabel: '체크인',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ScheduleTab"
          component={ScheduleScreen}
          options={{
            tabBarLabel: '일정',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="MakeTab"
          component={TripsStackNavigator}
          options={{
            tabBarLabel: '',
            tabBarButton: (props) => <MakeTabButton {...props} />,
          }}
        />
        <Tab.Screen
          name="MapTab"
          component={MapStackNavigator}
          options={{
            tabBarLabel: '지도',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen}
          options={{
            tabBarLabel: '검색',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
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
      <RootStack.Screen
        name="CheckinDetail"
        component={CheckinDetailScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
    </RootStack.Navigator>
  );
}
