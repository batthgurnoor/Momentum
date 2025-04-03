// PlanDetailScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config'; // Adjust path
import { doc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function PlanDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { plan } = route.params;
  const user = auth.currentUser;
  const [planData, setPlanData] = useState(plan);

  const removeExercise = async (index) => {
    if (!user) return;
    const updatedExercises = [...(planData.exercises || [])];
    updatedExercises.splice(index, 1);
    try {
      const planRef = doc(db, 'users', user.uid, 'workoutPlans', planData.id);
      await updateDoc(planRef, { exercises: updatedExercises });
      setPlanData({ ...planData, exercises: updatedExercises });
      Alert.alert('Exercise Removed', 'The plan has been updated.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const exercises = planData.exercises || [];

  return (
    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{planData.planName}</Text>
        <Text style={styles.focusText}>Focus: {planData.focus}</Text>
        <View style={styles.detailCard}>
          <Text style={styles.sectionHeader}>Exercises</Text>
          {exercises.length === 0 ? (
            <Text style={styles.infoText}>No exercises in this plan.</Text>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(_, idx) => idx.toString()}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item, index }) => (
                <View style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    Day {item.day} - {item.name}
                  </Text>
                  <Text style={styles.itemDesc}>
                    {item.sets && `${item.sets} sets`} {item.reps && `x ${item.reps} reps`} {item.duration && `(${item.duration} min)`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeExercise(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  focusText: {
    fontSize: 20,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDesc: {
    fontSize: 16,
    color: '#555',
    marginVertical: 4,
  },
  removeButton: {
    backgroundColor: 'red',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
