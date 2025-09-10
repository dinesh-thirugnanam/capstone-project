# Attendance App - Backend Integration Guide

## 🎯 Overview

Your backend now supports a complete attendance system with geofencing capabilities. Here's how to integrate it with your React Native Expo app.

## 🚀 New Backend Features Added

### 1. **User Management with Roles**
- **Admin users**: Can create and manage geofences (office locations)
- **Employee users**: Automatically track attendance when entering/exiting geofences
- User profiles with employee ID, department, etc.

### 2. **Geofence Management** 
- Create office locations with lat/lng coordinates and radius
- Set working hours and working days for each office
- Multiple office support (headquarters, branches, etc.)

### 3. **Automatic Attendance Tracking**
- Record ENTER/EXIT events when users cross geofence boundaries
- Calculate work session durations
- Track whether events occur during working hours/days
- Real-time attendance status checking

## 📱 Frontend Integration Strategy

### Option 1: Expo + Custom Dev Client (Recommended)

Since you want real geofencing, you'll need:

1. **Setup Custom Dev Client**:
```bash
# In your Expo project
npx expo install expo-dev-client
npx expo prebuild
eas build --profile development --platform ios
eas build --profile development --platform android
```

2. **Add Background Location Tracking**:
```bash
npm install react-native-background-geolocation
# This library provides real geofencing capabilities
```

3. **Configure Geofencing in Your App**:

```javascript
// services/GeofenceService.js
import BackgroundGeolocation from 'react-native-background-geolocation';
import { attendanceAPI } from './api';

export class GeofenceService {
  static async initialize(userToken) {
    // Configure background geolocation
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      enableHeadless: true,
      heartbeatInterval: 60,
      autoSync: true,
      url: 'http://your-backend.com/api/attendance/event',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Listen for geofence events
    BackgroundGeolocation.onGeofence(this.onGeofenceEvent);
  }

  static async addGeofence(geofence) {
    await BackgroundGeolocation.addGeofence({
      identifier: geofence.id,
      radius: geofence.radius,
      latitude: geofence.centerLatitude,
      longitude: geofence.centerLongitude,
      notifyOnEntry: true,
      notifyOnExit: true
    });
  }

  static onGeofenceEvent = async (geofenceEvent) => {
    console.log('Geofence Event:', geofenceEvent);
    
    try {
      // Send to your backend
      await attendanceAPI.recordEvent({
        geofenceId: geofenceEvent.identifier,
        eventType: geofenceEvent.action === 'ENTER' ? 'ENTER' : 'EXIT',
        location: {
          latitude: geofenceEvent.location.coords.latitude,
          longitude: geofenceEvent.location.coords.longitude
        },
        metadata: {
          accuracy: geofenceEvent.location.coords.accuracy,
          source: 'background_geofencing'
        }
      });
    } catch (error) {
      console.error('Failed to record attendance:', error);
    }
  };
}
```

### Option 2: Manual Location Polling (Expo Managed)

If you want to stay in Expo managed workflow:

```javascript
// services/LocationPollingService.js
import * as Location from 'expo-location';
import { attendanceAPI, geofenceAPI } from './api';

export class LocationPollingService {
  constructor() {
    this.geofences = [];
    this.lastKnownStatus = {};
    this.locationSubscription = null;
  }

  async start() {
    // Get geofences from backend
    const response = await geofenceAPI.getAll();
    this.geofences = response.data.geofences;

    // Start location watching
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Check every 30 seconds
        distanceInterval: 25, // Or when moved 25 meters
      },
      this.onLocationUpdate
    );
  }

  onLocationUpdate = async (location) => {
    const { latitude, longitude } = location.coords;
    
    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        geofence.centerLatitude,
        geofence.centerLongitude
      );
      
      const isInside = distance <= geofence.radius;
      const wasInside = this.lastKnownStatus[geofence.id] || false;
      
      if (isInside && !wasInside) {
        // Entered geofence
        await this.recordAttendanceEvent(geofence.id, 'ENTER', { latitude, longitude });
        this.lastKnownStatus[geofence.id] = true;
      } else if (!isInside && wasInside) {
        // Exited geofence
        await this.recordAttendanceEvent(geofence.id, 'EXIT', { latitude, longitude });
        this.lastKnownStatus[geofence.id] = false;
      }
    }
  };

  async recordAttendanceEvent(geofenceId, eventType, location) {
    try {
      await attendanceAPI.recordEvent({
        geofenceId,
        eventType,
        location,
        metadata: {
          source: 'location_polling',
          accuracy: 10
        }
      });
      
      console.log(`📍 ${eventType} event recorded for geofence ${geofenceId}`);
    } catch (error) {
      console.error('Failed to record attendance:', error);
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
```

## 🔌 API Integration

### Authentication Service

