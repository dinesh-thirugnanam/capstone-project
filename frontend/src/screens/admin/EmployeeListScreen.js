import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../services/api';

export default function EmployeeListScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/company');
      // Filter only employees (not admins)
      const employeeList = response.data.users?.filter(u => u.role === 'employee') || [];
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-800 font-semibold text-lg">
            {item.first_name} {item.last_name}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">{item.email}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          item.is_active ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <Text className={`text-xs font-semibold ${
            item.is_active ? 'text-green-700' : 'text-gray-500'
          }`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {item.employee_id && (
        <View className="bg-gray-50 rounded-lg p-3 mb-2">
          <Text className="text-gray-500 text-xs">Employee ID</Text>
          <Text className="text-gray-800 font-mono text-sm">{item.employee_id}</Text>
        </View>
      )}

      <View className="flex-row justify-between items-center mt-2">
        <View>
          {item.department && (
            <Text className="text-gray-600 text-sm">
              🏢 {item.department}
            </Text>
          )}
          {item.phone_number && (
            <Text className="text-gray-600 text-sm mt-1">
              📞 {item.phone_number}
            </Text>
          )}
        </View>
        <Text className="text-gray-400 text-xs">
          Joined {formatDate(item.created_at)}
        </Text>
      </View>

      {/* Quick Action Button */}
      <TouchableOpacity
        className="bg-blue-100 rounded-lg py-2 mt-3 items-center"
        onPress={() => {
          // TODO: Navigate to user's attendance detail
          navigation.navigate('AllAttendance');
        }}
      >
        <Text className="text-blue-600 font-semibold text-sm">
          View Attendance
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Text className="text-gray-400 text-lg">No employees yet</Text>
      <Text className="text-gray-400 text-sm mt-2">Employees will appear here</Text>
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
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Employees</Text>
            <Text className="text-blue-200 mt-1">{employees.length} total</Text>
          </View>
          <TouchableOpacity
            className="bg-blue-700 rounded-lg px-4 py-2"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={employees}
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
