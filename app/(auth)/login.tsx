import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/utils/constants";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth() as any;
    const router = useRouter();

    // Debug logging
    console.log("🔑 LoginScreen rendered at", new Date().toLocaleTimeString());

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            console.log("🔐 Login button pressed, calling auth.login()");
            const result = await login(email, password);
            console.log("📡 Login result received:", result);

            if (result.success) {
                console.log("✅ Login successful! User:", result.user);
                console.log(
                    "🔄 Navigation should be handled by index.tsx based on user role"
                );
                // Don't navigate manually - let index.tsx handle it automatically
            } else {
                console.log("❌ Login failed:", result.error);
                Alert.alert(
                    "Login Failed",
                    result.error || "Invalid credentials"
                );
            }
        } catch (error) {
            console.log("💥 Login error caught:", error);
            Alert.alert("Error", "Login failed. Please try again.");
        } finally {
            setLoading(false);
            console.log("🏁 Login process completed");
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Attendance App
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Sign in to continue
                </Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                        >
                            Sign In
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => router.push("/(auth)/register")}
                            style={styles.linkButton}
                        >
                            Don't have an account? Sign up
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: "center",
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
        marginBottom: 32,
        color: COLORS.text,
    },
    card: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginVertical: 8,
    },
    linkButton: {
        marginTop: 8,
    },
});
