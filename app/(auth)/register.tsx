import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, USER_ROLES } from '../../src/utils/constants';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState(USER_ROLES.EMPLOYEE);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth() as any;
    const router = useRouter();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await register(email, password, role);
            if (result.success) {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(auth)/login') }
                ]);
            } else {
                Alert.alert('Registration Failed', result.error || 'Failed to create account');
            }
        } catch (error) {
            Alert.alert('Error', 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="headlineMedium" style={styles.title}>
                    Create Account
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Join the attendance system
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
                        
                        <TextInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        <Text variant="bodyMedium" style={styles.sectionTitle}>
                            Account Type
                        </Text>
                        
                        <RadioButton.Group 
                            onValueChange={value => setRole(value)} 
                            value={role}
                        >
                            <View style={styles.radioOption}>
                                <RadioButton value={USER_ROLES.EMPLOYEE} />
                                <Text variant="bodyMedium">Employee</Text>
                            </View>
                            <View style={styles.radioOption}>
                                <RadioButton value={USER_ROLES.ADMIN} />
                                <Text variant="bodyMedium">Admin</Text>
                            </View>
                        </RadioButton.Group>
                        
                        <Button 
                            mode="contained" 
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                        >
                            Create Account
                        </Button>
                        
                        <Button 
                            mode="text" 
                            onPress={() => router.push('/(auth)/login')}
                            style={styles.linkButton}
                        >
                            Already have an account? Sign in
                        </Button>
                    </Card.Content>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
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
    sectionTitle: {
        marginTop: 8,
        marginBottom: 12,
        fontWeight: '600',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    button: {
        marginVertical: 16,
    },
    linkButton: {
        marginTop: 8,
    },
});
