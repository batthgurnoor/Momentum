// ActivityMonitoringScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityMonitoringScreen() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      
      setLoading(false);
      return;
    }

   
    const ref = collection(db, 'users', user.uid, 'activities');
   
    const q = query(ref, orderBy('timestamp', 'desc'));

   
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActivities(list);
      setLoading(false);
    }, (error) => {
      console.log('ActivityMonitoring Error:', error);
      setLoading(false);
    });

    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="gray" />
      </View>
    );
  }

  if (!activities.length) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
        <Text>No activities found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, marginTop: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
        Your Activity History
      </Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          
          const dateString = item.timestamp?.toDate 
            ? item.timestamp.toDate().toLocaleString()
            : 'N/A';
          return (
            <View
              style={{
                backgroundColor: '#ffffff',
                margin: 8,
                padding: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: 'gray' }}>{dateString}</Text>
              {item.duration && (
                <Text>{`Duration: ${item.duration} min`}</Text>
              )}
              {item.caloriesBurned && (
                <Text>{`Calories: ${item.caloriesBurned}`}</Text>
              )}
              {item.notes ? (
                <Text>{`Notes: ${item.notes}`}</Text>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
