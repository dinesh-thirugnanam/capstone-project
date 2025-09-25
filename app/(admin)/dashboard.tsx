import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/utils/constants';

export default function AdminDashboard() {
    const { user, logout } = useAuth() as any;
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Admin Dashboard
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Welcome, {user?.email}
                </Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Quick Actions
                        </Text>
                        
                        <Button 
                            mode="contained" 
                            style={styles.actionButton}
                            onPress={() => {
                                // TODO: Navigate to office management
                                console.log('Manage Offices pressed');
                            }}
                        >
                            Manage Office Locations
                        </Button>
                        
                        <Button 
                            mode="outlined" 
                            style={styles.actionButton}
                            onPress={() => {
                                // TODO: Navigate to employee reports
                                console.log('View Reports pressed');
                            }}
                        >
                            View Employee Reports
                        </Button>
                        
                        <Button 
                            mode="outlined" 
                            style={styles.actionButton}
                            onPress={() => {
                                // TODO: Navigate to settings
                                console.log('Settings pressed');
                            }}
                        >
                            Settings
                        </Button>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            System Overview
                        </Text>
                        <Text variant="bodyMedium">
                            • Total Employees: 0 (Coming soon)
                        </Text>
                        <Text variant="bodyMedium">
                            • Active Offices: 0 (Coming soon)
                        </Text>
                        <Text variant="bodyMedium">
                            • Today's Check-ins: 0 (Coming soon)
                        </Text>
                    </Card.Content>
                </Card>

                <Button 
                    mode="text" 
                    onPress={handleLogout}
                    style={styles.logoutButton}
                >
                    Logout
                </Button>
            </ScrollView>
            
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {
                    // TODO: Quick add office location
                    console.log('FAB pressed - Add Office');
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
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
        marginBottom: 24,
        color: COLORS.text,
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionButton: {
        marginBottom: 12,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.primary,
    },
});
