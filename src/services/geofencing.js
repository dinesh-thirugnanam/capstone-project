import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { EVENT_TYPES, GEOFENCE_CONFIG } from "../utils/constants";
import { tokenManager } from "../utils/helpers";
import ApiService from "./api";
import NotificationService from "./notifications";

const LOCATION_TASK_NAME = 'background-location-task';

// Register the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Received new locations', locations);
    // Handle location updates here
    GeofencingService.instance?.handleLocationUpdate(locations[0]);
  }
});

class GeofencingService {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.currentGeofences = [];
    this.locationWatcher = null;
    
    // Set static instance for background task access
    GeofencingService.instance = this;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      const token = await tokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
      }

      this.isInitialized = true;
      console.log('GeofencingService initialized successfully');
    } catch (error) {
      console.error('GeofencingService initialization failed:', error);
      throw error;
    }
  }
        
        // Activity Recognition Config
        stopTimeout: 1,
        
        // Application config
        debug: __DEV__, // Enable debug sounds and notifications in development
        logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF,
        enableHeadless: true,
        stopOnTerminate: false,
        startOnBoot: true,
        
        // HTTP / Persistence config
        url: `${ApiService.baseURL}/attendance/event`,
        batchSync: false,
        autoSync: true,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        
        // Geofencing config
        geofenceInitialTriggerEntry: true,
        
        // Background sync
        heartbeatInterval: 60,
        
        // Notification config (iOS)
        locationAuthorizationRequest: 'Always',
        backgroundPermissionRationale: {
          title: 'Allow Attendance App to access this device\'s location even when closed or not in use.',
          message: 'This app collects location data to enable automatic attendance tracking when you enter or leave office premises.',
          positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
          negativeAction: 'Cancel'
        }
      });

      // Event listeners
      BackgroundGeolocation.onLocation(this.onLocation);
      BackgroundGeolocation.onGeofence(this.onGeofenceEvent);
      BackgroundGeolocation.onError(this.onError);
      BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange);
      BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange);

      this.isInitialized = true;
      console.log('🔧 GeofencingService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize GeofencingService:', error);
      throw error;
    }
  }

  async addGeofences(offices) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Remove existing geofences
      await BackgroundGeolocation.removeGeofences();

      // Convert offices to geofences
      const geofences = offices.map(office => ({
        identifier: office._id || office.id,
        radius: office.radius || GEOFENCE_CONFIG.DEFAULT_RADIUS,
        latitude: office.centerLatitude || office.location?.coordinates?.[1],
        longitude: office.centerLongitude || office.location?.coordinates?.[0],
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyOnDwell: false,
        loiteringDelay: 30000, // 30 seconds
      }));

      // Validate geofences
      const validGeofences = geofences.filter(geofence => 
        geofence.latitude && 
        geofence.longitude && 
        geofence.radius > 0
      );

      if (validGeofences.length === 0) {
        throw new Error('No valid geofences to add');
      }

      // Add geofences
      await BackgroundGeolocation.addGeofences(validGeofences);
      this.currentGeofences = validGeofences;
      
      console.log(`📍 Added ${validGeofences.length} geofences:`, validGeofences);
      return validGeofences;
    } catch (error) {
      console.error('❌ Failed to add geofences:', error);
      throw error;
    }
  }

  async startTracking() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await BackgroundGeolocation.start();
      this.isTracking = true;
      
      console.log('🚀 Geofence tracking started');
      
      // Get current state for debugging
      const state = await BackgroundGeolocation.getState();
      console.log('📊 BackgroundGeolocation state:', {
        enabled: state.enabled,
        isMoving: state.isMoving,
        trackingMode: state.trackingMode,
        geofencesCount: this.currentGeofences.length
      });
      
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      throw error;
    }
  }

  async stopTracking() {
    try {
      await BackgroundGeolocation.stop();
      this.isTracking = false;
      console.log('⏹️ Geofence tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop tracking:', error);
      throw error;
    }
  }

  async getCurrentLocation() {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 10,
        samples: 1
      });
      return location;
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      throw error;
    }
  }

  // Event handlers
  onLocation = (location) => {
    console.log('📍 Location update:', {
      coords: location.coords,
      timestamp: location.timestamp,
      isMoving: location.isMoving
    });
  };

  onGeofenceEvent = async (geofenceEvent) => {
    console.log('🔔 Geofence event received:', geofenceEvent);
    
    try {
      const { identifier, action, location } = geofenceEvent;
      const eventType = action === 'ENTER' ? EVENT_TYPES.ENTER : EVENT_TYPES.EXIT;
      
      // Prepare event data
      const eventData = {
        geofenceId: identifier,
        eventType: eventType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: new Date().toISOString(),
        metadata: {
          accuracy: location.coords.accuracy,
          source: 'background_geofencing',
          speed: location.coords.speed,
          heading: location.coords.heading,
          altitude: location.coords.altitude,
        }
      };

      // Send to backend
      try {
        await ApiService.recordAttendanceEvent(eventData);
        console.log(`✅ Attendance event sent: ${eventType} for geofence ${identifier}`);
      } catch (apiError) {
        console.error('❌ Failed to send attendance event:', apiError);
        // Store locally for retry later if needed
        // You can implement a local queue here
      }

      // Show local notification
      await NotificationService.showAttendanceNotification(eventType, identifier);
      
    } catch (error) {
      console.error('❌ Error handling geofence event:', error);
    }
  };

  onError = (error) => {
    console.error('❌ BackgroundGeolocation error:', error);
  };

  onPowerSaveChange = (isPowerSaveMode) => {
    console.log('🔋 Power save mode changed:', isPowerSaveMode);
    if (isPowerSaveMode) {
      console.warn('⚠️ Device is in power save mode - location tracking may be limited');
    }
  };

  onConnectivityChange = (event) => {
    console.log('🌐 Connectivity changed:', event);
  };

  // Utility methods
  async getGeofenceState() {
    try {
      const state = await BackgroundGeolocation.getState();
      const geofences = await BackgroundGeolocation.getGeofences();
      
      return {
        isEnabled: state.enabled,
        isTracking: this.isTracking,
        geofenceCount: geofences.length,
        currentGeofences: geofences,
        trackingMode: state.trackingMode,
        isMoving: state.isMoving,
      };
    } catch (error) {
      console.error('❌ Failed to get geofence state:', error);
      return null;
    }
  }

  async requestPermissions() {
    try {
      // Request location permission
      const authorizationStatus = await BackgroundGeolocation.requestPermission();
      console.log('📍 Location authorization status:', authorizationStatus);
      
      return authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS ||
             authorizationStatus === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  async reset() {
    try {
      await this.stopTracking();
      await BackgroundGeolocation.removeGeofences();
      this.currentGeofences = [];
      this.isInitialized = false;
      this.isTracking = false;
      console.log('🔄 GeofencingService reset');
    } catch (error) {
      console.error('❌ Failed to reset GeofencingService:', error);
    }
  }
}

// Export singleton instance
export default new GeofencingService();
