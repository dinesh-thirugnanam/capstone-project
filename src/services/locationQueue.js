import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackLocation as trackLocationAPI } from './api';

const QUEUE_KEY = '@location_queue';

// Add location to queue
export async function queueLocation(latitude, longitude, accuracy) {
  try {
    const queue = await getQueue();
    const newItem = {
      id: Date.now(),
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    };
    
    queue.push(newItem);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    console.log('Location queued:', newItem);
    return true;
  } catch (error) {
    console.error('Error queueing location:', error);
    return false;
  }
}

// Get current queue
export async function getQueue() {
  try {
    const queue = await AsyncStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

// Get queue size
export async function getQueueSize() {
  const queue = await getQueue();
  return queue.length;
}

// Sync all queued locations
export async function syncQueue() {
  try {
    const queue = await getQueue();
    
    if (queue.length === 0) {
      console.log('Queue is empty, nothing to sync');
      return { success: true, synced: 0, failed: 0 };
    }

    console.log(`Syncing ${queue.length} queued locations...`);
    
    let synced = 0;
    let failed = 0;
    const failedItems = [];

    for (const item of queue) {
      try {
        await trackLocationAPI(item.latitude, item.longitude, item.accuracy);
        synced++;
        console.log(`Synced location from ${item.timestamp}`);
      } catch (error) {
        console.error(`Failed to sync location from ${item.timestamp}:`, error);
        failed++;
        failedItems.push(item);
      }
    }

    // Keep only failed items in queue
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedItems));

    console.log(`Sync complete: ${synced} synced, ${failed} failed`);
    
    return { success: true, synced, failed };
  } catch (error) {
    console.error('Error syncing queue:', error);
    return { success: false, synced: 0, failed: 0 };
  }
}

// Clear the entire queue
export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('Queue cleared');
    return true;
  } catch (error) {
    console.error('Error clearing queue:', error);
    return false;
  }
}
