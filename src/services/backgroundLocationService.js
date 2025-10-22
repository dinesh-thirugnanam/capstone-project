import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
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
      console.log('[Background Location]:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      });

      try {
        const result = await trackLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.accuracy
        );
        console.log('[Background] Location tracked:', result);
      } catch (error) {
        console.error('[Background] Failed to track, queueing...', error);
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
    console.log('[Background] Requesting permissions...');
    
    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('[Background] Foreground location permission denied');
      return false;
    }

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('[Background] Background location permission denied');
      return false;
    }

    console.log('[Background] Permissions granted');

    // Check if task is defined
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      console.error('[Background] Task not defined');
      return false;
    }

    // Check if already running
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      console.log('[Background] Already running');
      return true;
    }

    // Start location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 50, // 50 meters
      deferredUpdatesInterval: 30000,
      foregroundService: {
        notificationTitle: 'Attendance Tracking',
        notificationBody: 'Tracking your location for attendance',
        notificationColor: '#2563eb',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log('[Background] Tracking started successfully');
    return true;
  } catch (error) {
    console.error('[Background] Start error:', error);
    return false;
  }
}

// Stop background location tracking
export async function stopBackgroundTracking() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('[Background] Tracking stopped');
      return true;
    }
    console.log('[Background] Not running');
    return false;
  } catch (error) {
    console.error('[Background] Stop error:', error);
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
