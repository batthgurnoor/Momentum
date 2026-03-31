
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';
import { auth, db } from '../../Firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function GoalSetupScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [goalType, setGoalType] = useState('weightLoss');
  const [targetValue, setTargetValue] = useState('10');
  const [durationMonths, setDurationMonths] = useState('3');
  const [notes, setNotes] = useState('');

  const saveGoal = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }
    if (!goalType || !targetValue) {
      Alert.alert('Incomplete', 'Please enter goal type and target value.');
      return;
    }

    const numericTarget = parseFloat(targetValue);
    const numericDuration = parseInt(durationMonths, 10);
    if (isNaN(numericTarget) || isNaN(numericDuration)) {
      Alert.alert('Invalid input', 'Target and duration must be numeric.');
      return;
    }

    const now = new Date();
    const end = new Date();
    end.setMonth(now.getMonth() + numericDuration);

    try {
      const goalRef = collection(db, 'users', user.uid, 'goals');
      await addDoc(goalRef, {
        goalType,
        targetValue: numericTarget,
        currentProgress: 0,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(end),
        notes,
        title: `Lose ${numericTarget} lbs in ${numericDuration} month(s)`
      });
      Alert.alert('Goal Saved', 'Your fitness goal has been created.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error saving goal', error.message);
    }
  };

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Set Your Fitness Goal</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Goal Type</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={goalType}
              onValueChange={(itemValue) => setGoalType(itemValue)}
              style={{ color: APP.text }}
              dropdownIconColor={APP.accent}
            >
              <Picker.Item label="Weight Loss" value="weightLoss" color={APP.text} />
              <Picker.Item label="Weight Gain" value="weightGain" color={APP.text} />
            </Picker>
          </View>
          <Text style={styles.label}>Target Value (lbs to lose, etc.)</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={APP.textDim}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Duration (months)</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={APP.textDim}
            value={durationMonths}
            onChangeText={setDurationMonths}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            multiline
            placeholderTextColor={APP.textDim}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to remind yourself..."
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
            <Text style={styles.saveButtonText}>Save Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    padding: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP.text,
    textAlign: 'center',
    marginVertical: 20
  },
  formCard: {
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  pickerWrap: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: APP.textMuted
  },
  input: {
    borderWidth: 1,
    borderColor: APP.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: APP.text,
  },
  saveButton: {
    backgroundColor: APP.accent,
    padding: 14,
    borderRadius: 25,
    marginTop: 8
  },
  saveButtonText: {
    color: COLORS.text.onPrimary,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  }
});
