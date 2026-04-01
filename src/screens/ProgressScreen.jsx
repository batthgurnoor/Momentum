import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { auth, db } from '../../Firebase/config';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { computeStreaks } from '../utils/streaks';

const APP = COLORS.app;

export default function ProgressScreen() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [weekActivities, setWeekActivities] = useState([]);
  const [streakActivities, setStreakActivities] = useState([]);
  const [metrics, setMetrics] = useState([]);

  const weekStart = useMemo(() => {
    const d = new Date();
    // last 7 days rolling window
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!user) {
      setWeekActivities([]);
      setStreakActivities([]);
      setMetrics([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'users', user.uid, 'activities');
    const q = query(ref, where('timestamp', '>=', weekStart), orderBy('timestamp', 'desc'));
    const streakStart = new Date();
    streakStart.setDate(streakStart.getDate() - 119);
    streakStart.setHours(0, 0, 0, 0);
    const streakQ = query(ref, where('timestamp', '>=', streakStart), orderBy('timestamp', 'desc'), limit(500));

    const unsubWeek = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWeekActivities(list);
        setLoading(false);
      },
      (err) => {
        console.log('Progress snapshot error:', err);
        setWeekActivities([]);
        setLoading(false);
      }
    );

    const unsubStreak = onSnapshot(
      streakQ,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStreakActivities(list);
      },
      (err) => {
        console.log('Progress streak error:', err);
        setStreakActivities([]);
      }
    );

    const metricsRef = collection(db, 'users', user.uid, 'metrics');
    const metricsStart = new Date();
    metricsStart.setDate(metricsStart.getDate() - 29);
    metricsStart.setHours(0, 0, 0, 0);
    const metricsQ = query(metricsRef, where('timestamp', '>=', metricsStart), orderBy('timestamp', 'desc'), limit(60));
    const unsubMetrics = onSnapshot(
      metricsQ,
      (snap) => {
        setMetrics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.log('Progress metrics error:', err);
        setMetrics([]);
      }
    );

    return () => {
      unsubWeek();
      unsubStreak();
      unsubMetrics();
    };
  }, [user, weekStart]);

  const summary = useMemo(() => {
    const sessions = weekActivities.length;
    const totalSeconds = weekActivities.reduce((acc, a) => acc + (Number(a.duration) || 0), 0);
    const totalCalories = weekActivities.reduce((acc, a) => acc + (Number(a.caloriesBurned) || 0), 0);
    const minutes = Math.round(totalSeconds / 60);
    return { sessions, minutes, totalCalories };
  }, [weekActivities]);

  const streak = useMemo(() => computeStreaks(streakActivities), [streakActivities]);

  const weightTrend = useMemo(() => {
    const weights = (metrics || []).filter((m) => m.type === 'weight' && Number.isFinite(Number(m.value)));
    if (!weights.length) return { latest: null, change: null };
    const latest = weights[0];
    const oldest = weights[weights.length - 1];
    const change = Number(latest.value) - Number(oldest.value);
    return { latest, change };
  }, [metrics]);

  const prs = useMemo(() => {
    let longestSeconds = 0;
    let longestTitle = null;
    let mostCalories = 0;
    let mostCaloriesTitle = null;

    const dayCounts = new Map(); // YYYY-MM-DD -> count
    for (const a of streakActivities) {
      const dur = Number(a?.duration) || 0;
      if (dur > longestSeconds) {
        longestSeconds = dur;
        longestTitle = a?.title || null;
      }
      const cal = Number(a?.caloriesBurned) || 0;
      if (cal > mostCalories) {
        mostCalories = cal;
        mostCaloriesTitle = a?.title || null;
      }
      const ts = a?.timestamp?.toDate?.();
      if (ts) {
        const y = ts.getFullYear();
        const m = String(ts.getMonth() + 1).padStart(2, '0');
        const d = String(ts.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      }
    }

    // best week sessions: sliding window over last 120 days
    const keys = Array.from(dayCounts.keys()).sort();
    const counts = keys.map((k) => dayCounts.get(k) || 0);
    let bestWeekSessions = 0;
    for (let i = 0; i < counts.length; i++) {
      let sum = 0;
      for (let j = i; j < counts.length && j < i + 7; j++) sum += counts[j];
      bestWeekSessions = Math.max(bestWeekSessions, sum);
    }

    const fmt = (secs) => {
      const minutes = Math.floor(secs / 60);
      const leftover = secs % 60;
      return `${minutes}m ${leftover}s`;
    };

    return {
      longestSeconds,
      longestLabel: longestSeconds ? fmt(longestSeconds) : '—',
      longestTitle: longestTitle || '—',
      mostCalories: mostCalories ? Math.round(mostCalories) : 0,
      mostCaloriesTitle: mostCaloriesTitle || '—',
      bestWeekSessions,
    };
  }, [streakActivities]);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <Text style={{ color: COLORS.text.primary, fontSize: 26, fontWeight: '800', marginTop: 8 }}>
          Progress
        </Text>
        <Text style={{ color: COLORS.text.secondary, marginTop: 10, lineHeight: 20 }}>
          Last 7 days summary from your logged workouts.
        </Text>

        {!user ? (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: '800', marginBottom: 6 }}>Sign in to see progress</Text>
            <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
              Your workout history is tied to your account.
            </Text>
          </View>
        ) : loading ? (
          <View style={{ marginTop: 18, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={APP.accent} />
            <Text style={{ color: COLORS.text.secondary, marginTop: 10 }}>Loading progress…</Text>
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16, marginBottom: 10 }}>
                This week
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Sessions</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {summary.sessions}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Minutes</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {summary.minutes}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Calories (logged)</Text>
                <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                  {Math.round(summary.totalCalories)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Current streak</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {streak.current}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Best streak</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {streak.best}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16, marginBottom: 10 }}>
                Body metrics
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Latest weight</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {weightTrend.latest?.value ? `${weightTrend.latest.value} ${weightTrend.latest.unit || 'kg'}` : '—'}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>30‑day change</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {weightTrend.change === null ? '—' : `${weightTrend.change > 0 ? '+' : ''}${weightTrend.change.toFixed(1)} kg`}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16, marginBottom: 10 }}>
                Personal records
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Longest session</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 20, marginTop: 6 }}>
                    {prs.longestLabel}
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginTop: 4 }} numberOfLines={1}>
                    {prs.longestTitle}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Most calories</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 20, marginTop: 6 }}>
                    {prs.mostCalories || '—'}
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginTop: 4 }} numberOfLines={1}>
                    {prs.mostCalories ? prs.mostCaloriesTitle : '—'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Best week (sessions)</Text>
                <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                  {prs.bestWeekSessions || 0}
                </Text>
              </View>
            </View>
          </>
        )}

        <View
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: APP.cardBorder,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Text style={{ color: COLORS.text.primary, fontWeight: '800', marginBottom: 6 }}>Up next</Text>
          <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
            - Weekly charts + trends{'\n'}- PR tracker (best set, best time){'\n'}- Muscle group breakdown{'\n'}- Consistency
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

