import React, { useEffect } from 'react';
import { StatusBar, AppState, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';

// Context Providers
import AuthProvider, { useAuth } from './src/context/AuthContext';
import GeofenceProvider from './src/context/GeofenceContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import EmployeeDashboard from './src/screens/employee/EmployeeDashboard';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import LoadingSpinner from './src/components/LoadingSpinner';

// Services
import NotificationService from './src/services/notifications';

// Constants
import { COLORS } from './src/utils/constants';

// Suppress specific warnings for development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Warning: Cannot update a component',
]);

const Stack = createStackNavigator();

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background }
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Employee Stack
const EmployeeStack = () => (
  <Stack.Navigator
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background }
    }}
  >
    <Stack.Screen name="Dashboard" component={EmployeeDashboard} />
  </Stack.Navigator>
);

// Admin Stack
const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background }
    }}
  >
    <Stack.Screen name="Dashboard" component={AdminDashboard} />
  </Stack.Navigator>
);

// Main App Navigation
const AppNavigator = () => {
  const { user, isLoading, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      NotificationService.handleAppStateChange(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Initialize notifications
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Route based on user role
  if (isAdmin()) {
    return <AdminStack />;
  } else if (isEmployee()) {
    return (
      <GeofenceProvider>
        <EmployeeStack />
      </GeofenceProvider>
    );
  }

  // Fallback - shouldn't happen
  return <AuthStack />;
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
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}
