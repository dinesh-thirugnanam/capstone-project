import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('emp1@techcorp.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center px-6">
      <View className="bg-white rounded-2xl p-8 shadow-lg">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</Text>
        <Text className="text-gray-500 mb-8">Sign in to track your attendance</Text>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Email</Text>
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            placeholder="your.email@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Password</Text>
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-center mt-6 text-sm">
          Test: emp1@techcorp.com / password123
        </Text>
      </View>
    </View>
  );
}
