import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'http://10.183.77.161:5000/api'; // Change to your computer's local IP
const API_URL = 'http://192.168.0.101:5000/api'; // Change to your computer's local IP

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Location tracking
export const trackLocation = async (latitude, longitude, accuracy) => {
  const response = await api.post('/locations/track', {
    latitude,
    longitude,
    accuracy,
  });
  return response.data;
};

// Attendance
export const getMyAttendance = async () => {
  const response = await api.get('/attendance/my');
  return response.data;
};

// Geofences
export const getGeofences = async () => {
  const response = await api.get('/geofences');
  return response.data;
};

export default api;