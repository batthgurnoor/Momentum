import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync, 
  scheduleDailyWorkoutReminder,
  scheduleWaterReminders,
  cancelAllNotifications,
  getAllScheduledNotifications
} from '../notifications';

export default function NotificationsScreen() {
  const [workoutReminderEnabled, setWorkoutReminderEnabled] = useState(false);
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(false);
  const [workoutHour, setWorkoutHour] = useState(8);
  const [workoutMinute, setWorkoutMinute] = useState(0);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [pushToken, setPushToken] = useState(null);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
    loadScheduledNotifications();
    
    // Request notification permissions and get token
    registerForPushNotificationsAsync().then(token => {
      setPushToken(token);
    });
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('notificationPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setWorkoutReminderEnabled(prefs.workoutReminderEnabled ?? false);
        setWaterReminderEnabled(prefs.waterReminderEnabled ?? false);
        setWorkoutHour(prefs.workoutHour ?? 8);
        setWorkoutMinute(prefs.workoutMinute ?? 0);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      const prefs = {
        workoutReminderEnabled,
        waterReminderEnabled,
        workoutHour,
        workoutMinute
      };
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const loadScheduledNotifications = async () => {
    const notifications = await getAllScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  const handleWorkoutReminderToggle = async (value) => {
    setWorkoutReminderEnabled(value);
    
    if (value) {
      try {
        const id = await scheduleDailyWorkoutReminder(
          workoutHour, 
          workoutMinute,
          'Time to Workout!',
          'Your daily workout reminder. Stay committed to your fitness journey!'
        );
        Alert.alert('Success', 'Workout reminder scheduled successfully!');
      } catch (error) {
        console.error('Failed to schedule workout reminder:', error);
        Alert.alert('Error', 'Failed to schedule workout reminder');
      }
    } else {
      // Cancel workout reminders
      try {
        const allNotifications = await getAllScheduledNotifications();
        const workoutNotifications = allNotifications.filter(
          notification => 
            notification.content.title === 'Time to Workout!' || 
            notification.content.title === 'Daily Workout Reminder'
        );
        
        for (const notification of workoutNotifications) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      } catch (error) {
        console.error('Error cancelling workout notifications:', error);
      }
    }
    
    savePreferences();
    loadScheduledNotifications();
  };

  const handleWaterReminderToggle = async (value) => {
    setWaterReminderEnabled(value);
    
    if (value) {
      try {
        await scheduleWaterReminders();
        Alert.alert('Success', 'Water reminders scheduled successfully!');
      } catch (error) {
        console.error('Failed to schedule water reminders:', error);
        Alert.alert('Error', 'Failed to schedule water reminders');
      }
    } else {
      // Cancel water reminders through our utility function
      try {
        const allNotifications = await getAllScheduledNotifications();
        const waterNotifications = allNotifications.filter(
          notification => notification.content.data?.type === 'water_reminder'
        );
        
        for (const notification of waterNotifications) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      } catch (error) {
        console.error('Error cancelling water notifications:', error);
      }
    }
    
    savePreferences();
    loadScheduledNotifications();
  };

  const handleTimeChange = () => {
    if (workoutReminderEnabled) {
      // Reschedule with new time
      handleWorkoutReminderToggle(false);
      setTimeout(() => {
        handleWorkoutReminderToggle(true);
      }, 500);
    } else {
      savePreferences();
    }
  };

  const handleCancelAllNotifications = async () => {
    try {
      await cancelAllNotifications();
      setWorkoutReminderEnabled(false);
      setWaterReminderEnabled(false);
      savePreferences();
      loadScheduledNotifications();
      Alert.alert('Success', 'All notifications have been cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      Alert.alert('Error', 'Failed to cancel all notifications');
    }
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];

  return (
    <LinearGradient colors={['#000000', '#1E1E1E']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Reminders</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Workout Reminder</Text>
            <Switch
              value={workoutReminderEnabled}
              onValueChange={handleWorkoutReminderToggle}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={workoutReminderEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {workoutReminderEnabled && (
            <View style={styles.timePickerContainer}>
              <Text style={styles.settingLabel}>Reminder Time:</Text>
              
              <View style={styles.pickerRow}>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={workoutHour}
                    onValueChange={(value) => {
                      setWorkoutHour(value);
                      handleTimeChange();
                    }}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    mode="dropdown"
                  >
                    {hourOptions.map(hour => (
                      <Picker.Item 
                        key={`hour-${hour}`} 
                        label={hour < 10 ? `0${hour}` : `${hour}`} 
                        value={hour}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.timeSeparator}>:</Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={workoutMinute}
                    onValueChange={(value) => {
                      setWorkoutMinute(value);
                      handleTimeChange();
                    }}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    mode="dropdown"
                  >
                    {minuteOptions.map(minute => (
                      <Picker.Item 
                        key={`minute-${minute}`} 
                        label={minute < 10 ? `0${minute}` : `${minute}`} 
                        value={minute}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Water Reminders</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Hydration Reminders</Text>
            <Switch
              value={waterReminderEnabled}
              onValueChange={handleWaterReminderToggle}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={waterReminderEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {waterReminderEnabled && (
            <Text style={styles.settingDescription}>
              You'll receive water reminders every 2 hours between 8 AM and 8 PM.
            </Text>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.settingLabel}>Push Notifications:</Text>
            <Text style={[
              styles.statusValue, 
              { color: pushToken ? '#4CAF50' : '#F44336' }
            ]}>
              {pushToken ? 'Enabled' : 'Not Enabled'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.settingLabel}>Active Notifications:</Text>
            <Text style={styles.statusValue}>
              {scheduledNotifications.length}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancelAllNotifications}
        >
          <Text style={styles.cancelButtonText}>Cancel All Notifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    marginBottom: 10,
  },
  timePickerContainer: {
    marginTop: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 5,
    width: 80,
    height: 50,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  pickerItem: {
    color: '#fff',
    backgroundColor: '#000',
  },
  timeSeparator: {
    fontSize: 20,
    color: '#fff',
    marginHorizontal: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 