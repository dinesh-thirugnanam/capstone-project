import './global.css';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import MapScreen from './src/screens/MapScreen';

// Admin screens
import AdminDashboard from './src/screens/admin/AdminDashboard';
import ManageGeofencesScreen from './src/screens/admin/ManageGeofencesScreen';
import CreateGeofenceScreen from './src/screens/admin/CreateGeofenceScreen';
import AllAttendanceScreen from './src/screens/admin/AllAttendanceScreen';
import EmployeeListScreen from './src/screens/admin/EmployeeListScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === 'admin' ? (
            // Admin Flow
            <>
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              <Stack.Screen name="ManageGeofences" component={ManageGeofencesScreen} />
              <Stack.Screen name="CreateGeofence" component={CreateGeofenceScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="AllAttendance" component={AllAttendanceScreen} />
              <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
            </>
          ) : (
            // Employee Flow
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Attendance" component={AttendanceScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
