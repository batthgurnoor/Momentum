// GoalDetailScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function GoalDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { goal } = route.params;

  const [goalData, setGoalData] = useState(goal);

  if (!goalData) {
    return (
      <LinearGradient colors={['#1F1C2C', '#928DAB']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.noDataText}>No goal data available.</Text>
        </View>
      </LinearGradient>
    );
  }

  const removeProgress = async (value) => {
    // Example placeholder for removing progress
    // If you want to remove from currentProgress or do something else
  };

  const removeGoal = async () => {
    // If you want to allow deleting the entire goal doc
  };

  const removeExercise = async (index) => {
    if (!user) return;
    const updatedExercises = [...(goalData.instructions || [])];
    updatedExercises.splice(index, 1);

    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', goalData.id);
      await updateDoc(goalRef, { instructions: updatedExercises });
      // or if you stored exercises differently, update the correct field
      setGoalData({ ...goalData, instructions: updatedExercises });
      Alert.alert('Removed!', 'Item was removed from this goal.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // For the example, your "goal" might store `instructions`, `exercises`, or something else
  // Adjust the code to match how you store "exercises" or steps.

  const exercises = goalData.exercises || []; // if you used `exercises` field

  return (
    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{goalData.title || 'Goal Detail'}</Text>
        <View style={styles.detailCard}>
          <Text style={styles.subHeader}>Goal Type: {goalData.goalType}</Text>
          <Text style={styles.subHeader}>
            Progress: {goalData.currentProgress} / {goalData.targetValue}
          </Text>
          <Text style={styles.subHeader}>
            Notes: {goalData.notes || 'None'}
          </Text>
        </View>

        <Text style={[styles.subHeader, { marginHorizontal: 16, marginTop: 10 }]}>
          Exercises / Steps
        </Text>
        {exercises.length === 0 ? (
          <Text style={[styles.infoText, { marginHorizontal: 16 }]}>No exercises defined.</Text>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            renderItem={({ item, index }) => (
              <View style={styles.itemCard}>
                <Text style={styles.itemCardTitle}>
                  {item.name || 'Custom Step'}
                </Text>
                <Text style={styles.itemCardDesc}>
                  {item.day && `Day ${item.day} `}
                  {item.sets && `${item.sets} x ${item.reps} `}
                  {item.duration && `(${item.duration} min)`}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingTop: 40
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20
  },
  noDataText: {
    color: '#fff',
    fontSize: 18
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  subHeader: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
    color: '#333'
  },
  infoText: {
    color: '#fff',
    fontSize: 14
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6
  },
  itemCardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  itemCardDesc: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2
  },
  removeButton: {
    backgroundColor: 'red',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
