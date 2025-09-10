import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EVENT_TYPES, NOTIFICATION_CHANNELS } from "../utils/constants";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.notificationToken = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      // Configure notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Get notification token for push notifications
      try {
        this.notificationToken = await Notifications.getExpoPushTokenAsync();
        console.log('🔔 Notification token:', this.notificationToken.data);
      } catch (error) {
        console.error('❌ Failed to get push token:', error);
      }

      this.isInitialized = true;
      console.log('✅ NotificationService initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  async createNotificationChannels() {
    // Attendance notifications channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ATTENDANCE, {
      name: 'Attendance Notifications',
      description: 'Notifications for check-in and check-out events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      sound: 'default',
    });

    // Geofence alerts channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GEOFENCE, {
      name: 'Geofence Alerts',
      description: 'Alerts when entering or leaving office areas',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#FF9800',
      sound: 'default',
    });

    // System updates channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SYSTEM, {
      name: 'System Updates',
      description: 'System messages and updates',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    });
  }

  async showAttendanceNotification(eventType, geofenceId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const isEntering = eventType === EVENT_TYPES.ENTER;
      const title = isEntering ? '✅ Checked In' : '🚪 Checked Out';
      const body = isEntering 
        ? 'You have successfully checked in to the office'
        : 'You have successfully checked out of the office';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          categoryIdentifier: 'attendance',
          data: {
            type: 'attendance',
            eventType,
            geofenceId,
            timestamp: new Date().toISOString(),
          },
        },
        trigger: null, // Show immediately
      });

      console.log(`🔔 Attendance notification shown: ${title}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to show attendance notification:', error);
    }
  }

  async showGeofenceAlert(message, data = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Location Alert',
          body: message,
          categoryIdentifier: 'geofence',
          data: {
            type: 'geofence',
            ...data,
            timestamp: new Date().toISOString(),
          },
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('❌ Failed to show geofence alert:', error);
    }
  }

  async showSystemNotification(title, message, data = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          categoryIdentifier: 'system',
          data: {
            type: 'system',
            ...data,
            timestamp: new Date().toISOString(),
          },
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('❌ Failed to show system notification:', error);
    }
  }

  async scheduleReminder(title, message, triggerDate, data = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: {
            type: 'reminder',
            ...data,
          },
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log('⏰ Reminder scheduled for:', triggerDate);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule reminder:', error);
    }
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('❌ Failed to get badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }

  // Listen for notification interactions
  addNotificationListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get push token for server registration
  getPushToken() {
    return this.notificationToken?.data;
  }

  // Handle app state changes
  async handleAppStateChange(appState) {
    if (appState === 'active') {
      // Clear badge when app becomes active
      await this.clearBadge();
    }
  }
}

// Export singleton instance
export default new NotificationService();
