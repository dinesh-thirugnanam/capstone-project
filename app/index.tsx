import { useRouter } from "expo-router";
import { useEffect } from "react";
import LoadingSpinner from "../src/components/LoadingSpinner";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth() as any;
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated && user) {
                // Since backend doesn't have role field, default to employee dashboard
                // Admin access will be through the temporary role switcher
                console.log("🎯 Navigating to employee dashboard");
                router.replace("/(employee)/dashboard");
            } else {
                // User not logged in, navigate to login
                console.log("🔑 Not authenticated, navigating to login");
                router.replace("/(auth)/login");
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    return <LoadingSpinner message="Loading..." />;
}
