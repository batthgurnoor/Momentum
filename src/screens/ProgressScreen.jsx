import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { auth, db } from '../../Firebase/config';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { computeStreaks } from '../utils/streaks';
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog';

const APP = COLORS.app;

const MUSCLE_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  full_body: 'Full body',
  cardio: 'Cardio',
};

const MUSCLE_OPTION_ORDER = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'full_body',
  'cardio',
];

const muscleByExerciseId = (() => {
  const m = new Map();
  for (const ex of EXERCISE_CATALOG) {
    m.set(Number(ex.id), Array.isArray(ex.muscleGroups) ? ex.muscleGroups : []);
  }
  return m;
})();

const MUSCLE_OPTIONS = MUSCLE_OPTION_ORDER.filter((key) =>
  EXERCISE_CATALOG.some((ex) => (ex.muscleGroups || []).includes(key))
);

export default function ProgressScreen() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [weekActivities, setWeekActivities] = useState([]);
  const [streakActivities, setStreakActivities] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [timeframeWeeks, setTimeframeWeeks] = useState(12); // 4, 12, 24
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);

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
      setSessions([]);
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

    // Sessions (for charts/PRs) - pull a larger window
    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const sessionsStart = new Date();
    sessionsStart.setDate(sessionsStart.getDate() - (timeframeWeeks * 7 - 1));
    sessionsStart.setHours(0, 0, 0, 0);
    const sessionsQ = query(
      sessionsRef,
      where('timestamp', '>=', sessionsStart),
      orderBy('timestamp', 'desc'),
      limit(800)
    );
    const unsubSessions = onSnapshot(
      sessionsQ,
      (snap) => {
        setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.log('Progress sessions error:', err);
        setSessions([]);
      }
    );

    return () => {
      unsubWeek();
      unsubStreak();
      unsubMetrics();
      unsubSessions();
    };
  }, [user, weekStart, timeframeWeeks]);

  const summary = useMemo(() => {
    const sessions = weekActivities.length;
    const totalSeconds = weekActivities.reduce((acc, a) => acc + (Number(a.duration) || 0), 0);
    const totalCalories = weekActivities.reduce((acc, a) => acc + (Number(a.caloriesBurned) || 0), 0);
    const minutes = Math.round(totalSeconds / 60);
    return { sessions, minutes, totalCalories };
  }, [weekActivities]);

  const streak = useMemo(() => computeStreaks(streakActivities), [streakActivities]);

  const weeklyTraining = useMemo(() => {
    // bucket by week start (Mon) in local time
    const start = new Date();
    start.setDate(start.getDate() - (timeframeWeeks * 7 - 1));
    start.setHours(0, 0, 0, 0);

    const weekKey = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      // convert to Monday-start week
      const day = x.getDay(); // 0 Sun .. 6 Sat
      const diff = (day + 6) % 7; // days since Monday
      x.setDate(x.getDate() - diff);
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, '0');
      const dd = String(x.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    const buckets = new Map(); // week -> {volume, sets, exercises, sessions}

    for (const s of sessions || []) {
      const ts = s?.timestamp?.toDate?.();
      if (!ts) continue;
      if (ts < start) continue;
      const k = weekKey(ts);
      const b = buckets.get(k) || { volume: 0, sets: 0, exercises: 0, sessions: 0 };

      if (!selectedMuscleGroup) {
        const vol = Number(s?.totals?.volume) || 0;
        const sets = Number(s?.totals?.sets) || 0;
        const exCount = Array.isArray(s?.exercises) ? s.exercises.length : 0;
        b.volume += vol;
        b.sets += sets;
        b.exercises += exCount;
        b.sessions += 1;
      } else {
        let vol = 0;
        let sets = 0;
        let exCount = 0;
        let sessionHit = false;
        for (const ex of s.exercises || []) {
          const groups = muscleByExerciseId.get(Number(ex.exerciseId)) || [];
          if (!groups.includes(selectedMuscleGroup)) continue;
          exCount += 1;
          for (const set of ex.sets || []) {
            const reps = Number(set?.reps);
            const weight = Number(set?.weight);
            if (!Number.isFinite(reps) || reps <= 0) continue;
            sets += 1;
            sessionHit = true;
            if (Number.isFinite(weight)) vol += reps * weight;
          }
        }
        b.volume += vol;
        b.sets += sets;
        b.exercises += exCount;
        if (sessionHit) b.sessions += 1;
      }
      buckets.set(k, b);
    }

    // make a continuous series for the timeframe
    const series = [];
    const cursor = new Date(start);
    // align cursor to week start
    const day = cursor.getDay();
    const diff = (day + 6) % 7;
    cursor.setDate(cursor.getDate() - diff);

    for (let i = 0; i < timeframeWeeks; i++) {
      const k = weekKey(cursor);
      const b = buckets.get(k) || { volume: 0, sets: 0, exercises: 0, sessions: 0 };
      series.push({ week: k, ...b });
      cursor.setDate(cursor.getDate() + 7);
    }

    const maxVolume = Math.max(1, ...series.map((x) => x.volume));
    const maxSets = Math.max(1, ...series.map((x) => x.sets));
    return { series, maxVolume, maxSets };
  }, [sessions, timeframeWeeks, selectedMuscleGroup]);

  const exercisePRs = useMemo(() => {
    // compute per-exercise PRs from sets in sessions
    const byId = new Map(); // exerciseId -> {title, best1rm, bestSetVolume, bestRepsAtWeight:{weight,reps}}

    const epley = (w, r) => w * (1 + r / 30);

    for (const sess of sessions || []) {
      for (const ex of sess.exercises || []) {
        const id = ex.exerciseId;
        if (!id) continue;
        const cur = byId.get(id) || {
          exerciseId: id,
          title: ex.title || 'Exercise',
          best1rm: 0,
          bestSetVolume: 0,
          bestRepsAtWeight: { weight: 0, reps: 0 },
        };

        for (const set of ex.sets || []) {
          const reps = Number(set?.reps);
          const weight = Number(set?.weight);
          if (!Number.isFinite(reps) || reps <= 0) continue;

          if (Number.isFinite(weight) && weight > 0) {
            const est = epley(weight, reps);
            if (est > cur.best1rm) cur.best1rm = est;

            const setVol = weight * reps;
            if (setVol > cur.bestSetVolume) cur.bestSetVolume = setVol;

            if (
              weight > cur.bestRepsAtWeight.weight ||
              (weight === cur.bestRepsAtWeight.weight && reps > cur.bestRepsAtWeight.reps)
            ) {
              cur.bestRepsAtWeight = { weight, reps };
            }
          }
        }

        byId.set(id, cur);
      }
    }

    return Array.from(byId.values())
      .filter((x) => {
        if (!selectedMuscleGroup) return true;
        const groups = muscleByExerciseId.get(Number(x.exerciseId)) || [];
        return groups.includes(selectedMuscleGroup);
      })
      .filter((x) => x.best1rm > 0 || x.bestSetVolume > 0)
      .sort((a, b) => b.best1rm - a.best1rm)
      .slice(0, 6);
  }, [sessions, selectedMuscleGroup]);

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          <Text style={{ color: COLORS.text.primary, fontSize: 26, fontWeight: '800', marginTop: 8 }}>
            Progress
          </Text>
          <Text style={{ color: COLORS.text.secondary, marginTop: 10, lineHeight: 20 }}>
            Weekly summaries + volume + PRs (based on your logged sets).
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[4, 12, 24].map((w) => {
              const active = timeframeWeeks === w;
              return (
                <TouchableOpacity
                  key={w}
                  activeOpacity={0.9}
                  onPress={() => setTimeframeWeeks(w)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: active ? 'rgba(45, 212, 191, 0.18)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>{w}w</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {user ? (
            <View style={{ marginTop: 14 }}>
              <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', marginBottom: 8 }}>Muscle focus</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', gap: 8, paddingRight: 8 }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedMuscleGroup(null)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: !selectedMuscleGroup ? 'rgba(45, 212, 191, 0.18)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>All</Text>
                </TouchableOpacity>
                {MUSCLE_OPTIONS.map((key) => {
                  const active = selectedMuscleGroup === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.9}
                      onPress={() => setSelectedMuscleGroup(active ? null : key)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: APP.cardBorder,
                        backgroundColor: active ? 'rgba(45, 212, 191, 0.18)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>{MUSCLE_LABELS[key]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

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
                Weekly volume (kg)
                {selectedMuscleGroup ? ` — ${MUSCLE_LABELS[selectedMuscleGroup]}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6 }}>
                {weeklyTraining.series.map((b, idx) => {
                  const h = Math.max(4, Math.round((b.volume / weeklyTraining.maxVolume) * 100));
                  return (
                    <View key={`${b.week}-${idx}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <View
                        style={{
                          width: '100%',
                          height: h,
                          borderRadius: 8,
                          backgroundColor: 'rgba(45, 212, 191, 0.65)',
                          borderWidth: 1,
                          borderColor: APP.cardBorder,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Sets/week</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {Math.round(
                      weeklyTraining.series.reduce((a, x) => a + x.sets, 0) / Math.max(1, weeklyTraining.series.length)
                    )}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                  <Text style={{ color: COLORS.text.tertiary, fontWeight: '700', fontSize: 12 }}>Exercises/week</Text>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 22, marginTop: 6 }}>
                    {Math.round(
                      weeklyTraining.series.reduce((a, x) => a + x.exercises, 0) / Math.max(1, weeklyTraining.series.length)
                    )}
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
                PRs (estimated)
              </Text>
              {exercisePRs.length === 0 ? (
                <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
                  Log sets (reps + weight) in Session to see PRs here.
                </Text>
              ) : (
                exercisePRs.map((p) => (
                  <View
                    key={String(p.exerciseId)}
                    style={{
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: APP.cardBorder,
                    }}
                  >
                    <Text style={{ color: COLORS.text.primary, fontWeight: '900' }} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text style={{ color: COLORS.text.secondary, marginTop: 4 }}>
                      1RM est: {p.best1rm.toFixed(1)} kg • Best set: {p.bestSetVolume.toFixed(0)} kg • Best reps @ {p.bestRepsAtWeight.weight.toFixed(1)}kg: {p.bestRepsAtWeight.reps}
                    </Text>
                  </View>
                ))
              )}
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

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

