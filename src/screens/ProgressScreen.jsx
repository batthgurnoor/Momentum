import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { auth, db } from '../../Firebase/config';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { computeStreaks } from '../utils/streaks';
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog';

const APP = COLORS.app;
const WH = COLORS.workoutHome;

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

  const pillStyle = (active) => (active ? [styles.pill, styles.pillActive] : [styles.pill]);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.eyebrow, { color: WH.accent }]}>PROGRESS</Text>
              <Text style={[styles.pageTitle, { color: WH.text }]}>Your stats</Text>
              <Text style={[styles.pageSub, { color: WH.textDim }]}>
                Weekly volume, streaks, and PRs from logged sessions.
              </Text>
            </View>
            <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
              <Ionicons name="stats-chart-outline" size={22} color={WH.accent} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>Time range</Text>
            <View style={styles.pillRow}>
              {[4, 12, 24].map((w) => {
                const active = timeframeWeeks === w;
                return (
                  <TouchableOpacity
                    key={w}
                    activeOpacity={0.9}
                    onPress={() => setTimeframeWeeks(w)}
                    style={pillStyle(active)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{w}w</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {user ? (
              <>
                <Text style={[styles.cardSectionLabel, { marginTop: 14 }]}>Muscle focus</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={styles.muscleScroll}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedMuscleGroup(null)}
                    style={pillStyle(!selectedMuscleGroup)}
                  >
                    <Text style={[styles.pillText, !selectedMuscleGroup && styles.pillTextActive]}>All</Text>
                  </TouchableOpacity>
                  {MUSCLE_OPTIONS.map((key) => {
                    const active = selectedMuscleGroup === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.9}
                        onPress={() => setSelectedMuscleGroup(active ? null : key)}
                        style={pillStyle(active)}
                      >
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{MUSCLE_LABELS[key]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
          </View>

          {!user ? (
            <View style={styles.card}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="person-outline" size={28} color={WH.accent} />
              </View>
              <Text style={styles.cardTitle}>Sign in to see progress</Text>
              <Text style={styles.mutedBody}>Your workout history is tied to your account.</Text>
            </View>
          ) : loading ? (
            <View style={[styles.card, styles.loadingCard]}>
              <ActivityIndicator size="large" color={APP.accent} />
              <Text style={styles.loadingText}>Loading progress…</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>This week</Text>
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Sessions</Text>
                    <Text style={styles.statValue}>{summary.sessions}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Minutes</Text>
                    <Text style={styles.statValue}>{summary.minutes}</Text>
                  </View>
                </View>
                <View style={[styles.statBox, styles.statBoxFull, { marginTop: 10 }]}>
                  <Text style={styles.statLabel}>Calories (logged)</Text>
                  <Text style={styles.statValue}>{Math.round(summary.totalCalories)}</Text>
                </View>
                <View style={[styles.statRow, { marginTop: 10 }]}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Current streak</Text>
                    <Text style={styles.statValue}>{streak.current}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Best streak</Text>
                    <Text style={styles.statValue}>{streak.best}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Weekly volume (kg)
                  {selectedMuscleGroup ? ` · ${MUSCLE_LABELS[selectedMuscleGroup]}` : ''}
                </Text>
                <Text style={styles.cardHint}>Each bar is one week in your selected range.</Text>
                <View style={styles.chartWrap}>
                  <View style={styles.chartBaseline} />
                  <View style={styles.chartBars}>
                    {weeklyTraining.series.map((b, idx) => {
                      const h = Math.max(4, Math.round((b.volume / weeklyTraining.maxVolume) * 100));
                      return (
                        <View key={`${b.week}-${idx}`} style={styles.chartBarCol}>
                          <LinearGradient
                            colors={[APP.accent, 'rgba(45, 212, 191, 0.45)']}
                            style={[styles.chartBar, { height: h }]}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Avg sets / week</Text>
                    <Text style={styles.statValue}>
                      {Math.round(
                        weeklyTraining.series.reduce((a, x) => a + x.sets, 0) /
                          Math.max(1, weeklyTraining.series.length)
                      )}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Avg exercises / week</Text>
                    <Text style={styles.statValue}>
                      {Math.round(
                        weeklyTraining.series.reduce((a, x) => a + x.exercises, 0) /
                          Math.max(1, weeklyTraining.series.length)
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>PRs (estimated)</Text>
                <Text style={styles.cardHint}>From reps + weight in Session (Epley 1RM estimate).</Text>
                {exercisePRs.length === 0 ? (
                  <Text style={styles.mutedBody}>Log sets with weight to see PRs here.</Text>
                ) : (
                  <View style={styles.prList}>
                    {exercisePRs.map((p) => (
                      <View key={String(p.exerciseId)} style={styles.prRow}>
                        <Text style={styles.prTitle} numberOfLines={1}>
                          {p.title}
                        </Text>
                        <Text style={styles.prLine}>
                          1RM est <Text style={styles.prEm}>{p.best1rm.toFixed(1)} kg</Text>
                        </Text>
                        <Text style={styles.prSub}>
                          Best set {p.bestSetVolume.toFixed(0)} kg·reps · Best @ {p.bestRepsAtWeight.weight.toFixed(1)} kg:{' '}
                          {p.bestRepsAtWeight.reps} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Body metrics</Text>
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Latest weight</Text>
                    <Text style={styles.statValue}>
                      {weightTrend.latest?.value
                        ? `${weightTrend.latest.value} ${weightTrend.latest.unit || 'kg'}`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>30-day change</Text>
                    <Text style={styles.statValue}>
                      {weightTrend.change === null
                        ? '—'
                        : `${weightTrend.change > 0 ? '+' : ''}${weightTrend.change.toFixed(1)} kg`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity records</Text>
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Longest session</Text>
                    <Text style={[styles.statValue, { fontSize: 20 }]}>{prs.longestLabel}</Text>
                    <Text style={styles.prSub} numberOfLines={1}>
                      {prs.longestTitle}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Most calories</Text>
                    <Text style={[styles.statValue, { fontSize: 20 }]}>{prs.mostCalories || '—'}</Text>
                    <Text style={styles.prSub} numberOfLines={1}>
                      {prs.mostCalories ? prs.mostCaloriesTitle : '—'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statBox, styles.statBoxFull, { marginTop: 10 }]}>
                  <Text style={styles.statLabel}>Best week (sessions)</Text>
                  <Text style={styles.statValue}>{prs.bestWeekSessions || 0}</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
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
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4,
  },
  cardSectionLabel: {
    color: COLORS.text.tertiary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cardHint: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  mutedBody: {
    color: COLORS.text.secondary,
    lineHeight: 20,
    fontSize: 14,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleScroll: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    paddingRight: 8,
    paddingBottom: 2,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.18)',
    borderColor: 'rgba(45, 212, 191, 0.45)',
  },
  pillText: {
    color: COLORS.text.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  pillTextActive: {
    color: APP.accent,
  },
  statRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  statBoxFull: {
    flex: undefined,
    width: '100%',
  },
  statLabel: {
    color: COLORS.text.tertiary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 22,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  chartWrap: {
    marginTop: 4,
    marginBottom: 14,
    position: 'relative',
    minHeight: 112,
  },
  chartBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1,
    height: 1,
    backgroundColor: APP.cardBorder,
    zIndex: 0,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 112,
    gap: 5,
    paddingBottom: 1,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    minHeight: 4,
  },
  prList: { gap: 10, marginTop: 8 },
  prRow: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  prTitle: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 15,
  },
  prLine: {
    color: COLORS.text.secondary,
    marginTop: 6,
    fontSize: 14,
  },
  prEm: {
    color: APP.accent,
    fontWeight: '900',
  },
  prSub: {
    color: COLORS.text.tertiary,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: WH.accentMuted,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    color: COLORS.text.secondary,
    marginTop: 12,
    fontWeight: '600',
  },
});

