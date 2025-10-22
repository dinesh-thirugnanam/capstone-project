import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import { trackLocation } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
    }
  };

  const trackCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      
      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });

      console.log('Fetching location:', latitude, longitude);

      // Send to backend
      const result = await trackLocation(latitude, longitude, loc.coords.accuracy);
      
      console.log('Location tracked:', result);

      if (result.attendanceEvent) {
        setLastEvent(result.attendanceEvent);
        Alert.alert(
          'Attendance Event',
          `${result.attendanceEvent.event_type} recorded at ${new Date().toLocaleTimeString()}`
        );
      }

      // In HomeScreen.js, after tracking result:
        // if (result.insideGeofences && result.insideGeofences.length > 0) {
        // Alert.alert(
        //     'Inside Geofence',
        //     `You are at: ${result.insideGeofences[0]}`
        // );
        // }


    } catch (error) {
      console.error('Location tracking error:', error);
      Alert.alert('Error', 'Failed to track location');
    }
  };

  const startTracking = async () => {
    setTracking(true);
    
    // Track immediately
    await trackCurrentLocation();

    // Then track every 30 seconds
    intervalRef.current = setInterval(() => {
      trackCurrentLocation();
    }, 1000); // 30 seconds
  };

  const stopTracking = () => {
    setTracking(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Attendance Tracker</Text>
            <Text className="text-blue-200 mt-1">{user?.email}</Text>
          </View>
          <TouchableOpacity
            className="bg-blue-700 rounded-lg px-4 py-2"
            onPress={logout}
          >
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Card */}
      <View className="mx-6 mt-6 bg-white rounded-2xl p-6 shadow-lg">
        <Text className="text-gray-700 font-semibold text-lg mb-4">Tracking Status</Text>
        
        <View className="flex-row items-center mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${tracking ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Text className="text-gray-600">
            {tracking ? 'Active - Checking every 30s' : 'Inactive'}
          </Text>
        </View>

        {location && (
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-500 text-sm mb-1">Current Location</Text>
            <Text className="text-gray-800 font-mono text-xs">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        )}

        {lastEvent && (
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="text-blue-600 font-semibold">Last Event</Text>
            <Text className="text-gray-700 mt-1">
              {lastEvent.event_type} at {new Date(lastEvent.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${tracking ? 'bg-red-500' : 'bg-blue-600'}`}
          onPress={tracking ? stopTracking : startTracking}
        >
          <Text className="text-white font-bold text-lg">
            {tracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
        className="bg-gray-200 rounded-xl py-3 items-center mt-3"
        onPress={trackCurrentLocation}
        disabled={!tracking}
        >
                <Text className="text-gray-700 font-semibold">Check Location Now</Text>
        </TouchableOpacity>

      </View>

      {/* Quick Actions */}
      <View className="mx-6 mt-6">
        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center"
          onPress={() => navigation.navigate('Attendance')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">View Attendance History</Text>
            <Text className="text-gray-500 text-sm mt-1">See your past check-ins</Text>
          </View>
          <Text className="text-blue-600 text-2xl">→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
