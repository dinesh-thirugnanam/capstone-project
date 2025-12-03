import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function ManageGeofencesScreen({ navigation }) {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/geofences');
      setGeofences(response.data.geofences || []);
    } catch (error) {
      console.error('Error fetching geofences:', error);
      Alert.alert('Error', 'Failed to load geofences');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGeofences();
  };

  const handleDelete = (geofence) => {
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete "${geofence.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/geofences/${geofence.id}`);
              Alert.alert('Success', 'Geofence deleted');
              fetchGeofences();
            } catch (error) {
              console.error('Error deleting geofence:', error);
              Alert.alert('Error', 'Failed to delete geofence');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-800 font-semibold text-lg">{item.name}</Text>
          {item.description && (
            <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
          )}
        </View>
        <View className={`px-3 py-1 rounded-full ${item.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Text className={`text-xs font-semibold ${item.is_active ? 'text-green-700' : 'text-gray-500'}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View className="bg-gray-50 rounded-lg p-3 mb-3">
        <Text className="text-gray-500 text-xs mb-1">Location</Text>
        <Text className="text-gray-700 font-mono text-xs">
          {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
        </Text>
        {item.address && (
          <Text className="text-gray-600 text-sm mt-1">📍 {item.address}</Text>
        )}
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-gray-500 text-xs">Radius</Text>
          <Text className="text-gray-800 font-semibold">{item.radius}m</Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity
            className="bg-blue-100 rounded-lg px-4 py-2 mr-2"
            onPress={() => {
              Alert.alert('View on Map', 'This will open the map centered on this geofence');
              // TODO: Navigate to map view with this geofence highlighted
            }}
          >
            <Text className="text-blue-600 font-semibold">View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-100 rounded-lg px-4 py-2"
            onPress={() => handleDelete(item)}
          >
            <Text className="text-red-600 font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Text className="text-gray-400 text-lg">No geofences yet</Text>
      <Text className="text-gray-400 text-sm mt-2">Create one to get started</Text>
      <TouchableOpacity
        className="bg-blue-600 rounded-xl px-6 py-3 mt-4"
        onPress={() => navigation.navigate('CreateGeofence')}
      >
        <Text className="text-white font-semibold">Create Geofence</Text>
      </TouchableOpacity>
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
            <Text className="text-white text-2xl font-bold">Manage Geofences</Text>
            <Text className="text-blue-200 mt-1">{geofences.length} locations</Text>
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
        data={geofences}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Action Button */}
      {geofences.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-14 h-14 justify-center items-center shadow-lg"
          onPress={() => navigation.navigate('CreateGeofence')}
        >
          <Text className="text-white text-3xl">+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
