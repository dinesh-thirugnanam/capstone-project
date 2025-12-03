import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../services/api';

export default function AllAttendanceScreen({ navigation }) {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, enter, exit

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, attendance]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/company');
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredAttendance(attendance);
    } else {
      setFilteredAttendance(
        attendance.filter(item => item.event_type.toLowerCase() === filter)
      );
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
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-800 font-semibold text-base">
            {item.first_name} {item.last_name}
          </Text>
          <Text className="text-gray-500 text-sm">{item.user_email}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          item.event_type === 'ENTER' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Text className={`font-semibold text-xs ${
            item.event_type === 'ENTER' ? 'text-green-700' : 'text-red-700'
          }`}>
            {item.event_type}
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-between items-center mt-2">
        <View>
          <Text className="text-gray-600 text-sm">
            {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
          </Text>
          {item.geofence_name && (
            <Text className="text-gray-500 text-xs mt-1">
              📍 {item.geofence_name}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Text className="text-gray-400 text-lg">No attendance records</Text>
      <Text className="text-gray-400 text-sm mt-2">
        {filter !== 'all' ? 'Try changing the filter' : 'Records will appear here'}
      </Text>
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
      <View className="bg-blue-600 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">All Attendance</Text>
            <Text className="text-blue-200 mt-1">
              {filteredAttendance.length} records
            </Text>
          </View>
          <TouchableOpacity
            className="bg-blue-700 rounded-lg px-4 py-2"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-gray-700 font-semibold mb-3">Filter by Event</Text>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg mr-2 ${
              filter === 'all' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            onPress={() => setFilter('all')}
          >
            <Text className={`font-semibold ${
              filter === 'all' ? 'text-white' : 'text-gray-700'
            }`}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-4 py-2 rounded-lg mr-2 ${
              filter === 'enter' ? 'bg-green-600' : 'bg-gray-200'
            }`}
            onPress={() => setFilter('enter')}
          >
            <Text className={`font-semibold ${
              filter === 'enter' ? 'text-white' : 'text-gray-700'
            }`}>
              Enter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${
              filter === 'exit' ? 'bg-red-600' : 'bg-gray-200'
            }`}
            onPress={() => setFilter('exit')}
          >
            <Text className={`font-semibold ${
              filter === 'exit' ? 'text-white' : 'text-gray-700'
            }`}>
              Exit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredAttendance}
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
