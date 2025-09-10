import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import OfficeCard from "../../components/OfficeCard";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";
import { COLORS } from "../../utils/constants";
import AddOfficeModal from "./AddOfficeModal";

const AdminDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [offices, setOffices] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            setError(null);
            const response = await ApiService.getGeofences();

            if (response.success) {
                const officesData =
                    response.data.geofences || response.data || [];
                setOffices(officesData);
                console.log("Loaded offices:", officesData.length);
            } else {
                throw new Error(response.message || "Failed to load offices");
            }
        } catch (error) {
            console.error("Failed to load offices:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOffice = async (officeData) => {
        try {
            const response = await ApiService.createGeofence(officeData);

            if (response.success) {
                setShowAddModal(false);
                setSelectedOffice(null);
                await loadOffices(); // Refresh list
                Alert.alert("Success", "Office location created successfully!");
            } else {
                throw new Error(response.message || "Failed to create office");
            }
        } catch (error) {
            console.error("Failed to create office:", error);
            Alert.alert(
                "Error",
                error.message || "Failed to create office location"
            );
        }
    };

    const handleEditOffice = (office) => {
        setSelectedOffice(office);
        setShowAddModal(true);
    };

    const handleUpdateOffice = async (officeData) => {
        try {
            const response = await ApiService.updateGeofence(
                selectedOffice._id || selectedOffice.id,
                officeData
            );

            if (response.success) {
                setShowAddModal(false);
                setSelectedOffice(null);
                await loadOffices(); // Refresh list
                Alert.alert("Success", "Office location updated successfully!");
            } else {
                throw new Error(response.message || "Failed to update office");
            }
        } catch (error) {
            console.error("Failed to update office:", error);
            Alert.alert(
                "Error",
                error.message || "Failed to update office location"
            );
        }
    };

    const handleDeleteOffice = async (officeId) => {
        Alert.alert(
            "Delete Office Location",
            "Are you sure you want to delete this office location? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await ApiService.deleteGeofence(
                                officeId
                            );

                            if (response.success) {
                                await loadOffices(); // Refresh list
                                Alert.alert(
                                    "Success",
                                    "Office location deleted successfully"
                                );
                            } else {
                                throw new Error(
                                    response.message ||
                                        "Failed to delete office"
                                );
                            }
                        } catch (error) {
                            console.error("Failed to delete office:", error);
                            Alert.alert(
                                "Error",
                                error.message ||
                                    "Failed to delete office location"
                            );
                        }
                    },
                },
            ]
        );
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

    const handleViewReports = () => {
        navigation.navigate("AttendanceReports");
    };

    const renderOfficeItem = ({ item }) => (
        <OfficeCard
            office={item}
            onEdit={handleEditOffice}
            onDelete={handleDeleteOffice}
            showActions={true}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏢</Text>
            <Text style={styles.emptyStateTitle}>No Office Locations</Text>
            <Text style={styles.emptyStateText}>
                Create your first office location to start tracking employee
                attendance
            </Text>
            <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.emptyStateButtonText}>
                    Add First Office
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading office locations..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Admin Dashboard</Text>
                    <Text style={styles.userName}>
                        {user?.email?.split("@")[0] || "Admin"}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>🚪</Text>
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Text style={styles.addButtonText}>➕ Add Office</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.reportsButton}
                    onPress={handleViewReports}
                >
                    <Text style={styles.reportsButtonText}>📊 Reports</Text>
                </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadOffices}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{offices.length}</Text>
                    <Text style={styles.statLabel}>Office Locations</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {
                            offices.filter(
                                (office) => office.isActive !== false
                            ).length
                        }
                    </Text>
                    <Text style={styles.statLabel}>Active Locations</Text>
                </View>
            </View>

            {/* Office List */}
            <FlatList
                data={offices}
                keyExtractor={(item) => item._id || item.id}
                renderItem={renderOfficeItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={loadOffices}
                    />
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            {/* Add/Edit Office Modal */}
            <AddOfficeModal
                visible={showAddModal}
                office={selectedOffice}
                onClose={() => {
                    setShowAddModal(false);
                    setSelectedOffice(null);
                }}
                onSubmit={selectedOffice ? handleUpdateOffice : handleAddOffice}
            />
        </View>
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
    actionBar: {
        flexDirection: "row",
        padding: 16,
        gap: 12,
    },
    addButton: {
        flex: 1,
        backgroundColor: COLORS.success,
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    addButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: "600",
    },
    reportsButton: {
        flex: 1,
        backgroundColor: COLORS.secondary,
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    reportsButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        backgroundColor: "#FFF5F5",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.error,
        margin: 16,
        padding: 12,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        flex: 1,
    },
    retryButton: {
        backgroundColor: COLORS.error,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    retryButtonText: {
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: "500",
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        margin: 16,
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyStateButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    emptyStateButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: "600",
    },
});

export default AdminDashboard;
