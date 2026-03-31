// PlanSetupScreen.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { auth, db } from '../../Firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function PlanSetupScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [planName, setPlanName] = useState('');
  const [focus, setFocus] = useState('Strength');
  const [exercises, setExercises] = useState([]);

  const [tempDay, setTempDay] = useState('1');
  const [tempExerciseName, setTempExerciseName] = useState('');
  const [tempSets, setTempSets] = useState('');
  const [tempReps, setTempReps] = useState('');
  const [tempDuration, setTempDuration] = useState('');

  const addExercise = () => {
    if (!tempExerciseName) {
      Alert.alert('Missing Info', 'Please enter an exercise name.');
      return;
    }
    const newExercise = {
      day: parseInt(tempDay, 10) || 1,
      name: tempExerciseName,
      sets: tempSets ? parseInt(tempSets, 10) : null,
      reps: tempReps ? parseInt(tempReps, 10) : null,
      duration: tempDuration ? parseInt(tempDuration, 10) : null,
      custom: true,
    };
    setExercises(prev => [...prev, newExercise]);
    setTempDay('1');
    setTempExerciseName('');
    setTempSets('');
    setTempReps('');
    setTempDuration('');
  };

  const savePlan = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'You must sign in first.');
      return;
    }
    if (!planName) {
      Alert.alert('Plan Name Missing', 'Please provide a plan name.');
      return;
    }
    try {
      const planRef = collection(db, 'users', user.uid, 'workoutPlans');
      await addDoc(planRef, {
        planName,
        focus,
        creationDate: Timestamp.now(),
        exercises,
      });
      Alert.alert('Plan Created', 'Your workout plan was saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Create a Workout Plan</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Plan Name:</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={APP.textDim}
            value={planName}
            onChangeText={setPlanName}
            placeholder="e.g. 4-Day Strength"
          />

          <Text style={styles.label}>Focus:</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={APP.textDim}
            value={focus}
            onChangeText={setFocus}
            placeholder="e.g. Strength, Endurance"
          />

          <Text style={styles.label}>Add Exercise</Text>
          <Text style={styles.subLabel}>Day:</Text>
          <TextInput
            style={styles.input}
            value={tempDay}
            onChangeText={setTempDay}
            keyboardType="numeric"
          />

          <Text style={styles.subLabel}>Exercise Name:</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={APP.textDim}
            value={tempExerciseName}
            onChangeText={setTempExerciseName}
            placeholder="e.g. Bench Press"
          />

          <Text style={styles.subLabel}>Sets:</Text>
          <TextInput
            style={styles.input}
            value={tempSets}
            onChangeText={setTempSets}
            keyboardType="numeric"
          />

          <Text style={styles.subLabel}>Reps:</Text>
          <TextInput
            style={styles.input}
            value={tempReps}
            onChangeText={setTempReps}
            keyboardType="numeric"
          />

          <Text style={styles.subLabel}>Duration (min):</Text>
          <TextInput
            style={styles.input}
            value={tempDuration}
            onChangeText={setTempDuration}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.addButton} onPress={addExercise}>
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {exercises.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewHeader}>Plan Exercises:</Text>
            {exercises.map((ex, idx) => (
              <Text key={idx} style={styles.previewText}>
                Day {ex.day}: {ex.name}
                {ex.sets && ` - ${ex.sets} sets`}
                {ex.reps && ` x ${ex.reps} reps`}
                {ex.duration && ` (${ex.duration} min)`}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
          <Text style={styles.saveButtonText}>Save Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP.text,
    textAlign: 'center',
    marginVertical: 20,
  },
  formCard: {
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  label: { fontSize: 18, fontWeight: '600', color: APP.text, marginBottom: 6 },
  subLabel: { fontSize: 16, fontWeight: '500', color: APP.textMuted, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: APP.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: APP.text,
  },
  addButton: {
    backgroundColor: APP.accentMuted,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: APP.accent,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  previewHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP.text,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 16,
    color: APP.textMuted,
    marginVertical: 2,
  },
  saveButton: {
    backgroundColor: APP.accent,
    padding: 14,
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  saveButtonText: {
    color: COLORS.text.onPrimary,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
