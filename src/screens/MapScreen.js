import React from 'react';
import { View } from 'react-native';
import MapWithGeofences from '../components/MapWithGeofences';

export default function MapScreen() {
  return (
    <View className="flex-1">
      <MapWithGeofences />
    </View>
  );
}
