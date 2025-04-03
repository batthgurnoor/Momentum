// PlanListScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { auth, db } from '../../Firebase/config'; // Adjust path
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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

  if (loading) {
    return (
      <LinearGradient colors={['#1F1C2C', '#928DAB']} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.infoText}>Loading plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.gradient}>
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
              <TouchableOpacity
                style={styles.planCard}
                onPress={() => navigation.navigate('PlanDetail', { plan: item })}
              >
                <Text style={styles.planCardTitle}>{item.planName}</Text>
                <Text style={styles.planCardSub}>Focus: {item.focus}</Text>
              </TouchableOpacity>
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },
  listContainer: {
    paddingBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planCardSub: {
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#4f5bd5',
    padding: 14,
    borderRadius: 25,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
