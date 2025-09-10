import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { EVENT_TYPES } from "../utils/constants";
import { tokenManager } from "../utils/helpers";
import ApiService from "./api";
import NotificationService from "./notifications";

const LOCATION_TASK_NAME = 'background-location-task';

// Define background task for location updates
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Received new locations', locations);
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

      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted - some features may not work');
      }

      this.isInitialized = true;
      console.log('✅ GeofencingService initialized successfully');
      
    } catch (error) {
      console.error('❌ GeofencingService initialization failed:', error);
      throw error;
    }
  }

  async startTracking() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
        deferredUpdatesInterval: 30000, // 30 seconds
        showsBackgroundLocationIndicator: true,
      });

      // Also start foreground location watching
      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => this.handleLocationUpdate(location)
      );

      this.isTracking = true;
      console.log('✅ Location tracking started');
      
      // Sync geofences from server
      await this.syncGeofences();
      
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      throw error;
    }
  }

  async stopTracking() {
    if (!this.isTracking) {
      return;
    }

    try {
      // Stop background location updates
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      // Stop foreground location watching
      if (this.locationWatcher) {
        this.locationWatcher.remove();
        this.locationWatcher = null;
      }

      this.isTracking = false;
      console.log('✅ Location tracking stopped');
      
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
    }
  }

  async handleLocationUpdate(location) {
    if (!location) return;

    const { latitude, longitude } = location.coords;
    console.log(`📍 Location update: ${latitude}, ${longitude}`);

    // Check all geofences
    for (const geofence of this.currentGeofences) {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        geofence.latitude, 
        geofence.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = geofence.isInside || false;

      if (isInside && !wasInside) {
        // Entered geofence
        await this.handleGeofenceEnter(geofence, location);
        geofence.isInside = true;
      } else if (!isInside && wasInside) {
        // Exited geofence
        await this.handleGeofenceExit(geofence, location);
        geofence.isInside = false;
      }
    }
  }

  async handleGeofenceEnter(geofence, location) {
    console.log(`🟢 Entered geofence: ${geofence.name}`);
    
    const attendanceData = {
      type: EVENT_TYPES.CHECK_IN,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      },
      geofenceId: geofence.id,
      timestamp: new Date().toISOString(),
      source: 'geofence'
    };

    try {
      // Record attendance
      await this.recordAttendance(attendanceData);
      
      // Show notification
      await NotificationService.showNotification(
        'Check-in Successful',
        `You've been checked in at ${geofence.name}`,
        { 
          type: 'check_in', 
          geofenceId: geofence.id 
        }
      );
      
    } catch (error) {
      console.error('❌ Failed to handle geofence entry:', error);
    }
  }

  async handleGeofenceExit(geofence, location) {
    console.log(`🔴 Exited geofence: ${geofence.name}`);
    
    const attendanceData = {
      type: EVENT_TYPES.CHECK_OUT,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      },
      geofenceId: geofence.id,
      timestamp: new Date().toISOString(),
      source: 'geofence'
    };

    try {
      // Record attendance
      await this.recordAttendance(attendanceData);
      
      // Show notification
      await NotificationService.showNotification(
        'Check-out Successful',
        `You've been checked out from ${geofence.name}`,
        { 
          type: 'check_out', 
          geofenceId: geofence.id 
        }
      );
      
    } catch (error) {
      console.error('❌ Failed to handle geofence exit:', error);
    }
  }

  async syncGeofences() {
    try {
      const response = await ApiService.get('/geofences');
      if (response.success && response.data) {
        this.currentGeofences = response.data.map(geofence => ({
          ...geofence,
          isInside: false // Initialize tracking state
        }));
        console.log(`✅ Synced ${this.currentGeofences.length} geofences`);
      }
    } catch (error) {
      console.error('❌ Failed to sync geofences:', error);
    }
  }

  async addGeofences(geofences) {
    try {
      const newGeofences = geofences.map(geofence => ({
        ...geofence,
        isInside: false
      }));
      
      this.currentGeofences = [...this.currentGeofences, ...newGeofences];
      console.log(`✅ Added ${newGeofences.length} geofences`);
      
    } catch (error) {
      console.error('❌ Failed to add geofences:', error);
      throw error;
    }
  }

  async removeGeofences(identifiers) {
    try {
      this.currentGeofences = this.currentGeofences.filter(
        geofence => !identifiers.includes(geofence.id)
      );
      console.log(`✅ Removed geofences: ${identifiers.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Failed to remove geofences:', error);
      throw error;
    }
  }

  async recordAttendance(attendanceData) {
    try {
      const response = await ApiService.post('/attendance/event', attendanceData);
      if (response.success) {
        console.log('✅ Attendance recorded successfully');
      } else {
        throw new Error(response.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('❌ Failed to record attendance:', error);
      throw error;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      return location;
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isTracking: this.isTracking,
      geofenceCount: this.currentGeofences.length
    };
  }
}

// Export singleton instance
export default new GeofencingService();
