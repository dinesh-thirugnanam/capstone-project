import { useEffect } from "react";
import { AppState, LogBox, StatusBar, AppStateStatus } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Stack } from "expo-router";

// Context Providers
import AuthProvider from "../src/context/AuthContext";

// Services
import NotificationService from "../src/services/notifications";

// Constants
import { COLORS } from "../src/utils/constants";

// Suppress specific warnings for development
LogBox.ignoreLogs([
    "Non-serializable values were found in the navigation state",
    "Warning: Cannot update a component",
]);

export default function RootLayout() {
    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            NotificationService.handleAppStateChange(nextAppState);
        };

        const subscription = AppState.addEventListener(
            "change",
            handleAppStateChange
        );
        return () => subscription?.remove();
    }, []);

    // Initialize notifications
    useEffect(() => {
        NotificationService.initialize();
    }, []);

    return (
        <PaperProvider>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.primary}
                translucent={false}
            />
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(admin)" />
                    <Stack.Screen name="(employee)" />
                </Stack>
            </AuthProvider>
        </PaperProvider>
    );
}
