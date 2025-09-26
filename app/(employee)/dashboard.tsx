import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import ApiService from "../../src/services/api";
import { COLORS } from "../../src/utils/constants";

export default function EmployeeDashboard() {
    const { user, logout } = useAuth() as any;
    const router = useRouter();

    // State
    const [attendanceStatus, setAttendanceStatus] = useState("checked-out");
    const [todayHours, setTodayHours] = useState("0h 0m");
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [officeLocations, setOfficeLocations] = useState<any[]>([]);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

    // Default office location (fallback if no geofences)
    const defaultOfficeLocation = {
        latitude: 37.78825,
        longitude: -122.4324,
        radius: 100, // 100 meters
    };

    // Load data on component mount
    useEffect(() => {
        loadAttendanceStatus();
        loadGeofences();
        loadAttendanceHistory();

        // Test API health
        testAPIConnection();
    }, []);

    const testAPIConnection = async () => {
        try {
            const response = await ApiService.healthCheck();
            console.log("✅ API Health Check:", response);
        } catch (error: any) {
            console.log("❌ API Health Check Failed:", error.message);
        }
    };

    const loadAttendanceStatus = async () => {
        try {
            const response = await ApiService.getCurrentStatus();
            if (response.success) {
                setAttendanceStatus(response.data.status);
                setTodayHours(response.data.todayHours || "0h 0m");
            }
        } catch (error: any) {
            console.log("Failed to load attendance status:", error.message);
        }
    };

    const loadGeofences = async () => {
        try {
            const response = await ApiService.getGeofences();
            if (response.success) {
                setOfficeLocations(response.data);
            }
        } catch (error: any) {
            console.log("Failed to load office locations:", error.message);
        }
    };

    const loadAttendanceHistory = async () => {
        try {
            const response = await ApiService.getAttendanceHistory({
                limit: 5,
            });
            if (response.success) {
                setAttendanceHistory(response.data);
            }
        } catch (error: any) {
            console.log("Failed to load attendance history:", error.message);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const handleCheckInOut = async () => {
        setIsCheckingLocation(true);

        try {
            // Request location permission
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required for attendance tracking"
                );
                setIsCheckingLocation(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setCurrentLocation(location.coords);

            // Use first office location or default
            const currentOffice =
                officeLocations.length > 0
                    ? officeLocations[0]
                    : defaultOfficeLocation;

            // Calculate distance from office
            const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                currentOffice.latitude,
                currentOffice.longitude
            );

            console.log("Distance from office:", distance, "meters");

            if (distance <= currentOffice.radius) {
                // Within office radius - record attendance event
                const eventType =
                    attendanceStatus === "checked-in" ? "EXIT" : "ENTER";
                const newStatus =
                    attendanceStatus === "checked-in"
                        ? "checked-out"
                        : "checked-in";

                // Call API to record attendance
                const response = await ApiService.recordAttendanceEvent({
                    type: eventType,
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                    },
                    geofenceId: currentOffice.id || null,
                });

                if (response.success) {
                    setAttendanceStatus(newStatus);
                    Alert.alert(
                        "Success",
                        `You have been ${
                            newStatus === "checked-in"
                                ? "checked in"
                                : "checked out"
                        } successfully!`
                    );
                    // Reload data
                    loadAttendanceStatus();
                    loadAttendanceHistory();
                } else {
                    Alert.alert(
                        "Error",
                        response.message || "Failed to record attendance"
                    );
                }
            } else {
                // Outside office radius
                Alert.alert(
                    "Location Error",
                    `You are ${Math.round(
                        distance
                    )}m away from the office. You need to be within ${
                        currentOffice.radius
                    }m to check in.`
                );
            }
        } catch (error: any) {
            console.error("Location error:", error);
            Alert.alert(
                "Error",
                "Unable to get your current location. Please try again."
            );
        } finally {
            setIsCheckingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Employee Dashboard
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Welcome, {user?.email}
                </Text>

                {/* Current Status Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Current Status
                        </Text>

                        <View style={styles.statusRow}>
                            <Text variant="bodyLarge">Status: </Text>
                            <Chip
                                mode="outlined"
                                textStyle={{
                                    color:
                                        attendanceStatus === "checked-in"
                                            ? COLORS.success
                                            : COLORS.error,
                                }}
                                style={[
                                    styles.statusChip,
                                    {
                                        borderColor:
                                            attendanceStatus === "checked-in"
                                                ? COLORS.success
                                                : COLORS.error,
                                    },
                                ]}
                            >
                                {attendanceStatus === "checked-in"
                                    ? "Checked In"
                                    : "Checked Out"}
                            </Chip>
                        </View>

                        <Text variant="bodyMedium" style={styles.hoursText}>
                            Today's Hours: {todayHours}
                        </Text>

                        <Button
                            mode="contained"
                            style={[
                                styles.checkInButton,
                                {
                                    backgroundColor:
                                        attendanceStatus === "checked-in"
                                            ? COLORS.error
                                            : COLORS.success,
                                },
                            ]}
                            onPress={handleCheckInOut}
                            disabled={isCheckingLocation}
                            loading={isCheckingLocation}
                        >
                            {isCheckingLocation
                                ? "Checking Location..."
                                : attendanceStatus === "checked-in"
                                ? "Check Out"
                                : "Check In"}
                        </Button>
                    </Card.Content>
                </Card>

                {/* Location Info Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Location Info
                        </Text>

                        {currentLocation ? (
                            <>
                                <Text
                                    variant="bodyMedium"
                                    style={styles.locationText}
                                >
                                    📍 Current Location:{" "}
                                    {currentLocation.latitude.toFixed(6)},{" "}
                                    {currentLocation.longitude.toFixed(6)}
                                </Text>
                                <Text
                                    variant="bodySmall"
                                    style={styles.accuracyText}
                                >
                                    Accuracy: ±
                                    {currentLocation.accuracy?.toFixed(1)}m
                                </Text>
                            </>
                        ) : (
                            <Text
                                variant="bodyMedium"
                                style={styles.locationText}
                            >
                                📍 Location not detected yet
                            </Text>
                        )}

                        <Text variant="bodySmall" style={styles.officeInfo}>
                            🏢 Office Check-in Radius:{" "}
                            {
                                (officeLocations.length > 0
                                    ? officeLocations[0]
                                    : defaultOfficeLocation
                                ).radius
                            }
                            m
                        </Text>
                    </Card.Content>
                </Card>

                {/* Recent Attendance Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Recent Activity
                        </Text>

                        {attendanceHistory.length > 0 ? (
                            attendanceHistory
                                .slice(0, 3)
                                .map((event: any, index: number) => (
                                    <View
                                        key={index}
                                        style={styles.historyItem}
                                    >
                                        <Text variant="bodyMedium">
                                            {event.type === "ENTER"
                                                ? "🟢 Check In"
                                                : "🔴 Check Out"}
                                        </Text>
                                        <Text
                                            variant="bodySmall"
                                            style={styles.timestampText}
                                        >
                                            {new Date(
                                                event.timestamp
                                            ).toLocaleString()}
                                        </Text>
                                    </View>
                                ))
                        ) : (
                            <Text
                                variant="bodyMedium"
                                style={styles.noDataText}
                            >
                                No recent activity
                            </Text>
                        )}
                    </Card.Content>
                </Card>

                {/* Quick Actions Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Quick Actions
                        </Text>

                        <Button
                            mode="outlined"
                            style={styles.actionButton}
                            onPress={() => {
                                loadAttendanceHistory();
                            }}
                        >
                            Refresh Data
                        </Button>

                        {/* Temporary Role Switcher */}
                        <Button
                            mode="contained"
                            style={[
                                styles.actionButton,
                                { backgroundColor: COLORS.secondary },
                            ]}
                            onPress={() => {
                                router.replace("/(admin)/dashboard");
                            }}
                        >
                            🔄 Switch to Admin View (Temp)
                        </Button>
                    </Card.Content>
                </Card>

                <Button
                    mode="text"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                >
                    Logout
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    title: {
        textAlign: "center",
        marginBottom: 8,
        color: COLORS.primary,
        fontWeight: "bold",
    },
    subtitle: {
        textAlign: "center",
        marginBottom: 24,
        color: COLORS.text,
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 16,
        color: COLORS.primary,
        fontWeight: "600",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    statusChip: {
        marginLeft: 8,
    },
    hoursText: {
        marginBottom: 16,
        fontSize: 16,
        fontWeight: "500",
    },
    checkInButton: {
        paddingVertical: 8,
    },
    locationText: {
        marginBottom: 8,
        fontSize: 14,
    },
    accuracyText: {
        marginBottom: 8,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    officeInfo: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: "italic",
    },
    actionButton: {
        marginBottom: 8,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
    },
    historyItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    timestampText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    noDataText: {
        textAlign: "center",
        color: COLORS.textSecondary,
        fontStyle: "italic",
    },
});
