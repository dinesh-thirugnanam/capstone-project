import { createContext, useContext, useEffect, useState } from "react";
import ApiService from "../services/api";
import { USER_ROLES } from "../utils/constants";
import { tokenManager, userDataManager } from "../utils/helpers";

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check for stored token and user data
            const [token, userData] = await Promise.all([
                tokenManager.getToken(),
                userDataManager.getUserData(),
            ]);

            if (token && userData) {
                // Verify token with server
                try {
                    const profileResponse = await ApiService.getProfile();
                    if (profileResponse.success) {
                        setUser(profileResponse.data.user);
                        setIsAuthenticated(true);
                        console.log("✅ Auth restored from storage");
                    } else {
                        // Token is invalid, clear storage
                        await clearAuthData();
                    }
                } catch (error) {
                    console.warn(
                        "⚠️ Token verification failed:",
                        error.message
                    );
                    await clearAuthData();
                }
            }
        } catch (error) {
            console.error("❌ Auth initialization error:", error);
            await clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const clearAuthData = async () => {
        try {
            await Promise.all([
                tokenManager.removeToken(),
                userDataManager.removeUserData(),
            ]);
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
        } catch (error) {
            console.error("❌ Error clearing auth data:", error);
        }
    };

    const register = async (email, password, role = USER_ROLES.EMPLOYEE) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await ApiService.register(email, password, role);

            if (response.success) {
                const { user: userData, token } = response.data;

                // Store auth data
                await Promise.all([
                    tokenManager.saveToken(token),
                    userDataManager.saveUserData(userData),
                ]);

                setUser(userData);
                setIsAuthenticated(true);

                console.log("✅ User registered successfully");
                return { success: true, user: userData };
            } else {
                throw new Error(response.message || "Registration failed");
            }
        } catch (error) {
            const errorMessage = error.message || "Registration failed";
            setError(errorMessage);
            console.error("❌ Registration error:", error);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await ApiService.login(email, password);

            if (response.success) {
                const { user: userData, token } = response.data;

                // Store auth data
                await Promise.all([
                    tokenManager.saveToken(token),
                    userDataManager.saveUserData(userData),
                ]);

                setUser(userData);
                setIsAuthenticated(true);

                console.log("✅ User logged in successfully");
                return { success: true, user: userData };
            } else {
                throw new Error(response.message || "Login failed");
            }
        } catch (error) {
            const errorMessage = error.message || "Login failed";
            setError(errorMessage);
            console.error("❌ Login error:", error);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await clearAuthData();
            console.log("✅ User logged out successfully");
            return { success: true };
        } catch (error) {
            console.error("❌ Logout error:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        try {
            const response = await ApiService.getProfile();
            if (response.success) {
                const userData = response.data.user;
                await userDataManager.saveUserData(userData);
                setUser(userData);
                return { success: true, user: userData };
            } else {
                throw new Error("Failed to refresh profile");
            }
        } catch (error) {
            console.error("❌ Profile refresh error:", error);
            return { success: false, error: error.message };
        }
    };

    const clearError = () => {
        setError(null);
    };

    // Helper methods
    const isAdmin = () => {
        return user?.role === USER_ROLES.ADMIN;
    };

    const isEmployee = () => {
        return user?.role === USER_ROLES.EMPLOYEE;
    };

    const getUserRole = () => {
        return user?.role || null;
    };

    const contextValue = {
        // State
        user,
        isLoading,
        isAuthenticated,
        error,

        // Actions
        register,
        login,
        logout,
        refreshProfile,
        clearError,

        // Helper methods
        isAdmin,
        isEmployee,
        getUserRole,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthProvider;
