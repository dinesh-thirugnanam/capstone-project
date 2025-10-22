import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';

export default function CreateGeofenceScreen({ navigation }) {
  const mapRef = useRef(null);
  
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [geofence, setGeofence] = useState({
    name: '',
    description: '',
    latitude: 12.9716,
    longitude: 77.5946,
    radius: 200,
    address: '',
    startTime: '09:00',
    endTime: '18:00',
  });

  const [workingDays, setWorkingDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setGeofence({
        ...geofence,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setGeofence({ ...geofence, latitude, longitude });
  };

  const handleMarkerDrag = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setGeofence({ ...geofence, latitude, longitude });
  };

  const toggleWorkingDay = (day) => {
    setWorkingDays({ ...workingDays, [day]: !workingDays[day] });
  };

  const set24Hours = () => {
    setGeofence({ ...geofence, startTime: '00:00', endTime: '23:59' });
    setWorkingDays({
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true,
      Sunday: true,
    });
  };

  const handleCreate = async () => {
    if (!geofence.name.trim()) {
      Alert.alert('Error', 'Geofence name is required');
      return;
    }

    if (geofence.radius < 50 || geofence.radius > 5000) {
      Alert.alert('Error', 'Radius must be between 50 and 5000 meters');
      return;
    }

    const selectedDays = Object.keys(workingDays).filter(day => workingDays[day]);
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'At least one working day must be selected');
      return;
    }

    setLoading(true);

    try {
      await api.post('/geofences/create', {
        name: geofence.name,
        description: geofence.description,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radius: parseInt(geofence.radius),
        address: geofence.address,
        workingHours: { 
          start: geofence.startTime, 
          end: geofence.endTime 
        },
        workingDays: selectedDays,
      });

      Alert.alert('Success', 'Geofence created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to create geofence:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create geofence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Create Geofence</Text>
            <Text className="text-blue-200 mt-1">Tap map to set location</Text>
          </View>
          <TouchableOpacity
            className="bg-blue-700 rounded-lg px-4 py-2"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Map */}
        <View style={{ height: 300 }} className="mx-4 mt-4 rounded-xl overflow-hidden shadow-lg">
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={{
                latitude: geofence.latitude,
                longitude: geofence.longitude,
              }}
              draggable
              onDragEnd={handleMarkerDrag}
              title={geofence.name || "New Geofence"}
              pinColor="blue"
            />
            
            <Circle
              center={{
                latitude: geofence.latitude,
                longitude: geofence.longitude,
              }}
              radius={geofence.radius}
              strokeColor="rgba(37, 99, 235, 0.5)"
              fillColor="rgba(37, 99, 235, 0.2)"
              strokeWidth={2}
            />
          </MapView>
        </View>

        {/* Form */}
        <View className="p-6">
          {/* Name */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-700 font-semibold mb-2">Geofence Name *</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
              placeholder="Main Office"
              value={geofence.name}
              onChangeText={(text) => setGeofence({ ...geofence, name: text })}
            />
          </View>

          {/* Description */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-700 font-semibold mb-2">Description</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
              placeholder="Headquarters building (optional)"
              value={geofence.description}
              onChangeText={(text) => setGeofence({ ...geofence, description: text })}
              multiline
            />
          </View>

          {/* Radius */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-700 font-semibold mb-2">Radius (meters) *</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
              placeholder="200"
              value={geofence.radius.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                setGeofence({ ...geofence, radius: num });
              }}
              keyboardType="numeric"
            />
            <Text className="text-gray-500 text-xs mt-2">Between 50 and 5000 meters</Text>
          </View>

          {/* Address */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-700 font-semibold mb-2">Address</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
              placeholder="123 Street, City (optional)"
              value={geofence.address}
              onChangeText={(text) => setGeofence({ ...geofence, address: text })}
            />
          </View>

          {/* Working Hours */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-semibold">Working Hours</Text>
              <TouchableOpacity
                className="bg-blue-100 rounded-lg px-3 py-1"
                onPress={set24Hours}
              >
                <Text className="text-blue-600 font-semibold text-xs">24/7</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-gray-600 text-sm mb-2">Start Time</Text>
                <TextInput
                  className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
                  placeholder="09:00"
                  value={geofence.startTime}
                  onChangeText={(text) => setGeofence({ ...geofence, startTime: text })}
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-600 text-sm mb-2">End Time</Text>
                <TextInput
                  className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
                  placeholder="18:00"
                  value={geofence.endTime}
                  onChangeText={(text) => setGeofence({ ...geofence, endTime: text })}
                />
              </View>
            </View>
            <Text className="text-gray-500 text-xs mt-2">Format: HH:MM (24-hour)</Text>
          </View>

          {/* Working Days */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-700 font-semibold mb-3">Working Days</Text>
            <View className="flex-row flex-wrap">
              {Object.keys(workingDays).map((day) => (
                <TouchableOpacity
                  key={day}
                  className={`rounded-lg px-3 py-2 mr-2 mb-2 ${
                    workingDays[day] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onPress={() => toggleWorkingDay(day)}
                >
                  <Text className={`font-semibold text-sm ${
                    workingDays[day] ? 'text-white' : 'text-gray-600'
                  }`}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Coordinates Display */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-700 font-semibold mb-2">📍 Coordinates</Text>
            <Text className="text-gray-600 font-mono text-xs">
              Lat: {geofence.latitude.toFixed(6)}, Long: {geofence.longitude.toFixed(6)}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              Drag the marker or tap on the map to adjust
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-xl py-4 items-center mr-2"
              onPress={getCurrentLocation}
            >
              <Text className="text-gray-700 font-bold text-base">📍 Use My Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-xl py-4 items-center ml-2"
              onPress={handleCreate}
              disabled={loading}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Creating...' : 'Create Geofence'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
