import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { auth } from '../../Firebase/config';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import AntDesign from '@expo/vector-icons/AntDesign';
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog';
import ExerciseGifCardMedia from '../components/ExerciseGifCardMedia';
import {
  buildSessionFirestoreDocuments,
  buildSessionWriteSnapshot,
  clearQueuedSessionWrite,
  commitSessionWriteBatch,
  flushQueuedSessionWrite,
  queueFailedSessionWrite,
} from '../utils/sessionFirestoreWrite';

const APP = COLORS.app;
const WH = COLORS.workoutHome;

const LAST_WEIGHT_STORAGE_PREFIX = 'session:lastWeightByExercise:';

function loadLastWeightMap(uid) {
  if (!uid) return Promise.resolve({});
  return AsyncStorage.getItem(`${LAST_WEIGHT_STORAGE_PREFIX}${uid}`)
    .then((raw) => {
      if (!raw) return {};
      try {
        const p = JSON.parse(raw);
        return p && typeof p === 'object' ? p : {};
      } catch {
        return {};
      }
    })
    .catch(() => ({}));
}

function saveLastWeightMap(uid, map) {
  if (!uid) return Promise.resolve();
  return AsyncStorage.setItem(`${LAST_WEIGHT_STORAGE_PREFIX}${uid}`, JSON.stringify(map)).catch(() => {});
}

function computeLastWeightMapFromSession(prevMap, exercises) {
  const next = { ...prevMap };
  for (const ex of exercises || []) {
    const id = String(ex.exerciseId);
    const sets = ex.sets || [];
    for (let i = sets.length - 1; i >= 0; i--) {
      const w = parseFloat(String(sets[i]?.weight ?? ''));
      if (Number.isFinite(w) && w >= 0) {
        next[id] = w;
        break;
      }
    }
  }
  return next;
}

