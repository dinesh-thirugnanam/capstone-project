import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { AuthContext } from '../context/AuthContext';
import { trackLocation } from '../services/api';
import { queueLocation, syncQueue, getQueueSize } from '../services/locationQueue';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);
  
  const intervalRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    setupNetworkListener();
    updateQueueSize();
    
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

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      if (online) {
        console.log('Back online - attempting to sync queue');
        handleSync();
      } else {
        console.log('Offline - will queue location updates');
      }
    });

    return unsubscribe;
  };

  const updateQueueSize = async () => {
    const size = await getQueueSize();
    setQueueSize(size);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncQueue();
    setSyncing(false);
    
    if (result.synced > 0) {
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} location${result.synced > 1 ? 's' : ''}`
      );
    }
    
    await updateQueueSize();
  };

  const trackCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      
      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });

      console.log('Fetching location:', latitude, longitude);

      if (isOnline) {
        // Try to send immediately
        try {
          const result = await trackLocation(latitude, longitude, loc.coords.accuracy);
          console.log('Location tracked:', result);

          if (result.attendanceEvent) {
            setLastEvent(result.attendanceEvent);
            Alert.alert(
              'Attendance Event',
              `${result.attendanceEvent.event_type} recorded at ${new Date().toLocaleTimeString()}`
            );
          }
        } catch (error) {
          console.error('Failed to track online, queueing...', error);
          await queueLocation(latitude, longitude, loc.coords.accuracy);
          await updateQueueSize();
        }
      } else {
        // Offline - queue immediately
        console.log('Offline - queueing location');
        await queueLocation(latitude, longitude, loc.coords.accuracy);
        await updateQueueSize();
      }

    } catch (error) {
      console.error('Location tracking error:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  };

    const startTracking = async () => {
    // Clear any existing interval first
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }

    setTracking(true);
    
    // Track immediately
    await trackCurrentLocation();

    // Then track every 30 seconds
    intervalRef.current = setInterval(() => {
        trackCurrentLocation();
    }, 30000);

    console.log('Tracking started, interval ID:', intervalRef.current);
    };

    const stopTracking = () => {
    console.log('Stopping tracking, clearing interval:', intervalRef.current);
    
    setTracking(false);
    
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    
    console.log('Tracking stopped');
    };

    useEffect(() => {
        requestLocationPermission();
        setupNetworkListener();
        updateQueueSize();
        
        // Cleanup function
        return () => {
            console.log('Component unmounting, cleaning up interval');
            if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            }
        };
        }, []);



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

      {/* Network Status Banner */}
      {!isOnline && (
        <View className="bg-yellow-500 px-6 py-3">
          <Text className="text-white font-semibold">⚠️ Offline Mode</Text>
          <Text className="text-white text-sm">Location updates will be synced when online</Text>
        </View>
      )}

      {/* Sync Banner */}
      {queueSize > 0 && (
        <View className="bg-orange-500 px-6 py-3 flex-row justify-between items-center">
          <View>
            <Text className="text-white font-semibold">
              📦 {queueSize} location{queueSize > 1 ? 's' : ''} queued
            </Text>
            <Text className="text-white text-sm">Waiting to sync</Text>
          </View>
          {isOnline && (
            <TouchableOpacity
              className="bg-white rounded-lg px-4 py-2"
              onPress={handleSync}
              disabled={syncing}
            >
              <Text className="text-orange-500 font-semibold">
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Status Card */}
      <View className="mx-6 mt-6 bg-white rounded-2xl p-6 shadow-lg">
        <Text className="text-gray-700 font-semibold text-lg mb-4">Tracking Status</Text>
        
        <View className="flex-row items-center mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${tracking ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Text className="text-gray-600">
            {tracking ? 'Active - Checking every 30s' : 'Inactive'}
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
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