```javascript
// services/authAPI.js
const API_BASE = 'http://localhost:3000/api';

export const authAPI = {
  async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  async getProfile(token) {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

### Geofence Management Service

```javascript
// services/geofenceAPI.js
export const geofenceAPI = {
  async create(geofenceData, token) {
    const response = await fetch(`${API_BASE}/geofences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(geofenceData)
    });
    return response.json();
  },

  async getAll(token) {
    const response = await fetch(`${API_BASE}/geofences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async update(id, geofenceData, token) {
    const response = await fetch(`${API_BASE}/geofences/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(geofenceData)
    });
    return response.json();
  }
};
```

### Attendance Service

```javascript
// services/attendanceAPI.js
export const attendanceAPI = {
  async recordEvent(eventData, token) {
    const response = await fetch(`${API_BASE}/attendance/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    return response.json();
  },

  async getHistory(params, token) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/attendance/history?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async getDailySummary(date, token) {
    const response = await fetch(`${API_BASE}/attendance/summary/${date}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async getCurrentStatus(token) {
    const response = await fetch(`${API_BASE}/attendance/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

## 📱 Sample React Native Components

### Admin - Create Office Location

```javascript
// components/CreateOfficeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { geofenceAPI } from '../services/geofenceAPI';

export default function CreateOfficeScreen() {
  const [officeData, setOfficeData] = useState({
    name: '',
    centerLatitude: '',
    centerLongitude: '',
    radius: '100',
    officeInfo: {
      address: '',
      workingHours: { start: '09:00', end: '17:00' },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  });

  const handleSubmit = async () => {
    try {
      const result = await geofenceAPI.create(officeData, userToken);
      if (result.success) {
        alert('Office location created successfully!');
        // Navigate back or reset form
      }
    } catch (error) {
      alert('Failed to create office location');
    }
  };

  return (
    <View>
      <Text>Create Office Location</Text>
      
      <TextInput
        placeholder="Office Name"
        value={officeData.name}
        onChangeText={(text) => setOfficeData({...officeData, name: text})}
      />
      
      <TextInput
        placeholder="Latitude"
        value={officeData.centerLatitude}
        onChangeText={(text) => setOfficeData({...officeData, centerLatitude: parseFloat(text)})}
      />
      
      <TextInput
        placeholder="Longitude" 
        value={officeData.centerLongitude}
        onChangeText={(text) => setOfficeData({...officeData, centerLongitude: parseFloat(text)})}
      />
      
      <Button title="Create Office" onPress={handleSubmit} />
    </View>
  );
}
```

### Employee - Attendance Status

```javascript
// components/AttendanceStatusScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { attendanceAPI } from '../services/attendanceAPI';

export default function AttendanceStatusScreen() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statusResult, historyResult] = await Promise.all([
        attendanceAPI.getCurrentStatus(userToken),
        attendanceAPI.getHistory({ page: 1, limit: 10 }, userToken)
      ]);
      
      setStatus(statusResult.data);
      setHistory(historyResult.data.attendanceHistory);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    }
  };

  return (
    <View>
      <Text>Attendance Status</Text>
      
      {status && (
        <View>
          <Text>Currently in office: {status.isCurrentlyInside ? 'Yes' : 'No'}</Text>
          {status.currentLocations.map((location) => (
            <Text key={location.geofence.id}>
              📍 At {location.geofence.name} since {new Date(location.enteredAt).toLocaleTimeString()}
            </Text>
          ))}
        </View>
      )}
      
      <Text>Recent Activity:</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.eventType} - {item.geofence.name}</Text>
            <Text>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

## 🧪 Testing the Complete Flow

### 1. **Setup Test Data** (Use Postman):

1. Register an admin user
2. Register an employee user  
3. Login as admin and create office geofence
4. Login as employee

### 2. **Simulate Attendance Events**:

```javascript
// Test entering office
await attendanceAPI.recordEvent({
  geofenceId: 'your-geofence-id',
  eventType: 'ENTER',
  location: { latitude: 40.7128, longitude: -74.0060 }
}, userToken);

// Test exiting office
await attendanceAPI.recordEvent({
  geofenceId: 'your-geofence-id', 
  eventType: 'EXIT',
  location: { latitude: 40.7128, longitude: -74.0060 }
}, userToken);
```

### 3. **Check Results**:
- View attendance history
- Check daily summary
- Monitor current status

## 🔄 Backend Monitoring

Your backend will log all attendance events:
```
📍 Attendance Event: employee@company.com entered Main Office at 2024-01-15T09:15:00Z
📍 Attendance Event: employee@company.com exited Main Office at 2024-01-15T17:30:00Z
```

## 🚀 Next Steps

1. **Choose your Expo approach** (Custom Dev Client vs Location Polling)
2. **Implement the API services** in your React Native app
3. **Add location permissions** handling
4. **Create the UI components** for admin and employee roles
5. **Test the complete flow** using the Postman collection
6. **Deploy** your backend and update API URLs

The backend is ready to go! Your server is running on `http://localhost:3000` with all the attendance and geofencing endpoints active. Use the `attendance-app-postman-collection.json` to test all functionality.

Would you like me to help you with any specific part of the frontend integration or have questions about the backend implementation?
