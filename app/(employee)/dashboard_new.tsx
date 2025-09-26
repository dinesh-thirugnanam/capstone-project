import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/utils/constants";

export default function EmployeeDashboard() {
    const { user, logout } = useAuth() as any;
    const router = useRouter();
    
    // State
    const [attendanceStatus, setAttendanceStatus] = useState("checked-out");
    const [todayHours, setTodayHours] = useState("0h 0m");
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    
    // Mock office location (this should come from admin settings)
    const officeLocation = {
        latitude: 37.78825,
        longitude: -122.4324,
        radius: 100 // 100 meters
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const handleCheckInOut = async () => {
        setIsCheckingLocation(true);
        
        try {
            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for attendance tracking');
                setIsCheckingLocation(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setCurrentLocation(location.coords);

            // Calculate distance from office
            const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                officeLocation.latitude,
                officeLocation.longitude
            );

            console.log('Distance from office:', distance, 'meters');

            if (distance <= officeLocation.radius) {
                // Within office radius - allow check in/out
                const newStatus = attendanceStatus === "checked-in" ? "checked-out" : "checked-in";
                setAttendanceStatus(newStatus);
                
                Alert.alert(
                    'Success',
                    `You have been ${newStatus === "checked-in" ? "checked in" : "checked out"} successfully!`
                );
            } else {
                // Outside office radius
                Alert.alert(
                    'Location Error',
                    `You are ${Math.round(distance)}m away from the office. You need to be within ${officeLocation.radius}m to check in.`
                );
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Unable to get your current location. Please try again.');
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
                                    color: attendanceStatus === "checked-in" ? COLORS.success : COLORS.error,
                                }}
                                style={[
                                    styles.statusChip,
                                    {
                                        borderColor: attendanceStatus === "checked-in" ? COLORS.success : COLORS.error,
                                    },
                                ]}
                            >
                                {attendanceStatus === "checked-in" ? "Checked In" : "Checked Out"}
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
                                    backgroundColor: attendanceStatus === "checked-in" ? COLORS.error : COLORS.success,
                                },
                            ]}
                            onPress={handleCheckInOut}
                            disabled={isCheckingLocation}
                            loading={isCheckingLocation}
                        >
                            {isCheckingLocation 
                                ? 'Checking Location...' 
                                : attendanceStatus === "checked-in" ? "Check Out" : "Check In"
                            }
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
                                <Text variant="bodyMedium" style={styles.locationText}>
                                    📍 Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                </Text>
                                <Text variant="bodySmall" style={styles.accuracyText}>
                                    Accuracy: ±{currentLocation.accuracy?.toFixed(1)}m
                                </Text>
                            </>
                        ) : (
                            <Text variant="bodyMedium" style={styles.locationText}>
                                📍 Location not detected yet
                            </Text>
                        )}
                        
                        <Text variant="bodySmall" style={styles.officeInfo}>
                            🏢 Office Check-in Radius: {officeLocation.radius}m
                        </Text>
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
                                console.log("View History pressed");
                            }}
                        >
                            View Attendance History
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
        fontStyle: 'italic',
    },
    actionButton: {
        marginBottom: 8,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
    },
});
