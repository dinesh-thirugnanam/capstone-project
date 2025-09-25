import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/utils/constants';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth() as any;
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                // Navigation will be handled by App.js based on user role
                console.log('Login successful, navigation will be handled automatically');
            } else {
                Alert.alert('Login Failed', result.error || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Error', 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Attendance App
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Sign in to continue
                </Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                        
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />
                        
                        <Button 
                            mode="contained" 
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                        >
                            Sign In
                        </Button>
                        
                        <Button 
                            mode="text" 
                            onPress={() => router.push('/(auth)/register')}
                            style={styles.linkButton}
                        >
                            Don't have an account? Sign up
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        color: COLORS.text,
    },
    card: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginVertical: 8,
    },
    linkButton: {
        marginTop: 8,
    },
});
