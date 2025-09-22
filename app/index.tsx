import { useRouter } from "expo-router";
import { useEffect } from "react";
import LoadingSpinner from "../src/components/LoadingSpinner";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
    const authContext = useAuth() as any; // Temporary type fix
    const { isAuthenticated, isLoading, user } = authContext;
    const router = useRouter();

    // Debug logging
    console.log('🔍 Index.tsx - Auth State:', { isAuthenticated, isLoading, user: user ? { id: user.id, role: user.role } : null });

    useEffect(() => {
        console.log('🔄 Index.tsx useEffect triggered');
        console.log('📊 Current state:', { isLoading, isAuthenticated, user: user ? { id: user.id, role: user.role } : null });
        
        if (!isLoading) {
            console.log('✅ Loading completed, determining navigation...');
            if (isAuthenticated && user) {
                // Navigate based on user role
                console.log('🔀 User is authenticated, navigating to dashboard. Role:', user.role);
                if (user.role === 'admin') {
                    console.log('🎯 Navigating to admin dashboard');
                    router.replace('/(admin)/dashboard');
                } else {
                    console.log('🎯 Navigating to employee dashboard');
                    router.replace('/(employee)/dashboard');
                }
            } else {
                // Not authenticated, navigate to login
                console.log('🔀 User not authenticated, navigating to login');
                console.log('🔍 Auth details:', { isAuthenticated, user });
                router.replace('/(auth)/login');
            }
        } else {
            console.log('⏳ Still loading, waiting...');
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Show loading while auth state is being determined
    return <LoadingSpinner message="Loading..." />;
}
