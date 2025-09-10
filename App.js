import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AppState, LogBox, StatusBar } from "react-native";
import { PaperProvider } from "react-native-paper";

// Context Providers
import AuthProvider, { useAuth } from "./src/context/AuthContext";
import GeofenceProvider from "./src/context/GeofenceContext";

// Services
import NotificationService from "./src/services/notifications";

// Constants
import { COLORS } from "./src/utils/constants";

// Suppress specific warnings for development
LogBox.ignoreLogs([
    "Non-serializable values were found in the navigation state",
    "Warning: Cannot update a component",
]);

// Main App Navigation Logic
const AppNavigator = () => {
    const { user, isLoading, isAuthenticated, isAdmin, isEmployee } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    // Handle navigation based on auth state
    useEffect(() => {
        if (isLoading) return; // Wait for auth to load

        const inAuthGroup = segments[0] === "(auth)";
        const inAdminGroup = segments[0] === "(admin)";
        const inEmployeeGroup = segments[0] === "(employee)";

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace("/(auth)/login");
        } else if (isAuthenticated) {
            if (isAdmin() && !inAdminGroup) {
                // Redirect admin to admin dashboard
                router.replace("/(admin)/dashboard");
            } else if (isEmployee() && !inEmployeeGroup) {
                // Redirect employee to employee dashboard
                router.replace("/(employee)/dashboard");
            } else if (inAuthGroup) {
                // If authenticated but still in auth group, redirect based on role
                if (isAdmin()) {
                    router.replace("/(admin)/dashboard");
                } else if (isEmployee()) {
                    router.replace("/(employee)/dashboard");
                }
            }
        }
    }, [isAuthenticated, isLoading, segments, router, isAdmin, isEmployee, user]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
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

    // For employees, wrap with GeofenceProvider
    if (isAuthenticated && isEmployee()) {
        return (
            <GeofenceProvider>
                <Slot />
            </GeofenceProvider>
        );
    }

    return <Slot />;
};

// Main App Component
export default function App() {
    return (
        <PaperProvider>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.primary}
                translucent={false}
            />
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </PaperProvider>
    );
}
