import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({
    geofences: 0,
    employees: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch each endpoint separately with error handling
      let geofencesCount = 0;
      let employeesCount = 0;
      let todayAttendanceCount = 0;

      try {
        const geofencesRes = await api.get('/geofences');
        geofencesCount = geofencesRes.data.geofences?.length || 0;
      } catch (error) {
        console.error('Error fetching geofences:', error);
      }

      try {
        const usersRes = await api.get('/users/company');
        employeesCount = usersRes.data.users?.filter(u => u.role === 'employee').length || 0;
      } catch (error) {
        console.error('Error fetching users:', error);
      }

      try {
        const attendanceRes = await api.get('/attendance/company');
        const today = new Date().toDateString();
        todayAttendanceCount = attendanceRes.data.attendance?.filter(a => {
          return new Date(a.timestamp).toDateString() === today;
        }).length || 0;
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }

      setStats({
        geofences: geofencesCount,
        employees: employeesCount,
        todayAttendance: todayAttendanceCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Admin Dashboard</Text>
            <Text className="text-blue-200 mt-1">{user?.email}</Text>
          </View>
          <TouchableOpacity
            className="bg-blue-700 rounded-lg px-4 py-2"
            onPress={logout}
          >
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View className="px-6 mt-6">
        <View className="flex-row justify-between mb-4">
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mr-2">
            <Text className="text-gray-500 text-sm">Total Employees</Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">{stats.employees}</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1 ml-2">
            <Text className="text-gray-500 text-sm">Active Geofences</Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">{stats.geofences}</Text>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <Text className="text-gray-500 text-sm">Today's Attendance Events</Text>
          <Text className="text-3xl font-bold text-gray-800 mt-1">{stats.todayAttendance}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6">
        <Text className="text-gray-700 font-semibold text-lg mb-4">Quick Actions</Text>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-3"
          onPress={() => navigation.navigate('ManageGeofences')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">Manage Geofences</Text>
            <Text className="text-gray-500 text-sm mt-1">View, edit, or delete locations</Text>
          </View>
          <Text className="text-blue-600 text-2xl">📍</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-3"
          onPress={() => navigation.navigate('CreateGeofence')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">Create New Geofence</Text>
            <Text className="text-gray-500 text-sm mt-1">Add a new office location</Text>
          </View>
          <Text className="text-blue-600 text-2xl">➕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-3"
          onPress={() => navigation.navigate('AllAttendance')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">View All Attendance</Text>
            <Text className="text-gray-500 text-sm mt-1">Company-wide attendance records</Text>
          </View>
          <Text className="text-blue-600 text-2xl">📋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-3"
          onPress={() => navigation.navigate('EmployeeList')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">Employee List</Text>
            <Text className="text-gray-500 text-sm mt-1">View all company employees</Text>
          </View>
          <Text className="text-blue-600 text-2xl">👥</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm flex-row justify-between items-center mb-6"
          onPress={() => navigation.navigate('Map')}
        >
          <View>
            <Text className="text-gray-800 font-semibold text-lg">View Geofences Map</Text>
            <Text className="text-gray-500 text-sm mt-1">See all locations on map</Text>
          </View>
          <Text className="text-blue-600 text-2xl">🗺️</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
