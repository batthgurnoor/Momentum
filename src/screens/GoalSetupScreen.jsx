
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
import { auth, db } from '../../Firebase/config'; // adjust path
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {Picker} from '@react-native-picker/picker';

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

    // Example: compute endDate for months from now
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
    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Set Your Fitness Goal</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Goal Type (e.g. weightLoss)</Text>
          <View className="px-2 bg-white rounded-lg border-gray-200">
            <Picker  
          selectedValue={goalType}
          onValueChange={(itemValue) =>
          setGoalType(itemValue)
          }>
          <Picker.Item label="Wieght Loss" value="Wieght Loss" />
          <Picker.Item label="Weight Gain" value="Weight Gain" />
          
          </Picker>
          </View>
          <Text style={styles.label}>Target Value (lbs to lose, etc.)</Text>
          <TextInput
            style={styles.input}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Duration (months)</Text>
          <TextInput
            style={styles.input}
            value={durationMonths}
            onChangeText={setDurationMonths}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            multiline
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
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  saveButton: {
    backgroundColor: '#4f5bd5',
    padding: 14,
    borderRadius: 25,
    marginTop: 8
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  }
});
