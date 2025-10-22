import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { getMyAttendance } from '../services/api';

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await getMyAttendance();
      setAttendance(data.attendance || []);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <View className={`px-3 py-1 rounded-full ${
          item.event_type === 'ENTER' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Text className={`font-semibold ${
            item.event_type === 'ENTER' ? 'text-green-700' : 'text-red-700'
          }`}>
            {item.event_type}
          </Text>
        </View>
        <Text className="text-gray-500 text-sm">{formatDate(item.timestamp)}</Text>
      </View>
      
      <Text className="text-gray-800 font-medium mb-1">
        {formatTime(item.timestamp)}
      </Text>
      
      {item.geofence_name && (
        <Text className="text-gray-600 text-sm">
          📍 {item.geofence_name}
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Text className="text-gray-400 text-lg">No attendance records yet</Text>
      <Text className="text-gray-400 text-sm mt-2">Start tracking to log attendance</Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <Text className="text-white text-2xl font-bold">Attendance History</Text>
        <Text className="text-blue-200 mt-1">{attendance.length} records</Text>
      </View>

      {/* List */}
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
