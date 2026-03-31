import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_DEFAULT_CHANNEL = 'default';

export const NOTIFICATION_PERMISSION_DENIED = 'NOTIFICATION_PERMISSION_DENIED';

async function ensureAndroidDefaultChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    bypassDnd: false,
    showBadge: true,
  });
}

/** Request/show settings: required for local notifications on Android 13+ and reliable alarms on Android 12+. */
export async function ensureNotificationPermissionAsync() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function buildDailyTrigger(hour, minute) {
  const base = { type: 'daily', hour, minute };
  if (Platform.OS === 'android') {
    return { ...base, channelId: ANDROID_DEFAULT_CHANNEL };
  }
  return base;
}

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
    await ensureAndroidDefaultChannel();
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

function normalizeHourMinute(hour, minute) {
  const h =
    typeof hour === 'number' && hour >= 0 && hour <= 23 ? hour : 8;
  const m =
    typeof minute === 'number' && minute >= 0 && minute <= 59 ? minute : 0;
  return { hour: h, minute: m };
}

/** Cancel all local workout reminder notifications (by content data tag). */
export async function cancelWorkoutReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.type === 'workout_reminder')
      .map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier)
      )
  );
}

// Schedule a daily workout reminder (repeats every day at hour:minute)
export async function scheduleDailyWorkoutReminder(hour, minute, title, body) {
  const allowed = await ensureNotificationPermissionAsync();
  if (!allowed) {
    const err = new Error(NOTIFICATION_PERMISSION_DENIED);
    err.code = NOTIFICATION_PERMISSION_DENIED;
    throw err;
  }
  await ensureAndroidDefaultChannel();

  const { hour: h, minute: m } = normalizeHourMinute(hour, minute);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Daily Workout Reminder',
      body: body || "Don't forget your workout today!",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: 'workout_reminder' },
    },
    trigger: buildDailyTrigger(h, m),
  });
}

// Schedule a water reminder (every few hours during the day)
export async function scheduleWaterReminders() {
  const allowed = await ensureNotificationPermissionAsync();
  if (!allowed) {
    const err = new Error(NOTIFICATION_PERMISSION_DENIED);
    err.code = NOTIFICATION_PERMISSION_DENIED;
    throw err;
  }
  await ensureAndroidDefaultChannel();

  // Clear any existing water reminders
  await cancelAllWaterReminders();
  
  const identifiers = [];
  const startHour = 8; // 8 AM
  const endHour = 20; // 8 PM
  const intervalHours = 2; // Every 2 hours
  
  for (let hour = startHour; hour <= endHour; hour += intervalHours) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Stay Hydrated!',
        body: 'Time to drink some water.',
        sound: true,
        data: { type: 'water_reminder' },
      },
      trigger: buildDailyTrigger(hour, 0),
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