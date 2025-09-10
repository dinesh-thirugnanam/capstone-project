import { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AttendanceEvent from "../../components/AttendanceEvent";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusCard from "../../components/StatusCard";
import { useAuth } from "../../context/AuthContext";
import { useGeofence } from "../../context/GeofenceContext";
import ApiService from "../../services/api";
import { COLORS } from "../../utils/constants";
import { formatDuration } from "../../utils/helpers";

const EmployeeDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const {
        isTracking,
        isInitializing,
        currentStatus,
        error: geofenceError,
        refreshCurrentStatus,
        hasLocationPermission,
        getTrackingState,
    } = useGeofence();

    // State
    const [dailySummary, setDailySummary] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();

        // Set up periodic refresh
        const interval = setInterval(() => {
            refreshCurrentStatus();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setError(null);
            const today = new Date().toISOString().split("T")[0];

            const [summaryResponse, historyResponse] = await Promise.all([
                ApiService.getDailySummary(today).catch((err) => ({
                    success: false,
                    error: err.message,
                })),
                ApiService.getAttendanceHistory({ page: 1, limit: 10 }).catch(
                    (err) => ({ success: false, error: err.message })
                ),
            ]);

            if (summaryResponse.success) {
                setDailySummary(summaryResponse.data);
            }

            if (historyResponse.success) {
                setRecentEvents(
                    historyResponse.data.attendanceHistory ||
                        historyResponse.data ||
                        []
                );
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        await Promise.all([loadDashboardData(), refreshCurrentStatus()]);
        setIsLoading(false);
    };

    const handleLogout = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    const result = await logout();
                    if (!result.success) {
                        Alert.alert(
                            "Error",
                            "Failed to sign out. Please try again."
                        );
                    }
                },
            },
        ]);
    };

    const handleViewHistory = () => {
        navigation.navigate("AttendanceHistory");
    };

    const handleTrackingInfo = async () => {
        const state = await getTrackingState();
        Alert.alert(
            "Tracking Status",
            `Tracking: ${isTracking ? "Active" : "Inactive"}\n` +
                `Location Permission: ${
                    hasLocationPermission() ? "Granted" : "Denied"
                }\n` +
                `Geofences: ${state?.geofenceCount || 0}\n` +
                `Is Moving: ${state?.isMoving ? "Yes" : "No"}`
        );
    };

    if (isInitializing) {
        return <LoadingSpinner message="Setting up attendance tracking..." />;
    }

    const displayError = error || geofenceError;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={handleRefresh}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.userName}>
                        {user?.email?.split("@")[0] || "Employee"}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>🚪</Text>
                </TouchableOpacity>
            </View>

            {/* Error Display */}
            {displayError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {displayError}</Text>
                </View>
            )}

            {/* Location Permission Warning */}
            {!hasLocationPermission() && (
                <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                        📍 Location permission required for automatic attendance
                        tracking
                    </Text>
                </View>
            )}

            {/* Current Status Card */}
            <StatusCard
                isInOffice={currentStatus?.isCurrentlyInside}
                currentOffice={currentStatus?.currentLocation}
                isTracking={isTracking}
            />

            {/* Daily Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>📊 Today's Summary</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Hours Worked</Text>
                        <Text style={styles.summaryValue}>
                            {dailySummary?.totalHours
                                ? formatDuration(
                                      dailySummary.totalHours * 60 * 60 * 1000
                                  )
                                : "0h 0m"}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Check-in</Text>
                        <Text style={styles.summaryValue}>
                            {dailySummary?.checkIn
                                ? new Date(
                                      dailySummary.checkIn
                                  ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : "Not yet"}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Check-out</Text>
                        <Text style={styles.summaryValue}>
                            {dailySummary?.checkOut
                                ? new Date(
                                      dailySummary.checkOut
                                  ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : currentStatus?.isCurrentlyInside
                                ? "Still in"
                                : "Not yet"}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Status</Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                {
                                    color: currentStatus?.isCurrentlyInside
                                        ? COLORS.success
                                        : COLORS.textSecondary,
                                },
                            ]}
                        >
                            {currentStatus?.isCurrentlyInside
                                ? "In Office"
                                : "Out of Office"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.activityCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>📋 Recent Activity</Text>
                    <TouchableOpacity onPress={handleViewHistory}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentEvents.length > 0 ? (
                    <View style={styles.eventsList}>
                        {recentEvents.slice(0, 5).map((event, index) => (
                            <AttendanceEvent
                                key={event.id || index}
                                event={event}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            📍 No attendance events yet today
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your attendance will be automatically tracked when
                            you enter office premises
                        </Text>
                    </View>
                )}
            </View>

            {/* Debug/Info Section (only in development) */}
            {__DEV__ && (
                <View style={styles.debugCard}>
                    <Text style={styles.cardTitle}>🔧 Debug Info</Text>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={handleTrackingInfo}
                    >
                        <Text style={styles.debugButtonText}>
                            View Tracking Status
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.debugText}>
                        Tracking: {isTracking ? "✅ Active" : "❌ Inactive"}
                    </Text>
                    <Text style={styles.debugText}>
                        Location:{" "}
                        {hasLocationPermission() ? "✅ Granted" : "❌ Denied"}
                    </Text>
                </View>
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingTop: 40,
        backgroundColor: COLORS.primary,
    },
    headerContent: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        color: COLORS.surface,
        opacity: 0.9,
    },
    userName: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.surface,
        textTransform: "capitalize",
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        fontSize: 24,
        color: COLORS.surface,
    },
    errorContainer: {
        backgroundColor: "#FFF5F5",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.error,
        margin: 16,
        padding: 12,
        borderRadius: 8,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
    },
    warningContainer: {
        backgroundColor: "#FFFBF5",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
        margin: 16,
        padding: 12,
        borderRadius: 8,
    },
    warningText: {
        color: "#E65100",
        fontSize: 14,
    },
    summaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        margin: 16,
        padding: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    date: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    summaryItem: {
        width: "48%",
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    activityCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        margin: 16,
        padding: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    viewAllText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "600",
    },
    eventsList: {
        marginTop: 8,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    debugCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        margin: 16,
        padding: 20,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
    },
    debugButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: 6,
        padding: 8,
        marginVertical: 8,
        alignItems: "center",
    },
    debugButtonText: {
        color: COLORS.surface,
        fontSize: 14,
        fontWeight: "500",
    },
    debugText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    bottomSpacing: {
        height: 40,
    },
});

export default EmployeeDashboard;
