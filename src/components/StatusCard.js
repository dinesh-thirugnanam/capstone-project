import { StyleSheet, Text, View } from "react-native";
import { useGeofence } from "../context/GeofenceContext";
import { COLORS } from "../utils/constants";
import { formatTime } from "../utils/helpers";

const StatusCard = ({ isInOffice, currentOffice, isTracking }) => {
    const { getCurrentOffices } = useGeofence();
    const currentOffices = getCurrentOffices();

    const getStatusColor = () => {
        if (!isTracking) return COLORS.textSecondary;
        return isInOffice ? COLORS.success : COLORS.warning;
    };

    const getStatusText = () => {
        if (!isTracking) return "Tracking Disabled";
        return isInOffice ? "In Office" : "Out of Office";
    };

    const getStatusIcon = () => {
        if (!isTracking) return "⏸️";
        return isInOffice ? "✅" : "🚪";
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Attendance Status</Text>
                <Text style={styles.timestamp}>
                    {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </View>

            <View style={styles.statusContainer}>
                <View style={styles.statusIcon}>
                    <Text style={styles.iconText}>{getStatusIcon()}</Text>
                </View>

                <View style={styles.statusInfo}>
                    <Text
                        style={[styles.statusText, { color: getStatusColor() }]}
                    >
                        {getStatusText()}
                    </Text>

                    {isTracking && (
                        <Text style={styles.trackingText}>
                            📍 Location tracking active
                        </Text>
                    )}
                </View>
            </View>

            {/* Current Office Information */}
            {isInOffice && currentOffices.length > 0 && (
                <View style={styles.officeInfo}>
                    <Text style={styles.officeTitle}>Current Location:</Text>
                    {currentOffices.map((location, index) => (
                        <View key={index} style={styles.officeItem}>
                            <Text style={styles.officeName}>
                                🏢 {location.geofence?.name || "Office"}
                            </Text>
                            <Text style={styles.entryTime}>
                                Since: {formatTime(location.enteredAt)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Tracking Status */}
            <View style={styles.trackingStatus}>
                <View
                    style={[
                        styles.trackingIndicator,
                        {
                            backgroundColor: isTracking
                                ? COLORS.success
                                : COLORS.textSecondary,
                        },
                    ]}
                />
                <Text style={styles.trackingLabel}>
                    {isTracking ? "Tracking Active" : "Tracking Paused"}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 20,
        margin: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    timestamp: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    statusIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    iconText: {
        fontSize: 24,
    },
    statusInfo: {
        flex: 1,
    },
    statusText: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 4,
    },
    trackingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    officeInfo: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    officeTitle: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.text,
        marginBottom: 8,
    },
    officeItem: {
        marginBottom: 4,
    },
    officeName: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 2,
    },
    entryTime: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    trackingStatus: {
        flexDirection: "row",
        alignItems: "center",
    },
    trackingIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    trackingLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});

export default StatusCard;
