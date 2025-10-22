import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert } from 'react-native';
import { trackLocation } from './api';
import { queueLocation } from './locationQueue';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Background Task] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      console.log('[Background Location] 📍 Update received:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toLocaleString(),
      });

      try {
        const result = await trackLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.accuracy
        );
        console.log('[Background] ✅ Tracked successfully:', result);
        
        // Log if attendance event was created
        if (result.attendanceEvent) {
          console.log('[Background] 🎯 ATTENDANCE EVENT:', result.attendanceEvent.event_type);
        } else if (result.reason) {
          console.log('[Background] ⏰ Not tracked:', result.reason);
        }
      } catch (error) {
        console.error('[Background] ❌ Failed to track, queueing...', error);
        await queueLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.accuracy
        );
      }
    }
  }
});

// Start background location tracking
export async function startBackgroundTracking() {
  try {
    console.log('\n=== STARTING BACKGROUND TRACKING ===');
    
    // Request foreground permissions
    console.log('[1/5] Requesting foreground permission...');
    const foregroundResult = await Location.requestForegroundPermissionsAsync();
    console.log('[1/5] Foreground status:', foregroundResult.status);
    
    if (foregroundResult.status !== 'granted') {
      console.error('❌ Foreground permission denied');
      Alert.alert('Permission Required', 'Location permission is required for attendance tracking');
      return false;
    }

    // Request background permissions
    console.log('[2/5] Requesting background permission...');
    const backgroundResult = await Location.requestBackgroundPermissionsAsync();
    console.log('[2/5] Background status:', backgroundResult.status);
    
    if (backgroundResult.status !== 'granted') {
      console.error('❌ Background permission denied');
      Alert.alert(
        'Background Permission Required',
        'For automatic attendance tracking, please allow location access "All the time".\n\nGo to:\nSettings > Apps > Capstone Project > Permissions > Location > Allow all the time'
      );
      return false;
    }

    console.log('✅ All permissions granted');

    // Check if task is defined
    console.log('[3/5] Checking if task is defined...');
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    console.log('[3/5] Task defined:', isTaskDefined);
    
    if (!isTaskDefined) {
      console.error('❌ Background task not defined!');
      Alert.alert(
        'Setup Error',
        'Background task is not properly configured. This usually means the app needs to be rebuilt with expo-dev-client.'
      );
      return false;
    }

    // Check if already running
    console.log('[4/5] Checking if already running...');
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[4/5] Already started:', hasStarted);
    
    if (hasStarted) {
      console.log('ℹ️ Background tracking already active');
      return true;
    }

    // Start location updates
    console.log('[5/5] Starting location updates...');
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds (for testing, use 30000 for production)
      distanceInterval: 50,
      deferredUpdatesInterval: 10000,
      foregroundService: {
        notificationTitle: 'Attendance Tracking',
        notificationBody: 'Your location is being tracked for attendance',
        notificationColor: '#2563eb',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log('✅ Background tracking started successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to start background tracking:', error);
    Alert.alert('Error', `Failed to start tracking: ${error.message}`);
    return false;
  }
}

// Stop background location tracking
export async function stopBackgroundTracking() {
  try {
    console.log('\n=== STOPPING BACKGROUND TRACKING ===');
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('✅ Background tracking stopped\n');
      return true;
    }
    
    console.log('ℹ️ Background tracking was not running\n');
    return false;
  } catch (error) {
    console.error('❌ Failed to stop background tracking:', error);
    return false;
  }
}

// Check if background tracking is active
export async function isBackgroundTrackingActive() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    return hasStarted;
  } catch (error) {
    console.error('[Background] Status check error:', error);
    return false;
  }
}
