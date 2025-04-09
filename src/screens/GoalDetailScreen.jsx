// GoalDetailScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function GoalDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { goal } = route.params;
  const [progressInput, setProgressInput] = useState('');
  const [goalData, setGoalData] = useState(goal);

  if (!goalData) {
    return (
      <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.noDataText}>No goal data available.</Text>
        </View>
      </LinearGradient>
    );
  }

  const updateProgress = async () => {
    if (!user) return;
    const numericProgress = parseFloat(progressInput);
    if (isNaN(numericProgress)) {
      Alert.alert('Invalid input', 'Enter a valid number for progress.');
      return;
    }

    // Sum with existing progress
    const newProgress = goal.currentProgress + numericProgress;

    const docRef = doc(db, 'users', user.uid, 'goals', goal.id);
    try {
      await updateDoc(docRef, {
        currentProgress: newProgress,
      });
      Alert.alert('Progress Updated!', `You added ${numericProgress} to your progress.`);
      setProgressInput('');
    } catch (error) {
      Alert.alert('Error updating progress', error.message);
    }
  };

  const deleteGoal = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              const docRef = doc(db, 'users', user.uid, 'goals', goal.id);
              await deleteDoc(docRef);
              Alert.alert("Success", "Goal deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal: " + error.message);
            }
          }
        }
      ]
    );
  };

  const remaining = goal.targetValue - goal.currentProgress;
  const progressPercentage = ((goal.currentProgress / goal.targetValue) * 100).toFixed(1);

  const exercises = goalData.exercises || [];
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
        </Text>

        <TextInput className='ml-10 bg-white mr-10 p-2 rounded-md text-center'
        placeholder="Add weekly progress (lbs lost, etc.)"
        value={progressInput}
        onChangeText={setProgressInput}
        keyboardType="numeric"
        
      />

      
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={updateProgress}
          style={styles.updateButton}
        >
          <Text style={styles.buttonText}>
            Update Weekly Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={deleteGoal}
          style={styles.deleteButton}
        >
          <Text style={styles.buttonText}>
            Delete Goal
          </Text>
        </TouchableOpacity>
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
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20
  },
  updateButton: {
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