export default function SessionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const intervalRef = useRef(null);
  const restIntervalRef = useRef(null);
  const undoRemoveTimerRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [pauseTimestamp, setPauseTimestamp] = useState(null);

  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restTargetSeconds, setRestTargetSeconds] = useState(0);

  const [mode, setMode] = useState('session'); // 'session' | 'picker'
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [sessionExercises, setSessionExercises] = useState([]);
  const [lastWeightByExerciseId, setLastWeightByExerciseId] = useState({});
  const [undoRemovedSet, setUndoRemovedSet] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [pendingFinishCtx, setPendingFinishCtx] = useState(null);
  const [saveErrorBanner, setSaveErrorBanner] = useState(false);
  /** { exerciseId, setIndex, set } */

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setLastWeightByExerciseId({});
      return;
    }
    let cancelled = false;
    loadLastWeightMap(u.uid).then((m) => {
      if (!cancelled) setLastWeightByExerciseId(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (undoRemoveTimerRef.current) clearTimeout(undoRemoveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    flushQueuedSessionWrite(u.uid).catch(() => {});
  }, []);

  useEffect(() => {
    const prefill = route?.params?.prefill;
    if (!prefill) return;

    if (typeof prefill.title === 'string' && prefill.title) {
      setTitle(prefill.title);
    }
    if (typeof prefill.restTargetSeconds === 'number') {
      setRestTargetSeconds(prefill.restTargetSeconds);
      setRestSeconds(prefill.restTargetSeconds);
      setRestRunning(false);
    }
    if (Array.isArray(prefill.exercises) && prefill.exercises.length) {
      setSessionExercises(
        prefill.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          title: e.title,
          intensity: e.intensity,
          category: e.category,
          sets: (e.sets || []).map((s) => ({
            reps: s.reps ?? '',
            weight: s.weight ?? '',
            rpe: s.rpe ?? '',
            restSeconds: typeof s.restSeconds === 'number' ? s.restSeconds : restTargetSeconds || 0,
            createdAt: Date.now() + Math.random(),
          })),
        }))
      );
    }
    // prevent repeated prefills on re-render
    navigation.setParams?.({ prefill: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restRunning) {
      clearInterval(restIntervalRef.current);
      return;
    }

    if (restSeconds <= 0) {
      setRestRunning(false);
      clearInterval(restIntervalRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      return;
    }

    restIntervalRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(restIntervalRef.current);
  }, [restRunning, restSeconds]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const leftover = secs % 60;
    return `${minutes}m ${leftover}s`;
  };

  const displayedTime = useMemo(() => formatTime(elapsedTime), [elapsedTime]);
  const displayedRest = useMemo(() => formatTime(restSeconds), [restSeconds]);

  const filteredExercises = useMemo(() => {
    const q = exerciseQuery.trim().toLowerCase();
    if (!q) return EXERCISE_CATALOG;
    return EXERCISE_CATALOG.filter((e) => {
      const t = String(e.title || '').toLowerCase();
      const c = String(e.category || '').toLowerCase();
      const i = String(e.intensity || '').toLowerCase();
      return t.includes(q) || c.includes(q) || i.includes(q);
    });
  }, [exerciseQuery]);

  const addExerciseToSession = (ex) => {
    setSessionExercises((prev) => {
      if (prev.some((p) => p.exerciseId === ex.id)) return prev;
      return [
        ...prev,
        {
          exerciseId: ex.id,
          title: ex.title,
          intensity: ex.intensity,
          category: ex.category,
          sets: [],
        },
      ];
    });
    setMode('session');
    setExerciseQuery('');
  };

  const removeExerciseFromSession = (exerciseId) => {
    if (undoRemovedSet?.exerciseId === exerciseId) {
      if (undoRemoveTimerRef.current) clearTimeout(undoRemoveTimerRef.current);
      setUndoRemovedSet(null);
    }
    setSessionExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const scheduleUndoRemovedClear = () => {
    if (undoRemoveTimerRef.current) clearTimeout(undoRemoveTimerRef.current);
    undoRemoveTimerRef.current = setTimeout(() => setUndoRemovedSet(null), 6000);
  };

  const removeSetAt = (exerciseId, setIndex) => {
    const ex = sessionExercises.find((e) => e.exerciseId === exerciseId);
    const removed = ex?.sets?.[setIndex];
    if (!removed) return;
    if (undoRemoveTimerRef.current) clearTimeout(undoRemoveTimerRef.current);
    setSessionExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return { ...e, sets: e.sets.filter((_, i) => i !== setIndex) };
      })
    );
    setUndoRemovedSet({ exerciseId, setIndex, set: { ...removed } });
    scheduleUndoRemovedClear();
  };

  const undoRemoveSet = () => {
    if (!undoRemovedSet) return;
    if (undoRemoveTimerRef.current) clearTimeout(undoRemoveTimerRef.current);
    const { exerciseId, setIndex, set } = undoRemovedSet;
    setSessionExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = [...e.sets];
        const i = Math.min(Math.max(0, setIndex), sets.length);
        sets.splice(i, 0, { ...set });
        return { ...e, sets };
      })
    );
    setUndoRemovedSet(null);
  };

  const addSet = (exerciseId, partial = {}) => {
    const idKey = String(exerciseId);
    const hasWeightProp = Object.prototype.hasOwnProperty.call(partial, 'weight');
    const defaultWeight =
      hasWeightProp && partial.weight !== undefined
        ? partial.weight
        : lastWeightByExerciseId[idKey] != null && Number.isFinite(Number(lastWeightByExerciseId[idKey]))
          ? String(lastWeightByExerciseId[idKey])
          : '';
    setSessionExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const next = {
          reps: '',
          weight: defaultWeight,
          rpe: '',
          restSeconds: restTargetSeconds || 0,
          createdAt: Date.now(),
          ...partial,
        };
        return { ...e, sets: [...e.sets, next] };
      })
    );
  };

  const updateSet = (exerciseId, setIndex, patch) => {
    setSessionExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = e.sets.map((s, idx) => (idx === setIndex ? { ...s, ...patch } : s));
        return { ...e, sets };
      })
    );
  };

  const copyLastSet = (exerciseId) => {
    const ex = sessionExercises.find((e) => e.exerciseId === exerciseId);
    const last = ex?.sets?.[ex.sets.length - 1];
    if (!last) return addSet(exerciseId);
    return addSet(exerciseId, {
      reps: last.reps,
      weight: last.weight,
      rpe: last.rpe,
      restSeconds: last.restSeconds ?? restTargetSeconds ?? 0,
    });
  };

  const plusTwoPointFive = (exerciseId) => {
    const ex = sessionExercises.find((e) => e.exerciseId === exerciseId);
    const last = ex?.sets?.[ex.sets.length - 1];
    const lastWeight = parseFloat(String(last?.weight ?? ''));
    const nextWeight = Number.isFinite(lastWeight) ? String((lastWeight + 2.5).toFixed(1)) : '';
    return addSet(exerciseId, {
      reps: last?.reps ?? '',
      weight: nextWeight,
      rpe: last?.rpe ?? '',
      restSeconds: last?.restSeconds ?? restTargetSeconds ?? 0,
    });
  };

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    setElapsedTime(0);
    setStartTimestamp(Date.now());
  };

  const handlePause = () => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    setPauseTimestamp(Date.now());
  };

  const handleResume = () => {
    if (!isPaused) return;
    setIsPaused(false);
    const now = Date.now();
    const pausedDuration = now - (pauseTimestamp || now);
    setStartTimestamp((prev) => (typeof prev === 'number' ? prev + pausedDuration : prev));
  };

  const persistAfterFinish = async (ctx) => {
    if (!ctx) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No user is currently logged in!');
      return;
    }

    setSavingSession(true);
    setSaveErrorBanner(false);

    const { sessionPayload, activityPayload } = buildSessionFirestoreDocuments({
      title,
      totalSeconds: ctx.totalSeconds,
      calories,
      notes,
      startTimestamp: ctx.startTimestamp,
      restTargetSeconds,
      sessionExercises,
      endTimeMs: ctx.endTimeMs,
    });

    const result = await commitSessionWriteBatch(user.uid, sessionPayload, activityPayload);
    setSavingSession(false);

    if (result.ok) {
      await clearQueuedSessionWrite();
      const nextWeightMap = computeLastWeightMapFromSession(lastWeightByExerciseId, sessionExercises);
      setLastWeightByExerciseId(nextWeightMap);
      await saveLastWeightMap(user.uid, nextWeightMap);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      setPendingFinishCtx(null);
      setSaveErrorBanner(false);

      Alert.alert('Session saved', `Duration: ${formatTime(ctx.totalSeconds)}`);

      setElapsedTime(0);
      setStartTimestamp(null);
      setPauseTimestamp(null);
      setTitle('');
      setCalories('');
      setNotes('');
      setSessionExercises([]);
      navigation.goBack();
      return;
    }

    const snapshot = buildSessionWriteSnapshot({
      title,
      totalSeconds: ctx.totalSeconds,
      calories,
      notes,
      startTimestamp: ctx.startTimestamp,
      restTargetSeconds,
      sessionExercises,
      endTimeMs: ctx.endTimeMs,
    });
    await queueFailedSessionWrite(user.uid, snapshot);

    const msg =
      result.error?.code === 'unavailable' || result.error?.message?.includes('network')
        ? 'You may be offline. We saved a copy on this device — tap Retry when you are back online.'
        : result.error?.message ?? 'Could not save. Check your connection and try again.';

    Alert.alert('Save failed', msg, [
      {
        text: 'Dismiss',
        style: 'cancel',
        onPress: () => setSaveErrorBanner(true),
      },
      {
        text: 'Retry',
        onPress: () => void persistAfterFinish(ctx),
      },
    ]);
  };

  const handleFinish = () => {
    if (!isRunning) return;
    setIsRunning(false);
    setIsPaused(false);
    clearInterval(intervalRef.current);

    const end = Date.now();
    const totalDurationMs = end - (startTimestamp || end);
    const totalSeconds = Math.max(0, Math.floor(totalDurationMs / 1000));

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No user is currently logged in!');
      return;
    }

    const ctx = {
      totalSeconds,
      startTimestamp,
      endTimeMs: end,
    };
    setPendingFinishCtx(ctx);
    void persistAfterFinish(ctx);
  };

  const setRestPreset = (secs) => {
    setRestTargetSeconds(secs);
    setRestSeconds(secs);
    setRestRunning(false);
  };

  const startRest = () => {
    if (restSeconds <= 0) return;
    setRestRunning(true);
  };

  const stopRest = () => {
    setRestRunning(false);
  };

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, position: 'relative' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '800' }}>
              {mode === 'picker' ? 'Pick an exercise' : 'Session'}
            </Text>
            <TouchableOpacity
              onPress={() => (mode === 'picker' ? setMode('session') : navigation.goBack())}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>
                {mode === 'picker' ? 'Back' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'picker' ? (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  marginTop: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AntDesign name="search1" size={16} color={COLORS.text.secondary} />
                <TextInput
                  value={exerciseQuery}
                  onChangeText={setExerciseQuery}
                  placeholder="Search exercises…"
                  placeholderTextColor={COLORS.text.tertiary}
                  style={{ flex: 1, color: COLORS.text.primary, paddingVertical: 4 }}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {!!exerciseQuery && (
                  <TouchableOpacity onPress={() => setExerciseQuery('')} activeOpacity={0.8}>
                    <AntDesign name="closecircle" size={16} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flex: 1, marginTop: 12 }}>
                <FlashList
                  data={filteredExercises}
                  estimatedItemSize={200}
                  keyExtractor={(item) => String(item.id)}
                  ListEmptyComponent={
                    exerciseQuery.trim() ? (
                      <View style={{ paddingVertical: 36, paddingHorizontal: 12 }}>
                        <Text
                          style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16, textAlign: 'center' }}
                        >
                          No matches for &quot;{exerciseQuery.trim()}&quot;
                        </Text>
                        <Text style={{ color: COLORS.text.secondary, textAlign: 'center', marginTop: 10, lineHeight: 20 }}>
                          Try a shorter search or clear the field to see all exercises.
                        </Text>
                      </View>
                    ) : null
                  }
                  renderItem={({ item, index }) => {
                    if (index % 2 !== 0) return null;
                    const nextItem = filteredExercises[index + 1];

                    const Card = ({ data }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => addExerciseToSession(data)}
                        style={gridStyles.cardOuter}
                      >
                        <ExerciseGifCardMedia
                          intensity={data.intensity}
                          gifFileName={data.gif_url}
                          style={gridStyles.cardBg}
                          imageStyle={gridStyles.cardImage}
                          accentColor={WH.accent}
                        >
                          <LinearGradient
                            colors={['rgba(15,23,42,0.2)', 'rgba(0,0,0,0.82)']}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={gridStyles.topTag}>
                            <Text style={gridStyles.tagText} numberOfLines={1}>
                              {data.category}
                            </Text>
                          </View>
                          <View style={gridStyles.bottomBlock}>
                            <Text style={gridStyles.cardTitle} numberOfLines={2}>
                              {data.title}
                            </Text>
                            <Text style={gridStyles.tapHint} numberOfLines={1}>
                              {String(data.intensity || '').toUpperCase() || 'TAP TO ADD'}
                            </Text>
                          </View>
                        </ExerciseGifCardMedia>
                      </TouchableOpacity>
                    );

                    return (
                      <View style={gridStyles.row}>
                        <Card data={item} />
                        {nextItem ? <Card data={nextItem} /> : <View style={{ flex: 1, marginHorizontal: 4 }} />}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
              {saveErrorBanner && pendingFinishCtx ? (
                <View
                  style={{
                    marginBottom: 14,
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: COLORS.ui.error,
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Session not synced</Text>
                  <Text style={{ color: COLORS.text.secondary, marginTop: 6, lineHeight: 20 }}>
                    A copy is stored on this device. Tap Retry when you are back online.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => void persistAfterFinish(pendingFinishCtx)}
                    disabled={savingSession}
                    style={{
                      marginTop: 12,
                      alignSelf: 'flex-start',
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 999,
                      backgroundColor: APP.accent,
                      opacity: savingSession ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>Retry save</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={{ alignItems: 'center', marginTop: 26, marginBottom: 18 }}>
                <Text style={{ color: APP.accent, fontSize: 56, fontWeight: '900' }}>{displayedTime}</Text>
                {!isRunning ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleStart}
                    style={{
                      marginTop: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 22,
                      borderRadius: 999,
                      backgroundColor: APP.accent,
                    }}
                  >
                    <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900', fontSize: 16 }}>Start session</Text>
                  </TouchableOpacity>
                ) : !isPaused ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handlePause}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        backgroundColor: 'rgba(245, 158, 11, 0.95)',
                      }}
                    >
                      <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>Pause</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleFinish}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        backgroundColor: COLORS.ui.error,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleResume}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        backgroundColor: APP.accent,
                      }}
                    >
                      <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleFinish}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        backgroundColor: COLORS.ui.error,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16 }}>Exercises</Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setMode('picker')}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: APP.cardBorder,
                      backgroundColor: 'rgba(0,0,0,0.22)',
                    }}
                  >
                    <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {sessionExercises.length === 0 ? (
                  <View
                    style={{
                      marginTop: 14,
                      padding: 16,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: APP.cardBorder,
                      borderStyle: 'dashed',
                      backgroundColor: 'rgba(0,0,0,0.18)',
                    }}
                  >
                    <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 15 }}>No exercises yet</Text>
                    <Text style={{ color: COLORS.text.secondary, marginTop: 8, lineHeight: 20 }}>
                      Tap <Text style={{ fontWeight: '800', color: COLORS.text.primary }}>+ Add</Text> to open the library,
                      pick moves, then log sets below the timer. You can start the timer whenever you are ready.
                    </Text>
                  </View>
                ) : (
                  sessionExercises.map((ex) => (
                    <View
                      key={ex.exerciseId}
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: APP.cardBorder,
                        backgroundColor: 'rgba(0,0,0,0.22)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.text.primary, fontWeight: '900' }} numberOfLines={1}>
                            {ex.title}
                          </Text>
                          <Text style={{ color: COLORS.text.secondary, marginTop: 2 }} numberOfLines={1}>
                            {ex.intensity} • {ex.category}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeExerciseFromSession(ex.exerciseId)} activeOpacity={0.9}>
                          <AntDesign name="closecircle" size={18} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => addSet(ex.exerciseId)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: APP.accent,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>+ Set</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => copyLastSet(ex.exerciseId)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: APP.cardBorder,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Copy last</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => plusTwoPointFive(ex.exerciseId)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: APP.cardBorder,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>+2.5</Text>
                        </TouchableOpacity>
                      </View>

                      {ex.sets.length === 0 ? (
                        <View style={{ marginTop: 12 }}>
                          <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
                            Tap <Text style={{ fontWeight: '900', color: COLORS.text.primary }}>+ Set</Text> to add a row.
                            Use <Text style={{ fontWeight: '800' }}>Copy last</Text> or <Text style={{ fontWeight: '800' }}>+2.5</Text>{' '}
                            after your first set.
                          </Text>
                          {lastWeightByExerciseId[String(ex.exerciseId)] != null &&
                          Number.isFinite(Number(lastWeightByExerciseId[String(ex.exerciseId)])) ? (
                            <Text style={{ color: COLORS.text.tertiary, marginTop: 8, lineHeight: 20 }}>
                              Last weight for this lift:{' '}
                              <Text style={{ fontWeight: '800', color: APP.accent }}>
                                {lastWeightByExerciseId[String(ex.exerciseId)]} kg
                              </Text>
                              {' — it will prefill when you add a set.'}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.text.tertiary, width: 42 }}>#</Text>
                            <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>Reps</Text>
                            <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>Weight</Text>
                            <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>RPE</Text>
                            <View style={{ width: 36, alignItems: 'center' }}>
                              <Text style={{ color: COLORS.text.tertiary, fontSize: 10 }}> </Text>
                            </View>
                          </View>
                          {ex.sets.map((s, idx) => (
                            <View
                              key={s.createdAt ?? idx}
                              style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}
                            >
                              <Text style={{ color: COLORS.text.secondary, width: 42, fontWeight: '800' }}>
                                {idx + 1}
                              </Text>
                              <TextInput
                                value={String(s.reps ?? '')}
                                onChangeText={(t) => updateSet(ex.exerciseId, idx, { reps: t.replace(/[^\d]/g, '') })}
                                keyboardType="numeric"
                                placeholder="10"
                                placeholderTextColor={APP.textDim}
                                style={{
                                  flex: 1,
                                  color: COLORS.text.primary,
                                  borderWidth: 1,
                                  borderColor: APP.cardBorder,
                                  backgroundColor: 'rgba(0,0,0,0.22)',
                                  borderRadius: 10,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                }}
                              />
                              <TextInput
                                value={String(s.weight ?? '')}
                                onChangeText={(t) => updateSet(ex.exerciseId, idx, { weight: t.replace(/[^\d.]/g, '') })}
                                keyboardType="numeric"
                                placeholder="50"
                                placeholderTextColor={APP.textDim}
                                style={{
                                  flex: 1,
                                  color: COLORS.text.primary,
                                  borderWidth: 1,
                                  borderColor: APP.cardBorder,
                                  backgroundColor: 'rgba(0,0,0,0.22)',
                                  borderRadius: 10,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                }}
                              />
                              <TextInput
                                value={String(s.rpe ?? '')}
                                onChangeText={(t) => updateSet(ex.exerciseId, idx, { rpe: t.replace(/[^\d.]/g, '') })}
                                keyboardType="numeric"
                                placeholder="8"
                                placeholderTextColor={APP.textDim}
                                style={{
                                  flex: 1,
                                  color: COLORS.text.primary,
                                  borderWidth: 1,
                                  borderColor: APP.cardBorder,
                                  backgroundColor: 'rgba(0,0,0,0.22)',
                                  borderRadius: 10,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => removeSetAt(ex.exerciseId, idx)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityRole="button"
                                accessibilityLabel="Remove set"
                                style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}
                              >
                                <AntDesign name="minuscircleo" size={18} color={COLORS.text.tertiary} />
                              </TouchableOpacity>
                            </View>
                          ))}
                          <Text style={{ color: COLORS.text.tertiary, marginTop: 10 }}>
                            Default rest per set: {restTargetSeconds ? `${restTargetSeconds}s` : '—'}
                          </Text>
                        </>
                      )}
                    </View>
                  ))
                )}
              </View>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16 }}>Rest timer</Text>
                  <Text style={{ color: COLORS.text.secondary, fontWeight: '900' }}>{displayedRest}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[30, 60, 90].map((s) => (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.9}
                      onPress={() => setRestPreset(s)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: APP.cardBorder,
                        backgroundColor: restSeconds === s ? 'rgba(45, 212, 191, 0.18)' : 'rgba(0,0,0,0.22)',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>{s}s</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {!restRunning ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={startRest}
                      disabled={restSeconds <= 0}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 999,
                        backgroundColor: restSeconds <= 0 ? 'rgba(255,255,255,0.08)' : APP.accent,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: restSeconds <= 0 ? COLORS.text.secondary : COLORS.text.onPrimary,
                          fontWeight: '900',
                        }}
                      >
                        Start rest
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={stopRest}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 999,
                        backgroundColor: 'rgba(245, 158, 11, 0.95)',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>Stop rest</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setRestRunning(false);
                      setRestSeconds(0);
                      setRestTargetSeconds(0);
                    }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: APP.cardBorder,
                      backgroundColor: 'rgba(0,0,0,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: 14,
                }}
              >
                <Text style={{ color: COLORS.text.secondary, fontWeight: '800', marginBottom: 6 }}>Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Upper body"
                  placeholderTextColor={APP.textDim}
                  style={{
                    color: COLORS.text.primary,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: COLORS.text.secondary, fontWeight: '800', marginBottom: 6 }}>Calories (optional)</Text>
                <TextInput
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g. 350"
                  placeholderTextColor={APP.textDim}
                  keyboardType="numeric"
                  style={{
                    color: COLORS.text.primary,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: COLORS.text.secondary, fontWeight: '800', marginBottom: 6 }}>Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="How did it feel?"
                  placeholderTextColor={APP.textDim}
                  multiline
                  style={{
                    color: COLORS.text.primary,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    minHeight: 90,
                    textAlignVertical: 'top',
                  }}
                />
              </View>
            </ScrollView>
          )}

          {savingSession && mode === 'session' ? (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                zIndex: 100,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  paddingVertical: 28,
                  paddingHorizontal: 32,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(15,23,42,0.96)',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="large" color={APP.accent} />
                <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginTop: 16 }}>Saving session…</Text>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>

        {mode === 'session' && undoRemovedSet ? (
          <View
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: 'rgba(15,23,42,0.94)',
            }}
          >
            <Text style={{ color: COLORS.text.secondary, flex: 1, marginRight: 12, fontWeight: '700' }}>
              Set removed
            </Text>
            <TouchableOpacity onPress={undoRemoveSet} activeOpacity={0.85}>
              <Text style={{ color: APP.accent, fontWeight: '900', fontSize: 15 }}>Undo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

// (picker styles removed after reverting to full list)

const gridStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 2,
    marginVertical: 8,
  },
  cardOuter: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WH.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardBg: {
    height: 168,
    width: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 18,
  },
  topTag: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
    maxWidth: '90%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  tagText: {
    color: WH.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottomBlock: {
    padding: 12,
  },
  cardTitle: {
    color: WH.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  tapHint: {
    marginTop: 6,
    fontSize: 11,
    color: WH.accent,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

