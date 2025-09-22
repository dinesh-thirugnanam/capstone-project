// Configuration constants
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.120.159.85:3000/api' 
    : 'https://your-production-api.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Storage keys
export const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  USER_DATA: 'user_data',
  LAST_LOCATION: 'last_location',
  GEOFENCING_ENABLED: 'geofencing_enabled',
};

// App colors
export const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  secondary: '#FF9800',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
};

// Geofencing constants
export const GEOFENCE_CONFIG = {
  MIN_RADIUS: 50, // meters
  MAX_RADIUS: 1000, // meters
  DEFAULT_RADIUS: 100, // meters
  LOCATION_ACCURACY: 10, // meters
  BACKGROUND_SYNC_INTERVAL: 60000, // 1 minute
};

// Notification channels
export const NOTIFICATION_CHANNELS = {
  ATTENDANCE: 'attendance-notifications',
  GEOFENCE: 'geofence-alerts',
  SYSTEM: 'system-updates',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

// Attendance event types
export const EVENT_TYPES = {
  ENTER: 'ENTER',
  EXIT: 'EXIT',
};
