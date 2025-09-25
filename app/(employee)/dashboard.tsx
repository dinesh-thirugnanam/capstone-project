import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/utils/constants';

export default function EmployeeDashboard() {
    const { user, logout } = useAuth() as any;
    const router = useRouter();
    const [attendanceStatus, setAttendanceStatus] = useState('out'); // 'in' or 'out'
    const [todayHours, setTodayHours] = useState('0h 0m');

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const handleManualCheckIn = () => {
        // TODO: Implement manual check-in
        console.log('Manual check-in pressed');
        setAttendanceStatus(attendanceStatus === 'in' ? 'out' : 'in');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Employee Dashboard
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Welcome, {user?.email}
                </Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Current Status
                        </Text>
                        
                        <View style={styles.statusRow}>
                            <Text variant="bodyLarge">Status: </Text>
                            <Chip 
                                mode="outlined"
                                textStyle={{ color: attendanceStatus === 'in' ? COLORS.success : COLORS.error }}
                                style={[
                                    styles.statusChip,
                                    { borderColor: attendanceStatus === 'in' ? COLORS.success : COLORS.error }
                                ]}
                            >
                                {attendanceStatus === 'in' ? 'Checked In' : 'Checked Out'}
                            </Chip>
                        </View>
                        
                        <Text variant="bodyMedium" style={styles.hoursText}>
                            Today's Hours: {todayHours}
                        </Text>
                        
                        <Button 
                            mode="contained" 
                            style={[
                                styles.checkInButton,
                                { backgroundColor: attendanceStatus === 'in' ? COLORS.error : COLORS.success }
                            ]}
                            onPress={handleManualCheckIn}
                        >
                            {attendanceStatus === 'in' ? 'Check Out' : 'Check In'}
                        </Button>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Quick Actions
                        </Text>
                        
                        <Button 
                            mode="outlined" 
                            style={styles.actionButton}
                            onPress={() => {
                                // TODO: Navigate to attendance history
                                console.log('View History pressed');
                            }}
                        >
                            View Attendance History
                        </Button>
                        
                        <Button 
                            mode="outlined" 
                            style={styles.actionButton}
                            onPress={() => {
                                // TODO: Navigate to location settings
                                console.log('Location Settings pressed');
                            }}
                        >
                            Location Settings
                        </Button>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Recent Activity
                        </Text>
                        <Text variant="bodyMedium" style={styles.noDataText}>
                            No recent activity (Coming soon)
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusChip: {
        marginLeft: 8,
    },
    hoursText: {
        marginBottom: 16,
        color: COLORS.text,
    },
    checkInButton: {
        marginBottom: 8,
    },
    actionButton: {
        marginBottom: 12,
    },
    noDataText: {
        fontStyle: 'italic',
        color: COLORS.textSecondary,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
    },
});
