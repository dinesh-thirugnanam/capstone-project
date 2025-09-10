import { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import ApiService from "../services/api";
import GeofencingService from "../services/geofencing-expo";
import NotificationService from "../services/notifications";
import { useAuth } from "./AuthContext";

const GeofenceContext = createContext({});

export const useGeofence = () => {
    const context = useContext(GeofenceContext);
    if (!context) {
        throw new Error("useGeofence must be used within a GeofenceProvider");
    }
    return context;
};

export const GeofenceProvider = ({ children }) => {
    const { user, isAuthenticated, isEmployee } = useAuth();

    // State
    const [isTracking, setIsTracking] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [offices, setOffices] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [permissions, setPermissions] = useState({
        location: false,
        notifications: false,
    });
    const [error, setError] = useState(null);

    // Initialize geofencing when user logs in as employee
    useEffect(() => {
        if (isAuthenticated && isEmployee()) {
            initializeGeofencing();
        } else if (!isAuthenticated) {
            cleanup();
        }
    }, [isAuthenticated, user]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            NotificationService.handleAppStateChange(nextAppState);

            if (nextAppState === "active" && isTracking) {
                // Refresh status when app becomes active
                refreshCurrentStatus();
            }
        };

        const subscription = AppState.addEventListener(
            "change",
            handleAppStateChange
        );
        return () => subscription?.remove();
    }, [isTracking]);

    const initializeGeofencing = async () => {
        try {
            setIsInitializing(true);
            setError(null);

            console.log("🔧 Initializing geofencing for employee...");

            // Request permissions
            const permissionsGranted = await requestPermissions();
            if (!permissionsGranted) {
                throw new Error("Required permissions not granted");
            }

            // Initialize services
            await Promise.all([
                GeofencingService.initialize(),
                NotificationService.initialize(),
            ]);

            // Load offices and set up geofences
            await loadOfficesAndSetupGeofences();

            // Start tracking
            await startTracking();

            console.log("✅ Geofencing initialized successfully");
        } catch (error) {
            console.error("❌ Failed to initialize geofencing:", error);
            setError(error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    const requestPermissions = async () => {
        try {
            // Request geofencing permissions
            const locationPermission =
                await GeofencingService.requestPermissions();

            // Request notification permissions
            const notificationPermission =
                await NotificationService.initialize();

            setPermissions({
                location: locationPermission,
                notifications: notificationPermission,
            });

            if (!locationPermission) {
                await NotificationService.showSystemNotification(
                    "Location Permission Required",
                    "Please enable location permissions for automatic attendance tracking"
                );
            }

            if (!notificationPermission) {
                await NotificationService.showSystemNotification(
                    "Notification Permission",
                    "Enable notifications to receive attendance alerts"
                );
            }

            return locationPermission; // Location is mandatory, notifications are optional
        } catch (error) {
            console.error("❌ Permission request error:", error);
            return false;
        }
    };

    const loadOfficesAndSetupGeofences = async () => {
        try {
            const response = await ApiService.getGeofences();

            if (response.success && response.data) {
                const officesData = response.data.geofences || response.data;
                setOffices(officesData);

                if (officesData.length > 0) {
                    await GeofencingService.addGeofences(officesData);
                    console.log(
                        `📍 Set up geofences for ${officesData.length} offices`
                    );
                } else {
                    console.warn("⚠️ No offices found to set up geofences");
                }
            }
        } catch (error) {
            console.error("❌ Failed to load offices:", error);
            throw error;
        }
    };

    const startTracking = async () => {
        try {
            await GeofencingService.startTracking();
            setIsTracking(true);

            // Refresh current status
            await refreshCurrentStatus();

            console.log("🚀 Geofence tracking started");
        } catch (error) {
            console.error("❌ Failed to start tracking:", error);
            throw error;
        }
    };

    const stopTracking = async () => {
        try {
            await GeofencingService.stopTracking();
            setIsTracking(false);
            console.log("⏹️ Geofence tracking stopped");
        } catch (error) {
            console.error("❌ Failed to stop tracking:", error);
            setError(error.message);
        }
    };

    const refreshCurrentStatus = async () => {
        try {
            const response = await ApiService.getCurrentStatus();
            if (response.success) {
                setCurrentStatus(response.data);
            }
        } catch (error) {
            console.error("❌ Failed to refresh current status:", error);
        }
    };

    const refreshOffices = async () => {
        try {
            await loadOfficesAndSetupGeofences();
        } catch (error) {
            console.error("❌ Failed to refresh offices:", error);
            setError(error.message);
        }
    };

    const cleanup = async () => {
        try {
            await GeofencingService.reset();
            setIsTracking(false);
            setOffices([]);
            setCurrentStatus(null);
            setError(null);
            console.log("🧹 Geofencing cleaned up");
        } catch (error) {
            console.error("❌ Cleanup error:", error);
        }
    };

    const getTrackingState = async () => {
        try {
            return await GeofencingService.getGeofenceState();
        } catch (error) {
            console.error("❌ Failed to get tracking state:", error);
            return null;
        }
    };

    const forceLocationUpdate = async () => {
        try {
            return await GeofencingService.getCurrentLocation();
        } catch (error) {
            console.error("❌ Failed to get current location:", error);
            setError(error.message);
            return null;
        }
    };

    const clearError = () => {
        setError(null);
    };

    // Helper methods
    const isCurrentlyInOffice = () => {
        return currentStatus?.isCurrentlyInside || false;
    };

    const getCurrentOffices = () => {
        return currentStatus?.currentLocations || [];
    };

    const getOfficeCount = () => {
        return offices.length;
    };

    const hasLocationPermission = () => {
        return permissions.location;
    };

    const hasNotificationPermission = () => {
        return permissions.notifications;
    };

    const contextValue = {
        // State
        isTracking,
        isInitializing,
        offices,
        currentStatus,
        permissions,
        error,

        // Actions
        startTracking,
        stopTracking,
        refreshCurrentStatus,
        refreshOffices,
        requestPermissions,
        forceLocationUpdate,
        clearError,

        // Helper methods
        isCurrentlyInOffice,
        getCurrentOffices,
        getOfficeCount,
        hasLocationPermission,
        hasNotificationPermission,
        getTrackingState,
    };

    return (
        <GeofenceContext.Provider value={contextValue}>
            {children}
        </GeofenceContext.Provider>
    );
};

export { GeofenceContext };
export default GeofenceProvider;
