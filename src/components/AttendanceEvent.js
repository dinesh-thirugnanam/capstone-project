import { StyleSheet, Text, View } from "react-native";
import { COLORS, EVENT_TYPES } from "../utils/constants";
import { formatDate, formatTime } from "../utils/helpers";

const AttendanceEvent = ({ event }) => {
    const isEnterEvent = event.eventType === EVENT_TYPES.ENTER;
    const eventIcon = isEnterEvent ? "✅" : "🚪";
    const eventColor = isEnterEvent ? COLORS.success : COLORS.warning;
    const eventText = isEnterEvent ? "Checked In" : "Checked Out";

    const eventTime = formatTime(event.timestamp);
    const eventDate = formatDate(event.timestamp);
    const officeName = event.geofence?.name || "Office";

    // Check if event is during working hours
    const isWorkingHours = event.duringWorkingHours !== false;

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{eventIcon}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.eventType, { color: eventColor }]}>
                        {eventText}
                    </Text>
                    <Text style={styles.time}>{eventTime}</Text>
                </View>

                <Text style={styles.office}>📍 {officeName}</Text>

                <View style={styles.metadata}>
                    <Text style={styles.date}>{eventDate}</Text>

                    {!isWorkingHours && (
                        <View style={styles.afterHoursTag}>
                            <Text style={styles.afterHoursText}>
                                After Hours
                            </Text>
                        </View>
                    )}

                    {event.metadata?.accuracy && (
                        <Text style={styles.accuracy}>
                            ±{Math.round(event.metadata.accuracy)}m
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    eventType: {
        fontSize: 16,
        fontWeight: "600",
    },
    time: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    office: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
    },
    metadata: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    date: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginRight: 12,
    },
    afterHoursTag: {
        backgroundColor: COLORS.warning,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
    },
    afterHoursText: {
        fontSize: 10,
        color: COLORS.surface,
        fontWeight: "500",
    },
    accuracy: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});

export default AttendanceEvent;
