// PlanListScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../../Firebase/config'; // Adjust path
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function PlanListScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const plansRef = collection(db, 'users', user.uid, 'workoutPlans');
    const unsubscribe = onSnapshot(
      plansRef,
      (snapshot) => {
        const planList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlans(planList);
        setLoading(false);
      },
      (error) => {
        console.log('Error fetching plans:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const deletePlan = async (planId) => {
    if (!user) return;
    
    Alert.alert(
      "Delete Workout Plan",
      "Are you sure you want to delete this workout plan?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const planRef = doc(db, 'users', user.uid, 'workoutPlans', planId);
              await deleteDoc(planRef);
              // No need to update state, as the onSnapshot will update automatically
            } catch (error) {
              Alert.alert("Error", "Failed to delete plan: " + error.message);
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (planId) => {
    return (
      <TouchableOpacity
        style={styles.deleteSwipe}
        onPress={() => deletePlan(planId)}
      >
        <Text style={styles.deleteSwipeText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={APP.accent} />
          <Text style={styles.infoText}>Loading plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Your Workout Plans</Text>
          {plans.length === 0 ? (
            <Text style={styles.infoText}>No plans found. Create one below!</Text>
          ) : (
            <FlatList
              data={plans}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <Swipeable
                  renderRightActions={() => renderRightActions(item.id)}
                >
                  <TouchableOpacity
                    style={styles.planCard}
                    onPress={() => navigation.navigate('PlanDetail', { plan: item })}
                  >
                    <Text style={styles.planCardTitle}>{item.planName}</Text>
                    <Text style={styles.planCardSub}>Focus: {item.focus}</Text>
                  </TouchableOpacity>
                </Swipeable>
              )}
            />
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('PlanSetup')}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: APP.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: APP.textMuted,
    textAlign: 'center',
    marginVertical: 10,
  },
  listContainer: {
    paddingBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP.text,
    marginBottom: 4,
  },
  planCardSub: {
    fontSize: 16,
    color: APP.textMuted,
  },
  createButton: {
    backgroundColor: APP.accent,
    padding: 14,
    borderRadius: 25,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  createButtonText: {
    color: COLORS.text.onPrimary,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
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
