import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync, 
  scheduleDailyWorkoutReminder,
  scheduleWaterReminders,
  cancelAllNotifications,
  cancelWorkoutReminders,
  getAllScheduledNotifications,
  NOTIFICATION_PERMISSION_DENIED,
} from '../notifications';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

const WORKOUT_REMINDER_TITLE = 'Time to Workout!';
const WORKOUT_REMINDER_BODY =
  'Your daily workout reminder. Stay committed to your fitness journey!';

function isNotificationPermissionError(error) {
  return (
    error?.code === NOTIFICATION_PERMISSION_DENIED ||
    error?.message === NOTIFICATION_PERMISSION_DENIED
  );
}

function alertNotificationPermissionDenied() {
  Alert.alert(
    'Notifications are off',
    'Allow notifications for Momentum so workout reminders can appear. If you already tapped Don’t allow, turn them on in system settings.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open settings', onPress: () => Linking.openSettings() },
    ]
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [workoutReminderEnabled, setWorkoutReminderEnabled] = useState(false);
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(false);
  const [workoutHour, setWorkoutHour] = useState(8);
  const [workoutMinute, setWorkoutMinute] = useState(0);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [pushToken, setPushToken] = useState(null);
  const [workoutTimeModalVisible, setWorkoutTimeModalVisible] = useState(false);
  const [draftWorkoutHour, setDraftWorkoutHour] = useState(8);
  const [draftWorkoutMinute, setDraftWorkoutMinute] = useState(0);

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

  /** Persist prefs; pass overrides when React state has not committed yet (e.g. after toggles). */
  const persistPreferences = async (overrides = {}) => {
    try {
      const prefs = {
        workoutReminderEnabled,
        waterReminderEnabled,
        workoutHour,
        workoutMinute,
        ...overrides,
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

  const openWorkoutTimeModal = () => {
    setDraftWorkoutHour(workoutHour);
    setDraftWorkoutMinute(workoutMinute);
    setWorkoutTimeModalVisible(true);
  };

  const closeWorkoutTimeModal = () => {
    setWorkoutTimeModalVisible(false);
  };

  const handleWorkoutSwitchChange = (value) => {
    if (value) {
      openWorkoutTimeModal();
    } else {
      handleWorkoutReminderDisable();
    }
  };

  const handleWorkoutReminderDisable = async () => {
    setWorkoutReminderEnabled(false);
    try {
      await cancelWorkoutReminders();
    } catch (error) {
      console.error('Error cancelling workout notifications:', error);
    }
    await persistPreferences({ workoutReminderEnabled: false });
    loadScheduledNotifications();
  };

  const saveWorkoutReminderTime = async () => {
    try {
      await cancelWorkoutReminders();
      await scheduleDailyWorkoutReminder(
        draftWorkoutHour,
        draftWorkoutMinute,
        WORKOUT_REMINDER_TITLE,
        WORKOUT_REMINDER_BODY
      );
      setWorkoutHour(draftWorkoutHour);
      setWorkoutMinute(draftWorkoutMinute);
      setWorkoutReminderEnabled(true);
      setWorkoutTimeModalVisible(false);
      await persistPreferences({
        workoutReminderEnabled: true,
        workoutHour: draftWorkoutHour,
        workoutMinute: draftWorkoutMinute,
      });
      loadScheduledNotifications();
    } catch (error) {
      console.error('Failed to schedule workout reminder:', error);
      if (isNotificationPermissionError(error)) {
        alertNotificationPermissionDenied();
      } else {
        Alert.alert('Error', 'Failed to schedule workout reminder');
      }
    }
  };

  const handleWaterReminderToggle = async (value) => {
    setWaterReminderEnabled(value);
    
    if (value) {
      try {
        await scheduleWaterReminders();
        Alert.alert('Success', 'Water reminders scheduled successfully!');
      } catch (error) {
        console.error('Failed to schedule water reminders:', error);
        setWaterReminderEnabled(false);
        await persistPreferences({ waterReminderEnabled: false });
        if (isNotificationPermissionError(error)) {
          alertNotificationPermissionDenied();
        } else {
          Alert.alert('Error', 'Failed to schedule water reminders');
        }
        loadScheduledNotifications();
        return;
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
    
    await persistPreferences({ waterReminderEnabled: value });
    loadScheduledNotifications();
  };

  const handleCancelAllNotifications = async () => {
    try {
      await cancelAllNotifications();
      setWorkoutReminderEnabled(false);
      setWaterReminderEnabled(false);
      setWorkoutTimeModalVisible(false);
      await persistPreferences({
        workoutReminderEnabled: false,
        waterReminderEnabled: false,
      });
      loadScheduledNotifications();
      Alert.alert('Success', 'All notifications have been cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      Alert.alert('Error', 'Failed to cancel all notifications');
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.5, 1]} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.navBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={APP.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>
            Notification settings
          </Text>
          <View style={styles.navHeaderSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Reminders</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Workout Reminder</Text>
            <Switch
              value={workoutReminderEnabled}
              onValueChange={handleWorkoutSwitchChange}
              trackColor={{ false: '#767577', true: APP.accent }}
              thumbColor={workoutReminderEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {workoutReminderEnabled && (
            <View style={styles.workoutActiveRow}>
              <Text style={styles.workoutTimeSummary}>
                Daily at{' '}
                {workoutHour < 10 ? `0${workoutHour}` : workoutHour}:
                {workoutMinute < 10 ? `0${workoutMinute}` : workoutMinute}
              </Text>
              <TouchableOpacity
                onPress={openWorkoutTimeModal}
                style={styles.changeTimeButton}
                activeOpacity={0.8}
              >
                <Text style={styles.changeTimeButtonText}>Change time</Text>
              </TouchableOpacity>
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
              trackColor={{ false: '#767577', true: APP.accent }}
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
      </SafeAreaView>

      <Modal
        visible={workoutTimeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWorkoutTimeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeWorkoutTimeModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reminder time</Text>
            <Text style={styles.modalSubtitle}>
              Choose when you want your daily workout reminder.
            </Text>

            <View style={styles.modalPickerRow}>
              <View style={styles.modalPickerBox}>
                <Picker
                  selectedValue={draftWorkoutHour}
                  onValueChange={setDraftWorkoutHour}
                  style={styles.modalPicker}
                  itemStyle={styles.modalPickerItemIOS}
                  dropdownIconColor={APP.accent}
                  mode="dropdown"
                >
                  {hourOptions.map((hour) => (
                    <Picker.Item
                      key={`modal-hour-${hour}`}
                      label={hour < 10 ? `0${hour}` : `${hour}`}
                      value={hour}
                      color={APP.text}
                      style={styles.modalPickerItem}
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.modalTimeSeparator}>:</Text>
              <View style={styles.modalPickerBox}>
                <Picker
                  selectedValue={draftWorkoutMinute}
                  onValueChange={setDraftWorkoutMinute}
                  style={styles.modalPicker}
                  itemStyle={styles.modalPickerItemIOS}
                  dropdownIconColor={APP.accent}
                  mode="dropdown"
                >
                  {minuteOptions.map((minute) => (
                    <Picker.Item
                      key={`modal-minute-${minute}`}
                      label={minute < 10 ? `0${minute}` : `${minute}`}
                      value={minute}
                      color={APP.text}
                      style={styles.modalPickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeWorkoutTimeModal}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveWorkoutReminderTime}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP.cardBorder,
  },
  navBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHeaderSpacer: {
    width: 40,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: APP.text,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 32,
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
  workoutActiveRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP.cardBorder,
  },
  workoutTimeSummary: {
    fontSize: 16,
    color: APP.textMuted,
    marginBottom: 10,
  },
  changeTimeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: APP.accentMuted,
    borderWidth: 1,
    borderColor: APP.accent,
  },
  changeTimeButtonText: {
    color: APP.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: APP.bgMid,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: APP.textMuted,
    marginBottom: 18,
    lineHeight: 20,
  },
  modalPickerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 22,
    gap: 4,
  },
  modalPickerBox: {
    flex: 1,
    maxWidth: 148,
    minHeight: 88,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  modalPicker: {
    color: APP.text,
    width: '100%',
    minHeight: 88,
    fontSize: 26,
  },
  modalPickerItem: {
    fontSize: 20,
    backgroundColor: APP.bgBottom,
  },
  modalPickerItemIOS: {
    color: APP.text,
    fontSize: 22,
    height: 120,
  },
  modalTimeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    color: APP.text,
    alignSelf: 'center',
    marginHorizontal: 6,
    marginTop: 8,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  modalButtonCancelText: {
    color: APP.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: APP.accent,
  },
  modalButtonSaveText: {
    color: COLORS.text.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
}); 