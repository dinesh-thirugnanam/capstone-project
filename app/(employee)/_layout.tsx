import { Stack } from "expo-router";
import GeofenceProvider from "../../src/context/GeofenceContext";

export default function EmployeeLayout() {
    return (
        <GeofenceProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="dashboard" />
            </Stack>
        </GeofenceProvider>
    );
}
