import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getGeofences } from '../services/api';

export default function MapWithGeofences() {
  const [location, setLocation] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Get geofences
      const data = await getGeofences();
      setGeofences(data.geofences || []);
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !location) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {/* Render geofence circles */}
      {geofences.map((geofence) => (
        <React.Fragment key={geofence.id}>
          {/* Center marker */}
          <Marker
            coordinate={{
              latitude: geofence.latitude,
              longitude: geofence.longitude,
            }}
            title={geofence.name}
            description={`Radius: ${geofence.radius}m`}
            pinColor="blue"
          />
          
          {/* Radius circle */}
          <Circle
            center={{
              latitude: geofence.latitude,
              longitude: geofence.longitude,
            }}
            radius={geofence.radius}
            strokeColor="rgba(37, 99, 235, 0.5)"
            fillColor="rgba(37, 99, 235, 0.1)"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}
    </MapView>
  );
}
