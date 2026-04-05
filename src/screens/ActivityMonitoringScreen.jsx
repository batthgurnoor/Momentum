// ActivityMonitoringScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config';
import { attachActivityHistoryPreload, addActivityHistoryListener } from '../utils/activityHistoryPreload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

const APP = COLORS.app;

export default function ActivityMonitoringScreen() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const detachPreload = attachActivityHistoryPreload(user.uid);
    const removeListener = addActivityHistoryListener(({ activities: next, ready }) => {
      setActivities(next);
      setLoading(!ready);
    });

    return () => {
      removeListener();
      detachPreload();
    };
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds > 0 ? remainingSeconds + 's' : ''}`;
  };

  const confirmDelete = (activityId) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert('Delete session', 'This will remove the session from your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const ref = doc(db, 'users', user.uid, 'activities', activityId);
            await deleteDoc(ref);
          } catch (e) {
            console.log('Delete activity error:', e);
            Alert.alert('Error', e?.message ?? 'Could not delete session.');
          }
        },
      },
    ]);
  };

  const renderRightActions = (activityId) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => confirmDelete(activityId)} activeOpacity={0.9}>
      <AntDesign name="delete" size={20} color="#fff" />
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={[APP.bgTop, APP.bgBottom]} style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={APP.accent} />
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color={APP.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Activity History</Text>
            <View style={{ width: 24 }} />
          </View>

          {!activities.length ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activities found.</Text>
              <TouchableOpacity style={styles.logButton} onPress={() => navigation.navigate('LogWorkout')}>
                <Text style={styles.logButtonText}>Log a Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const dateString = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'N/A';

                return (
                  <Swipeable
                    renderRightActions={() => renderRightActions(item.id)}
                    overshootRight={false}
                  >
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDate}>{dateString}</Text>
                      {item.duration ? (
                        <Text style={styles.cardDetail}>Duration: {formatDuration(item.duration)}</Text>
                      ) : null}
                      {item.caloriesBurned ? (
                        <Text style={styles.cardDetail}>Calories: {item.caloriesBurned}</Text>
                      ) : null}
                      {item.notes ? <Text style={styles.cardNotes}>Notes: {item.notes}</Text> : null}
                    </View>
                  </Swipeable>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP.cardBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: APP.text,
  },
  cardDate: {
    color: APP.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 15,
    marginBottom: 4,
    color: APP.textMuted,
  },
  cardNotes: {
    fontSize: 15,
    marginTop: 4,
    fontStyle: 'italic',
    color: APP.textDim,
  },
  deleteAction: {
    width: 92,
    marginRight: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: COLORS.ui.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: APP.textMuted,
    marginBottom: 16,
  },
  logButton: {
    backgroundColor: APP.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  logButtonText: {
    color: COLORS.text.onPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
