import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
import { COLORS } from '../theme/colors'
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../../Firebase/config';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, listAll, ref as storageRef } from 'firebase/storage';
import { computeStreaks } from '../utils/streaks';
import { attachActivityHistoryPreload } from '../utils/activityHistoryPreload';

const WH = COLORS.workoutHome

const WorkoutScreen = () => {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [loadingStats, setLoadingStats] = useState(true);
  const [weekActivities, setWeekActivities] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);
  const [streakActivities, setStreakActivities] = useState([]);
  const [otdPreload, setOtdPreload] = useState({
    loading: false,
    name: null,
    url: null,
    error: null,
  });

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!user) {
      setWeekActivities([]);
      setLastActivity(null);
      setStreakActivities([]);
      setLoadingStats(false);
      return;
    }

    setLoadingStats(true);

    const ref = collection(db, 'users', user.uid, 'activities');

    const weekQ = query(ref, where('timestamp', '>=', weekStart), orderBy('timestamp', 'desc'));
    const lastQ = query(ref, orderBy('timestamp', 'desc'), limit(1));
    const streakStart = new Date();
    streakStart.setDate(streakStart.getDate() - 119);
    streakStart.setHours(0, 0, 0, 0);
    const streakQ = query(ref, where('timestamp', '>=', streakStart), orderBy('timestamp', 'desc'), limit(500));

    const unsubWeek = onSnapshot(
      weekQ,
      (snap) => {
        setWeekActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingStats(false);
      },
      (err) => {
        console.log('Today week stats error:', err);
        setWeekActivities([]);
        setLoadingStats(false);
      }
    );

    const unsubLast = onSnapshot(
      lastQ,
      (snap) => {
        const doc = snap.docs[0];
        setLastActivity(doc ? { id: doc.id, ...doc.data() } : null);
      },
      (err) => {
        console.log('Today last session error:', err);
      }
    );

    const unsubStreak = onSnapshot(
      streakQ,
      (snap) => {
        setStreakActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.log('Today streak error:', err);
        setStreakActivities([]);
      }
    );

    return () => {
      unsubWeek();
      unsubLast();
      unsubStreak();
    };
  }, [user, weekStart]);

  useEffect(() => {
    if (!user?.uid) return () => {};
    return attachActivityHistoryPreload(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    setOtdPreload({ loading: true, name: null, url: null, error: null });

    const slowMs = 25000;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setOtdPreload((prev) =>
        prev.loading && !prev.url
          ? { loading: false, name: null, url: null, error: new Error('timeout') }
          : prev
      );
    }, slowMs);

    (async () => {
      try {
        const day = new Date().getDate();
        const folderRef = storageRef(storage, 'AllExercises/');
        const res = await listAll(folderRef);
        if (cancelled) return;
        clearTimeout(timeoutId);
        if (!res.items.length) {
          setOtdPreload({ loading: false, name: null, url: null, error: null });
          return;
        }
        const idx = day % res.items.length;
        const exercisePath = res.items[idx].fullPath;
        const url = await getDownloadURL(storageRef(storage, exercisePath));
        const exerciseName = exercisePath.split('/').pop();
        if (!cancelled) {
          setOtdPreload({ loading: false, name: exerciseName, url, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setOtdPreload({ loading: false, name: null, url: null, error: e });
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const summary = useMemo(() => {
    const sessions = weekActivities.length;
    const totalSeconds = weekActivities.reduce((acc, a) => acc + (Number(a.duration) || 0), 0);
    const minutes = Math.round(totalSeconds / 60);
    return { sessions, minutes };
  }, [weekActivities]);

  const streak = useMemo(() => computeStreaks(streakActivities), [streakActivities]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={[WH.bgTop, WH.bgMid, WH.bgBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.eyebrow, { color: WH.accent }]}>TODAY</Text>
              <Text style={[styles.pageTitle, { color: WH.text }]}>Welcome back</Text>
              <Text style={[styles.pageSub, { color: WH.textDim }]}>
                Session, daily pick, or browse by category.
              </Text>
            </View>
            <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
              <Ionicons name="home-outline" size={22} color={WH.accent} />
            </View>
          </View>
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.statsTitle}>This week</Text>
              {loadingStats ? (
                <ActivityIndicator size="small" color={WH.accent} />
              ) : (
                <Text style={styles.statsHint}>
                  {user ? 'From your logs' : 'Sign in to track'}
                </Text>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Sessions</Text>
                <Text style={styles.statValue}>{user ? summary.sessions : '—'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Minutes</Text>
                <Text style={styles.statValue}>{user ? summary.minutes : '—'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Streak</Text>
                <Text style={styles.statValue}>{user ? streak.current : '—'}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => user && navigation.navigate('ActivityMonitoring')}
              disabled={!user}
              style={[styles.lastRow, !user && { opacity: 0.7 }]}
            >
              <View style={styles.lastHeader}>
                <Text style={styles.lastLabel}>Last session</Text>
                {user ? <Text style={styles.viewAll}>View history</Text> : null}
              </View>
              <Text style={styles.lastValue} numberOfLines={1}>
                {user ? lastActivity?.title || 'No sessions yet' : 'Not signed in'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Session')}
            style={styles.startSession}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Start a session</Text>
              <Text style={styles.startSub}>Track sets, rest, and save your workout</Text>
            </View>
            <Text style={styles.startCta}>Start</Text>
          </TouchableOpacity>
          <WorkoutOTD prefetched={otdPreload} />
          <Separator />
          <Category />
        </SafeAreaView>
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  safe: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 12,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statsTitle: {
    color: WH.text,
    fontSize: 16,
    fontWeight: '900',
  },
  statsHint: {
    color: WH.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  statLabel: {
    color: WH.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statValue: {
    color: WH.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  lastRow: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  lastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastLabel: {
    color: WH.textDim,
    fontSize: 12,
    fontWeight: '800',
  },
  viewAll: {
    color: WH.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  lastValue: {
    color: WH.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  startSession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
    marginBottom: 14,
  },
  startTitle: {
    color: WH.text,
    fontSize: 16,
    fontWeight: '800',
  },
  startSub: {
    color: WH.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  startCta: {
    color: WH.accent,
    fontSize: 14,
    fontWeight: '900',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
})

export default WorkoutScreen
