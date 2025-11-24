import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import MapView, { Circle, Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';

export default function CreateGeofenceScreen({ navigation }) {
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  
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

  const [geofenceType, setGeofenceType] = useState('circle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonCoords, setPolygonCoords] = useState([]);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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
    const coord = e.nativeEvent.coordinate; // Extract immediately to avoid synthetic event nullification

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (geofenceType === 'circle') {
        setGeofence({ ...geofence, latitude: coord.latitude, longitude: coord.longitude });
        setPolygonCoords([]);
      } else {
        // Check if tapping near an existing point (within 50m) to remove
        const existingIndex = polygonCoords.findIndex(existingCoord =>
          haversineDistance(existingCoord.latitude, existingCoord.longitude, coord.latitude, coord.longitude) < 50
        );

        if (existingIndex !== -1) {
          // Remove the point
          const newCoords = polygonCoords.filter((_, i) => i !== existingIndex);
          setPolygonCoords(newCoords);
          if (newCoords.length === 0) setIsDrawing(false);
        } else if (polygonCoords.length < 10) {
          // Add new point
          if (polygonCoords.length === 0) setIsDrawing(true);
          setPolygonCoords([...polygonCoords, coord]);
        }
      }
    }, 200); // 200ms debounce
  };

  const handleMarkerDrag = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setGeofence({ ...geofence, latitude, longitude });
  };

  const handlePolygonPointDrag = (index, e) => {
    const coord = e.nativeEvent.coordinate;
    const newCoords = [...polygonCoords];
    newCoords[index] = coord;
    setPolygonCoords(newCoords);
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

    if (geofenceType === 'polygon' && polygonCoords.length < 3) {
      Alert.alert('Error', 'Polygon must have at least 3 points');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: geofence.name,
        description: geofence.description,
        address: geofence.address,
        workingHours: { start: geofence.startTime, end: geofence.endTime },
        workingDays: selectedDays,
        geofence_type: geofenceType,
      };

      if (geofenceType === 'circle') {
        payload.latitude = geofence.latitude;
        payload.longitude = geofence.longitude;
        payload.radius = parseInt(geofence.radius);
      } else {
        payload.polygon = polygonCoords.map(c => [c.longitude, c.latitude]);
      }

      await api.post('/geofences/create', payload);

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
            <View className="flex-row items-center space-x-3 mt-2">
              <TouchableOpacity
                onPress={() => {
                  setGeofenceType('circle');
                  setPolygonCoords([]);
                  setIsDrawing(false);
                }}
                className={`px-4 py-2 rounded-lg ${geofenceType === 'circle' ? 'bg-white' : 'bg-blue-700'}`}
              >
                <Text className={geofenceType === 'circle' ? 'text-blue-600' : 'text-white'}>Circle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setGeofenceType('polygon');
                }}
                className={`px-4 py-2 rounded-lg ${geofenceType === 'polygon' ? 'bg-white' : 'bg-blue-700'}`}
              >
                <Text className={geofenceType === 'polygon' ? 'text-blue-600' : 'text-white'}>Polygon</Text>
              </TouchableOpacity>
            </View>
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
            {geofenceType === 'circle' ? (
              <>
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
              </>
            ) : (
              <>
                {polygonCoords.length > 0 && (
                  <>
                    <Polygon
                      coordinates={polygonCoords}
                      strokeColor="#2563eb"
                      fillColor="rgba(37, 99, 235, 0.5)"
                      strokeWidth={3}
                    />
                    {polygonCoords.map((coord, index) => (
                      <Marker key={index} coordinate={coord} pinColor="red" draggable onDragEnd={(e) => handlePolygonPointDrag(index, e)}>
                        <View className="bg-white px-2 py-1 rounded">
                          <Text className="text-xs font-bold">{index + 1}</Text>
                        </View>
                      </Marker>
                    ))}
                  </>
                )}
              </>
            )}
          </MapView>
          {isDrawing && polygonCoords.length > 2 && (
            <View className="absolute top-20 left-4 right-4 z-10">
              <TouchableOpacity
                className="bg-green-600 py-3 rounded-lg"
                onPress={() => {
                  setIsDrawing(false);
                  setGeofence({ ...geofence, polygon: polygonCoords });
                }}
              >
                <Text className="text-white text-center font-bold">Finish Polygon ({polygonCoords.length} points)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-600 py-2 rounded-lg mt-2"
                onPress={() => {
                  setPolygonCoords([]);
                  setIsDrawing(false);
                }}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          {geofenceType === 'polygon' && (
            <View className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-lg">
              <Text className="text-white text-sm">
                {polygonCoords.length === 0 ? 'Tap to start drawing (max 10 points)' : `Tap to add/remove point (${polygonCoords.length}/10)`}
              </Text>
            </View>
          )}
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
            <Text className="text-gray-700 font-semibold mb-2">📍 {geofenceType === 'circle' ? 'Coordinates' : 'Polygon Points'}</Text>
            {geofenceType === 'circle' ? (
              <>
                <Text className="text-gray-600 font-mono text-xs">
                  Lat: {geofence.latitude.toFixed(6)}, Long: {geofence.longitude.toFixed(6)}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Drag the marker or tap on the map to adjust
                </Text>
              </>
            ) : (
              <>
                <Text className="text-gray-600 font-mono text-xs">
                  Points: {polygonCoords.length}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Drag points or tap map to add more
                </Text>
              </>
            )}
          </View>

          {polygonCoords.length > 0 && geofenceType === 'polygon' && (
            <TouchableOpacity
              className="bg-red-500 rounded-xl py-3 mb-4 items-center"
              onPress={() => setPolygonCoords([])}
            >
              <Text className="text-white font-bold">Clear Polygon</Text>
            </TouchableOpacity>
          )}

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
