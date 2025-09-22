import { Picker } from "@react-native-picker/picker";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { COLORS, USER_ROLES } from "../../utils/constants";
import { validators } from "../../utils/helpers";

const RegisterScreen = () => {
    const { register, isLoading, error } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        role: USER_ROLES.EMPLOYEE,
    });
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        if (!formData.email) {
            errors.email = "Email is required";
        } else if (!validators.email(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (!validators.password(formData.password)) {
            errors.password = "Password must be at least 6 characters long";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        if (!formData.role) {
            errors.role = "Please select a role";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        const result = await register(
            formData.email,
            formData.password,
            formData.role
        );

        if (!result.success) {
            Alert.alert("Registration Failed", result.error);
        }
        // No manual navigation needed - the auth context will handle it
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear field error when user starts typing
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Creating your account..." />;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Join the attendance tracking system
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[
                                styles.input,
                                formErrors.email && styles.inputError,
                            ]}
                            placeholder="Enter your email"
                            placeholderTextColor={COLORS.textSecondary}
                            value={formData.email}
                            onChangeText={(value) =>
                                handleInputChange("email", value)
                            }
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                        />
                        {formErrors.email && (
                            <Text style={styles.errorText}>
                                {formErrors.email}
                            </Text>
                        )}
                    </View>

                    {/* Role Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Type</Text>
                        <View
                            style={[
                                styles.pickerContainer,
                                formErrors.role && styles.inputError,
                            ]}
                        >
                            <Picker
                                selectedValue={formData.role}
                                onValueChange={(value) =>
                                    handleInputChange("role", value)
                                }
                                style={styles.picker}
                            >
                                <Picker.Item
                                    label="Employee"
                                    value={USER_ROLES.EMPLOYEE}
                                />
                                <Picker.Item
                                    label="Administrator"
                                    value={USER_ROLES.ADMIN}
                                />
                            </Picker>
                        </View>
                        {formErrors.role && (
                            <Text style={styles.errorText}>
                                {formErrors.role}
                            </Text>
                        )}
                        <Text style={styles.helperText}>
                            {formData.role === USER_ROLES.ADMIN
                                ? "Admins can manage office locations and view all employee attendance"
                                : "Employees can track their own attendance automatically"}
                        </Text>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                formErrors.password && styles.inputError,
                            ]}
                            placeholder="Create a password"
                            placeholderTextColor={COLORS.textSecondary}
                            value={formData.password}
                            onChangeText={(value) =>
                                handleInputChange("password", value)
                            }
                            secureTextEntry
                            autoComplete="new-password"
                        />
                        {formErrors.password && (
                            <Text style={styles.errorText}>
                                {formErrors.password}
                            </Text>
                        )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                formErrors.confirmPassword && styles.inputError,
                            ]}
                            placeholder="Confirm your password"
                            placeholderTextColor={COLORS.textSecondary}
                            value={formData.confirmPassword}
                            onChangeText={(value) =>
                                handleInputChange("confirmPassword", value)
                            }
                            secureTextEntry
                            autoComplete="new-password"
                        />
                        {formErrors.confirmPassword && (
                            <Text style={styles.errorText}>
                                {formErrors.confirmPassword}
                            </Text>
                        )}
                    </View>

                    {/* Global Error Message */}
                    {error && (
                        <View style={styles.globalErrorContainer}>
                            <Text style={styles.globalErrorText}>{error}</Text>
                        </View>
                    )}

                    {/* Register Button */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        <Text style={styles.registerButtonText}>
                            Create Account
                        </Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            Already have an account?{" "}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By creating an account, you agree to use the app
                        responsibly for attendance tracking
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    form: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
    },
    picker: {
        color: COLORS.text,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontStyle: "italic",
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        marginTop: 4,
    },
    globalErrorContainer: {
        backgroundColor: "#FFF5F5",
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    globalErrorText: {
        color: COLORS.error,
        fontSize: 14,
        textAlign: "center",
    },
    registerButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
    },
    registerButtonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: "600",
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        alignItems: "center",
        marginTop: 40,
        paddingHorizontal: 20,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
    },
});

export default RegisterScreen;
