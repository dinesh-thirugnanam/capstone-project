import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
    Button,
    Card,
    Chip,
    Modal,
    Portal,
    Text,
    TextInput,
} from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import ApiService from "../../src/services/api";
import { COLORS } from "../../src/utils/constants";

export default function AdminDashboard() {
    const { user, logout } = useAuth() as any;
    const router = useRouter();

    // State
    const [employees, setEmployees] = useState<any[]>([]);
    const [officeLocations, setOfficeLocations] = useState<any[]>([]);
    const [attendanceReports, setAttendanceReports] = useState<any[]>([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationName, setLocationName] = useState("");
    const [locationRadius, setLocationRadius] = useState("100");
    const [isLoading, setIsLoading] = useState(false);

    // Load data on component mount
    useEffect(() => {
        loadEmployees();
        loadOfficeLocations();
        loadAttendanceReports();
    }, []);

    const loadEmployees = async () => {
        try {
            const response = await ApiService.getAllEmployees();
            if (response.success) {
                setEmployees(response.data);
            }
        } catch (error: any) {
            console.log("Failed to load employees:", error.message);
            // Fallback to mock data for demo
            setEmployees([
                {
                    id: 1,
                    email: "employee1@company.com",
                    status: "checked-in",
                    lastSeen: "2 mins ago",
                },
                {
                    id: 2,
                    email: "employee2@company.com",
                    status: "checked-out",
                    lastSeen: "1 hour ago",
                },
                {
                    id: 3,
                    email: "employee3@company.com",
                    status: "checked-in",
                    lastSeen: "30 mins ago",
                },
            ]);
        }
    };

    const loadOfficeLocations = async () => {
        try {
            const response = await ApiService.getGeofences();
            if (response.success) {
                setOfficeLocations(response.data);
            }
        } catch (error: any) {
            console.log("Failed to load office locations:", error.message);
        }
    };

    const loadAttendanceReports = async () => {
        try {
            const response = await ApiService.getAttendanceReports({
                limit: 10,
            });
            if (response.success) {
                setAttendanceReports(response.data);
            }
        } catch (error: any) {
            console.log("Failed to load attendance reports:", error.message);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    const handleSetOfficeLocation = async () => {
        setIsLoading(true);
        try {
            // Get current location
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission denied",
                    "Location permission is required to set office location"
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Create geofence via API
            const geofenceData = {
                name: locationName || "Office Location",
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                radius: parseInt(locationRadius) || 100,
                isActive: true,
            };

            const response = await ApiService.createGeofence(geofenceData);

            if (response.success) {
                setShowLocationModal(false);
                setLocationName("");
                setLocationRadius("100");
                Alert.alert(
                    "Success",
                    "Office location has been created successfully!"
                );
                loadOfficeLocations(); // Reload data
            } else {
                Alert.alert(
                    "Error",
                    response.message || "Failed to create office location"
                );
            }
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.message || "Failed to get current location"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Admin Dashboard
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Welcome, {user?.email}
                </Text>

                {/* Office Locations Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Office Locations ({officeLocations.length})
                        </Text>

                        {officeLocations.length > 0 ? (
                            officeLocations
                                .slice(0, 2)
                                .map((location: any, index: number) => (
                                    <View
                                        key={index}
                                        style={styles.locationItem}
                                    >
                                        <Text
                                            variant="bodyMedium"
                                            style={styles.locationText}
                                        >
                                            📍{" "}
                                            {location.name ||
                                                `Office ${index + 1}`}
                                        </Text>
                                        <Text
                                            variant="bodySmall"
                                            style={styles.locationDetails}
                                        >
                                            Lat: {location.latitude?.toFixed(6)}
                                            , Lng:{" "}
                                            {location.longitude?.toFixed(6)}
                                        </Text>
                                        <Text
                                            variant="bodySmall"
                                            style={styles.locationDetails}
                                        >
                                            Radius: {location.radius}m •{" "}
                                            {location.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </Text>
                                    </View>
                                ))
                        ) : (
                            <Text
                                variant="bodyMedium"
                                style={styles.noDataText}
                            >
                                No office locations configured
                            </Text>
                        )}

                        <Button
                            mode="contained"
                            style={styles.actionButton}
                            onPress={() => setShowLocationModal(true)}
                            loading={isLoading}
                        >
                            Add New Office Location
                        </Button>
                    </Card.Content>
                </Card>

                {/* Employee Status Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Employee Status ({employees.length})
                        </Text>

                        {employees.map((employee) => (
                            <View key={employee.id} style={styles.employeeRow}>
                                <View style={styles.employeeInfo}>
                                    <Text
                                        variant="bodyMedium"
                                        style={styles.employeeEmail}
                                    >
                                        {employee.email}
                                    </Text>
                                    <Text
                                        variant="bodySmall"
                                        style={styles.lastSeen}
                                    >
                                        Last seen: {employee.lastSeen}
                                    </Text>
                                </View>
                                <Chip
                                    mode="outlined"
                                    style={[
                                        styles.statusChip,
                                        {
                                            borderColor:
                                                employee.status === "checked-in"
                                                    ? COLORS.success
                                                    : COLORS.error,
                                        },
                                    ]}
                                    textStyle={{
                                        color:
                                            employee.status === "checked-in"
                                                ? COLORS.success
                                                : COLORS.error,
                                    }}
                                >
                                    {employee.status}
                                </Chip>
                            </View>
                        ))}
                    </Card.Content>
                </Card>

                {/* Admin Actions */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Admin Actions
                        </Text>

                        <Button
                            mode="outlined"
                            style={styles.actionButton}
                            onPress={() => {
                                loadEmployees();
                                loadOfficeLocations();
                                loadAttendanceReports();
                            }}
                        >
                            Refresh All Data
                        </Button>

                        {/* Temporary Role Switcher */}
                        <Button
                            mode="contained"
                            style={[
                                styles.actionButton,
                                { backgroundColor: COLORS.secondary },
                            ]}
                            onPress={() => {
                                router.replace("/(employee)/dashboard");
                            }}
                        >
                            🔄 Switch to Employee View (Temp)
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

            {/* Location Setting Modal */}
            <Portal>
                <Modal
                    visible={showLocationModal}
                    onDismiss={() => setShowLocationModal(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <Text variant="headlineSmall" style={styles.modalTitle}>
                        Set Office Location
                    </Text>

                    <TextInput
                        label="Location Name"
                        value={locationName}
                        onChangeText={setLocationName}
                        style={styles.input}
                        placeholder="e.g., Main Office, Branch Office"
                    />

                    <TextInput
                        label="Check-in Radius (meters)"
                        value={locationRadius}
                        onChangeText={setLocationRadius}
                        keyboardType="numeric"
                        style={styles.input}
                        placeholder="100"
                    />

                    <Text variant="bodySmall" style={styles.modalNote}>
                        This will use your current location as the office
                        location. Employees need to be within the specified
                        radius to check in.
                    </Text>

                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setShowLocationModal(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSetOfficeLocation}
                            style={styles.modalButton}
                        >
                            Set Location
                        </Button>
                    </View>
                </Modal>
            </Portal>
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
    actionButton: {
        marginBottom: 12,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
    },
    locationText: {
        fontSize: 16,
        marginBottom: 8,
        color: COLORS.text,
    },
    locationDetails: {
        fontSize: 12,
        marginBottom: 4,
        color: COLORS.textSecondary,
    },
    employeeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    employeeInfo: {
        flex: 1,
    },
    employeeEmail: {
        fontSize: 14,
        color: COLORS.text,
    },
    lastSeen: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusChip: {
        marginLeft: 8,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        textAlign: "center",
        marginBottom: 20,
        color: COLORS.primary,
    },
    input: {
        marginBottom: 16,
    },
    modalNote: {
        textAlign: "center",
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 8,
    },
    locationItem: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    noDataText: {
        textAlign: "center",
        color: COLORS.textSecondary,
        fontStyle: "italic",
        marginBottom: 16,
    },
});
