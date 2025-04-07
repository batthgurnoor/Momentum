// GoalListScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../../Firebase/config'; // adjust path
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function GoalListScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ref = collection(db, 'users', user.uid, 'goals');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setGoals(items);
        setLoading(false);
      },
      (error) => {
        console.log('Error fetching goals:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const deleteGoal = async (goalId) => {
    if (!user) return;
    
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
              await deleteDoc(goalRef);
              // No need to update state, as the onSnapshot will update automatically
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal: " + error.message);
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (goalId) => {
    return (
      <TouchableOpacity
        style={styles.deleteSwipe}
        onPress={() => deleteGoal(goalId)}
      >
        <Text style={styles.deleteSwipeText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1F1C2C', '#928DAB']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 12 }}>Loading goals...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Your Fitness Goals</Text>

          {goals.length === 0 ? (
            <Text style={[styles.infoText, { marginHorizontal: 16 }]}>
              No goals found. Create one below!
            </Text>
          ) : (
            <FlatList
              data={goals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              renderItem={({ item }) => (
                <Swipeable
                  renderRightActions={() => renderRightActions(item.id)}
                >
                  <TouchableOpacity
                    style={styles.goalCard}
                    onPress={() => navigation.navigate('GoalDetail', { goal: item })}
                  >
                    <Text style={styles.goalCardTitle}>{item.title || 'Untitled Goal'}</Text>
                    <Text style={styles.goalCardSub}>
                      Progress: {item.currentProgress} / {item.targetValue}
                    </Text>
                  </TouchableOpacity>
                </Swipeable>
              )}
            />
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('PlanList')}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>View Your Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GoalSetup')}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>Create New Goal</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </GestureHandlerRootView>
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
    marginBottom: 16
  },
  infoText: {
    color: '#fff',
    fontSize: 16
  },
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6
  },
  goalCardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    color: '#333'
  },
  goalCardSub: {
    fontSize: 14,
    color: '#666'
  },
  createButton: {
    backgroundColor: '#4f5bd5',
    padding: 14,
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 10
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16
  },
  deleteSwipe: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginVertical: 6
  },
  deleteSwipeText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 20
  }
});
