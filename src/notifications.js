import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }
  
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '4b9794bb-8933-4cd1-978d-29bc501d9cb5', // From app.json
    })).data;
  } catch (error) {
    console.log('Error getting push token:', error);
  }
  
  return token;
}

// Schedule a local notification
export async function scheduleWorkoutReminder(title, body, triggerTime) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Workout Reminder!',
      body: body || "It's time to work out!",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: triggerTime || { seconds: 5 }, // Default is 5 seconds from now for testing
  });
}

// Schedule a daily workout reminder
export async function scheduleDailyWorkoutReminder(hour, minute, title, body) {
  const now = new Date();
  const trigger = new Date(now);
  trigger.setHours(hour || 8);
  trigger.setMinutes(minute || 0);
  trigger.setSeconds(0);
  
  // If time has already passed today, schedule for tomorrow
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Daily Workout Reminder',
      body: body || "Don't forget your workout today!",
      sound: true,
    },
    trigger: {
      hour: trigger.getHours(),
      minute: trigger.getMinutes(),
      repeats: true,
    },
  });
}

// Schedule a water reminder (every few hours during the day)
export async function scheduleWaterReminders() {
  // Clear any existing water reminders
  await cancelAllWaterReminders();
  
  const identifiers = [];
  const now = new Date();
  const startHour = 8; // 8 AM
  const endHour = 20; // 8 PM
  const intervalHours = 2; // Every 2 hours
  
  for (let hour = startHour; hour <= endHour; hour += intervalHours) {
    const trigger = new Date(now);
    trigger.setHours(hour);
    trigger.setMinutes(0);
    trigger.setSeconds(0);
    
    // If time has already passed today, schedule for tomorrow
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Stay Hydrated!',
        body: 'Time to drink some water.',
        sound: true,
        data: { type: 'water_reminder' },
      },
      trigger: {
        hour: trigger.getHours(),
        minute: trigger.getMinutes(),
        repeats: true,
      },
    });
    
    identifiers.push(id);
  }
  
  return identifiers;
}

// Helper to cancel all water reminders
async function cancelAllWaterReminders() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const waterReminders = scheduledNotifications.filter(
    notification => notification.content.data?.type === 'water_reminder'
  );
  
  for (const reminder of waterReminders) {
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
} 