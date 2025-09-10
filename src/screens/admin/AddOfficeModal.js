import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, GEOFENCE_CONFIG } from "../../utils/constants";
import { validators } from "../../utils/helpers";

const AddOfficeModal = ({ visible, office, onClose, onSubmit }) => {
    const isEditing = !!office;

    const [formData, setFormData] = useState({
        name: "",
        centerLatitude: "",
        centerLongitude: "",
        radius: GEOFENCE_CONFIG.DEFAULT_RADIUS.toString(),
        officeInfo: {
            address: "",
            workingHours: {
                start: "09:00",
                end: "17:00",
            },
            workingDays: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            ],
        },
    });

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (isEditing && office) {
            const coordinates = office.location?.coordinates || [
                office.centerLongitude || "",
                office.centerLatitude || "",
            ];

            setFormData({
                name: office.name || "",
                centerLatitude: (
                    coordinates[1] ||
                    office.centerLatitude ||
                    ""
                ).toString(),
                centerLongitude: (
                    coordinates[0] ||
                    office.centerLongitude ||
                    ""
                ).toString(),
                radius: (
                    office.radius || GEOFENCE_CONFIG.DEFAULT_RADIUS
                ).toString(),
                officeInfo: {
                    address: office.officeInfo?.address || "",
                    workingHours: {
                        start:
                            office.officeInfo?.workingHours?.start || "09:00",
                        end: office.officeInfo?.workingHours?.end || "17:00",
                    },
                    workingDays: office.officeInfo?.workingDays || [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                    ],
                },
            });
        } else {
            // Reset form for new office
            setFormData({
                name: "",
                centerLatitude: "",
                centerLongitude: "",
                radius: GEOFENCE_CONFIG.DEFAULT_RADIUS.toString(),
                officeInfo: {
                    address: "",
                    workingHours: {
                        start: "09:00",
                        end: "17:00",
                    },
                    workingDays: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                    ],
                },
            });
        }
        setFormErrors({});
    }, [visible, office, isEditing]);

    const validateForm = () => {
        const errors = {};

        // Office name validation
        if (!formData.name.trim()) {
            errors.name = "Office name is required";
        }

        // Coordinates validation
        const lat = parseFloat(formData.centerLatitude);
        const lng = parseFloat(formData.centerLongitude);

        if (!formData.centerLatitude || isNaN(lat)) {
            errors.centerLatitude = "Valid latitude is required";
        } else if (!validators.coordinates(lat, 0)) {
            errors.centerLatitude = "Latitude must be between -90 and 90";
        }

        if (!formData.centerLongitude || isNaN(lng)) {
            errors.centerLongitude = "Valid longitude is required";
        } else if (!validators.coordinates(0, lng)) {
            errors.centerLongitude = "Longitude must be between -180 and 180";
        }

        // Radius validation
        const radius = parseInt(formData.radius);
        if (!formData.radius || isNaN(radius)) {
            errors.radius = "Valid radius is required";
        } else if (
            radius < GEOFENCE_CONFIG.MIN_RADIUS ||
            radius > GEOFENCE_CONFIG.MAX_RADIUS
        ) {
            errors.radius = `Radius must be between ${GEOFENCE_CONFIG.MIN_RADIUS} and ${GEOFENCE_CONFIG.MAX_RADIUS} meters`;
        }

        // Working hours validation
        if (!formData.officeInfo.workingHours.start) {
            errors.startTime = "Start time is required";
        }
        if (!formData.officeInfo.workingHours.end) {
            errors.endTime = "End time is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert(
                "Validation Error",
                "Please fix the errors and try again."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                name: formData.name.trim(),
                centerLatitude: parseFloat(formData.centerLatitude),
                centerLongitude: parseFloat(formData.centerLongitude),
                radius: parseInt(formData.radius),
                officeInfo: {
                    address: formData.officeInfo.address.trim(),
                    workingHours: formData.officeInfo.workingHours,
                    workingDays: formData.officeInfo.workingDays,
                },
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error("Form submission error:", error);
            Alert.alert(
                "Error",
                "Failed to save office location. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        if (field.includes(".")) {
            // Handle nested fields (e.g., 'officeInfo.address')
            const [parent, child] = field.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else if (field.includes("workingHours.")) {
            // Handle working hours
            const timeField = field.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                officeInfo: {
                    ...prev.officeInfo,
                    workingHours: {
                        ...prev.officeInfo.workingHours,
                        [timeField]: value,
                    },
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }

        // Clear field error
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const getCurrentLocation = () => {
        Alert.alert(
            "Get Current Location",
            "This feature would typically use GPS to get your current coordinates. For demo purposes, you can enter coordinates manually.",
            [{ text: "OK" }]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {isEditing ? "Edit Office" : "Add Office Location"}
                    </Text>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text
                            style={[
                                styles.saveButton,
                                isSubmitting && styles.saveButtonDisabled,
                            ]}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Office Name */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            🏢 Office Information
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Office Name *</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    formErrors.name && styles.inputError,
                                ]}
                                placeholder="e.g., Main Office, Branch Office"
                                value={formData.name}
                                onChangeText={(value) =>
                                    handleInputChange("name", value)
                                }
                            />
                            {formErrors.name && (
                                <Text style={styles.errorText}>
                                    {formErrors.name}
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Office address (optional)"
                                value={formData.officeInfo.address}
                                onChangeText={(value) =>
                                    handleInputChange(
                                        "officeInfo.address",
                                        value
                                    )
                                }
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                📍 Location Coordinates
                            </Text>
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={getCurrentLocation}
                            >
                                <Text style={styles.locationButtonText}>
                                    📱 GPS
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Latitude *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        formErrors.centerLatitude &&
                                            styles.inputError,
                                    ]}
                                    placeholder="e.g., 40.7128"
                                    value={formData.centerLatitude}
                                    onChangeText={(value) =>
                                        handleInputChange(
                                            "centerLatitude",
                                            value
                                        )
                                    }
                                    keyboardType="numeric"
                                />
                                {formErrors.centerLatitude && (
                                    <Text style={styles.errorText}>
                                        {formErrors.centerLatitude}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Longitude *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        formErrors.centerLongitude &&
                                            styles.inputError,
                                    ]}
                                    placeholder="e.g., -74.0060"
                                    value={formData.centerLongitude}
                                    onChangeText={(value) =>
                                        handleInputChange(
                                            "centerLongitude",
                                            value
                                        )
                                    }
                                    keyboardType="numeric"
                                />
                                {formErrors.centerLongitude && (
                                    <Text style={styles.errorText}>
                                        {formErrors.centerLongitude}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Radius (meters) *</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    formErrors.radius && styles.inputError,
                                ]}
                                placeholder={`${GEOFENCE_CONFIG.MIN_RADIUS} - ${GEOFENCE_CONFIG.MAX_RADIUS}`}
                                value={formData.radius}
                                onChangeText={(value) =>
                                    handleInputChange("radius", value)
                                }
                                keyboardType="numeric"
                            />
                            {formErrors.radius && (
                                <Text style={styles.errorText}>
                                    {formErrors.radius}
                                </Text>
                            )}
                            <Text style={styles.helperText}>
                                Geofence radius for automatic attendance
                                tracking
                            </Text>
                        </View>
                    </View>

                    {/* Working Hours */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            🕒 Working Hours
                        </Text>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Start Time *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        formErrors.startTime &&
                                            styles.inputError,
                                    ]}
                                    placeholder="09:00"
                                    value={
                                        formData.officeInfo.workingHours.start
                                    }
                                    onChangeText={(value) =>
                                        handleInputChange(
                                            "workingHours.start",
                                            value
                                        )
                                    }
                                />
                                {formErrors.startTime && (
                                    <Text style={styles.errorText}>
                                        {formErrors.startTime}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.halfInput}>
                                <Text style={styles.label}>End Time *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        formErrors.endTime && styles.inputError,
                                    ]}
                                    placeholder="17:00"
                                    value={formData.officeInfo.workingHours.end}
                                    onChangeText={(value) =>
                                        handleInputChange(
                                            "workingHours.end",
                                            value
                                        )
                                    }
                                />
                                {formErrors.endTime && (
                                    <Text style={styles.errorText}>
                                        {formErrors.endTime}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <Text style={styles.helperText}>
                            Use 24-hour format (HH:MM). Working days are
                            Monday-Friday by default.
                        </Text>
                    </View>

                    {/* Bottom spacing */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </View>
        </Modal>
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
        padding: 16,
        paddingTop: 40,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.error,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    saveButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: "600",
    },
    saveButtonDisabled: {
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 16,
    },
    locationButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    locationButtonText: {
        color: COLORS.surface,
        fontSize: 14,
        fontWeight: "500",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: COLORS.surface,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        marginTop: 4,
    },
    helperText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 4,
        fontStyle: "italic",
    },
    bottomSpacing: {
        height: 40,
    },
});

export default AddOfficeModal;
