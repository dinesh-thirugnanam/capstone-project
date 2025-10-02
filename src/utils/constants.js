// Configuration constants
import Constants from "expo-constants";

const getDevBaseUrl = () => {
    // Get the device's network interface
    const { debuggerHost } = Constants.expoConfig?.hostUri?.split(":")[0] || {};

    // Define URLs for different locations/networks
    const DEV_URLS = {
        // Home network
        "192.168.1.100": "http://192.168.1.100:3000/api", // Your home PC
        "192.168.1.101": "http://192.168.1.101:3000/api", // Your laptop

        // Office/university network
        "10.120.159.85": "http://10.120.159.85:3000/api", // Current setup
        "10.120.159.86": "http://10.120.159.86:3000/api", // Lab PC

        // Default fallback
        localhost: "http://127.0.0.1:3000/api",
    };

    // Get current host IP
    const currentHost =
        debuggerHost || Constants.expoConfig?.hostUri?.split(":")[0];

    console.log("🔍 API URL Detection:");
    console.log("  - debuggerHost:", debuggerHost);
    console.log("  - currentHost:", currentHost);
    console.log("  - Available URLs:", DEV_URLS);

    // Multiple fallback options for different scenarios
    let selectedUrl;

    if (currentHost && DEV_URLS[currentHost]) {
        // Use mapped URL from DEV_URLS
        selectedUrl = DEV_URLS[currentHost];
        console.log("  - Using mapped URL for host:", currentHost);
    } else if (currentHost && currentHost !== "localhost") {
        // Use detected IP address directly
        selectedUrl = `http://${currentHost}:3000/api`;
        console.log("  - Using detected host IP:", currentHost);
    } else {
        // Use localhost with ADB reverse proxy (run: adb reverse tcp:3000 tcp:3000)
        selectedUrl = "http://localhost:3000/api";
        console.log("  - Using localhost with ADB reverse proxy");
    }

    // console.log("  - Final Selected URL:", selectedUrl);
    console.log("  - Final Selected URL:", "http://192.168.0.101:3000/api");

    // return selectedUrl;
    // return "http://192.168.0.101:3000/api";
    return "http://10.120.159.85:3000/api";
};

export const API_CONFIG = {
    BASE_URL: __DEV__ ? getDevBaseUrl() : "https://your-production-api.com/api",
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
