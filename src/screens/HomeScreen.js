import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AuthContext } from '../context/AuthContext';
import { queueLocation, syncQueue, getQueueSize } from '../services/locationQueue';
import { startBackgroundTracking, stopBackgroundTracking, isBackgroundTrackingActive } from '../services/backgroundLocationService';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [tracking, setTracking] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkTrackingStatus();
    setupNetworkListener();
    updateQueueSize();
    
    return () => {
      // Cleanup
    };
  }, []);

  const checkTrackingStatus = async () => {
    const active = await isBackgroundTrackingActive();
    setTracking(active);
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      if (online) {
        console.log('Back online - attempting to sync queue');
        handleSync();
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

  const startTracking = async () => {
    setTracking(true);
    
    const started = await startBackgroundTracking();
    
    if (started) {
      Alert.alert(
        'Background Tracking Started',
        'Your location will be tracked automatically, even when the app is closed.\n\nYou\'ll see a notification while tracking is active.'
      );
    } else {
      Alert.alert(
        'Permission Required',
        'Background tracking requires "Allow all the time" location permission.\n\nGo to:\nSettings > Apps > Capstone Project > Permissions > Location > Allow all the time'
      );
      setTracking(false);
    }
  };

  const stopTracking = async () => {
    setTracking(false);
    
    const stopped = await stopBackgroundTracking();
    
    if (stopped) {
      Alert.alert('Tracking Stopped', 'Background location tracking has been disabled');
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

      {/* Network Status */}
      {!isOnline && (
        <View className="bg-yellow-500 px-6 py-3">
          <Text className="text-white font-semibold">⚠️ Offline Mode</Text>
          <Text className="text-white text-sm">Location updates will be synced when online</Text>
        </View>
      )}

      {/* Queue Status */}
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
            {tracking ? 'Active - Background tracking enabled' : 'Inactive'}
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Working Hours Notice */}
        {tracking && (
          <View className="bg-yellow-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-700 font-semibold mb-1">⏰ Working Hours</Text>
            <Text className="text-gray-600 text-sm">
              Attendance is only tracked during business hours (9 AM - 6 PM, Mon-Fri)
            </Text>
          </View>
        )}

        {tracking && (
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="text-blue-600 font-semibold mb-1">📍 Background Tracking Active</Text>
            <Text className="text-gray-600 text-sm">
              Location is being tracked every 30 seconds, even when the app is closed
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${tracking ? 'bg-red-500' : 'bg-blue-600'}`}
          onPress={tracking ? stopTracking : startTracking}
        >
          <Text className="text-white font-bold text-lg">
            {tracking ? 'Stop Tracking' : 'Start Background Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View className="mx-6 mt-6">
        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-3"
          onPress={() => navigation.navigate('Attendance')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">View Attendance History</Text>
            <Text className="text-gray-500 text-sm mt-1">See your past check-ins</Text>
          </View>
          <Text className="text-blue-600 text-2xl">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center"
          onPress={() => navigation.navigate('Map')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">View Geofences Map</Text>
            <Text className="text-gray-500 text-sm mt-1">See all office locations</Text>
          </View>
          <Text className="text-blue-600 text-2xl">🗺️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
