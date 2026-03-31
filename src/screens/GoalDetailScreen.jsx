// GoalDetailScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function GoalDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { goal } = route.params;
  const [progressInput, setProgressInput] = useState('');
  const [goalData, setGoalData] = useState(goal);

  if (!goalData) {
    return (
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
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

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
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

        <TextInput
          style={styles.progressInput}
          placeholder="Add weekly progress (lbs lost, etc.)"
          placeholderTextColor={APP.textDim}
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
          <Text style={styles.deleteButtonLabel}>
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
    color: APP.text,
    textAlign: 'center',
    marginBottom: 20
  },
  noDataText: {
    color: APP.textMuted,
    fontSize: 18
  },
  detailCard: {
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  subHeader: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
    color: APP.textMuted
  },
  progressInput: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
    color: APP.text,
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
    backgroundColor: APP.accent,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8
  },
  deleteButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.25)',
    borderWidth: 1,
    borderColor: '#f87171',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8
  },
  buttonText: {
    color: COLORS.text.onPrimary,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  deleteButtonLabel: {
    color: '#fecaca',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
