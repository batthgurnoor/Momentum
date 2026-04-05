import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { auth, db } from '../../Firebase/config';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { COLORS } from '../theme/colors';
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog';
import ExerciseGifCardMedia from '../components/ExerciseGifCardMedia';

const APP = COLORS.app;

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function emptyExercise(ex) {
  return {
    exerciseId: ex.id,
    title: ex.title,
    intensity: ex.intensity,
    category: ex.category,
    defaultSets: [
      { reps: '', weight: '', rpe: '' },
    ],
  };
}

export default function RoutineEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const user = auth.currentUser;

  const mode = route.params?.mode || 'create'; // create | edit
  const routineId = route.params?.routineId || null;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const [name, setName] = useState('');
  const [days, setDays] = useState([]);
  const [exercises, setExercises] = useState([]);
  /** Firestore doc id once created or loaded; keeps Save / Start from duplicating new routines */
  const [routineDocId, setRoutineDocId] = useState(() => (mode === 'edit' && routineId ? routineId : null));

  useEffect(() => {
    if (!user || mode !== 'edit' || !routineId) return;
    (async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'routines', routineId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data?.name || '');
          setDays(Array.isArray(data?.days) ? data.days : []);
          setExercises(Array.isArray(data?.exercises) ? data.exercises : []);
        }
      } catch (e) {
        console.log('Routine load error:', e);
        Alert.alert('Error', e?.message ?? 'Could not load routine.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, mode, routineId]);

  const toggleDay = (d) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const filteredExercises = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return EXERCISE_CATALOG;
    return EXERCISE_CATALOG.filter((e) => {
      const t = String(e.title || '').toLowerCase();
      const c = String(e.category || '').toLowerCase();
      const i = String(e.intensity || '').toLowerCase();
      return t.includes(q) || c.includes(q) || i.includes(q);
    });
  }, [pickerQuery]);

  const addExercise = (ex) => {
    setExercises((prev) => {
      if (prev.some((p) => p.exerciseId === ex.id)) return prev;
      return [...prev, emptyExercise(ex)];
    });
    setPickerOpen(false);
    setPickerQuery('');
  };

  const removeExercise = (exerciseId) => setExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));

  const addDefaultSet = (exerciseId) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, defaultSets: [...(e.defaultSets || []), { reps: '', weight: '', rpe: '' }] }
          : e
      )
    );
  };

  const updateDefaultSet = (exerciseId, idx, patch) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const ds = (e.defaultSets || []).map((s, i) => (i === idx ? { ...s, ...patch } : s));
        return { ...e, defaultSets: ds };
      })
    );
  };

  const persistRoutineSilently = async () => {
    if (!user) {
      const err = new Error('NO_USER');
      throw err;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      const err = new Error('MISSING_NAME');
      throw err;
    }
    const routinesRef = collection(db, 'users', user.uid, 'routines');
    const ref = routineDocId ? doc(routinesRef, routineDocId) : doc(routinesRef);
    const payload = {
      name: trimmed,
      days,
      exercises,
      updatedAt: serverTimestamp(),
      schemaVersion: 1,
    };
    if (!routineDocId) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(ref, payload, { merge: true });
    const id = ref.id;
    setRoutineDocId((prev) => prev || id);
    return { id, name: trimmed };
  };

  const saveRoutine = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save routines.');
      return;
    }
    setSaving(true);
    try {
      await persistRoutineSilently();
      navigation.goBack();
    } catch (e) {
      const code = e?.message;
      if (code === 'MISSING_NAME') {
        Alert.alert('Missing name', 'Please name your routine.');
      } else if (code === 'NO_USER') {
        Alert.alert('Sign in required', 'Please sign in to save routines.');
      } else {
        console.log('Routine save error:', e);
        Alert.alert('Error', e?.message ?? 'Could not save routine.');
      }
    } finally {
      setSaving(false);
    }
  };

  const startRoutine = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to start a routine.');
      return;
    }
    if (!exercises.length) return;
    setSaving(true);
    try {
      await persistRoutineSilently();
      const prefillExercises = exercises.map((e) => ({
        exerciseId: e.exerciseId,
        title: e.title,
        intensity: e.intensity,
        category: e.category,
        sets: (e.defaultSets || []).map((s) => ({
          reps: s.reps ?? '',
          weight: s.weight ?? '',
          rpe: s.rpe ?? '',
        })),
      }));
      navigation.navigate('Session', {
        prefill: {
          title: name,
          exercises: prefillExercises,
        },
      });
    } catch (e) {
      const code = e?.message;
      if (code === 'MISSING_NAME') {
        Alert.alert('Missing name', 'Please name your routine before starting.');
      } else if (code === 'NO_USER') {
        Alert.alert('Sign in required', 'Please sign in to start a routine.');
      } else {
        console.log('Routine start save error:', e);
        Alert.alert('Error', e?.message ?? 'Could not save routine before starting.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.9}>
              <AntDesign name="arrowleft" size={22} color={APP.text} />
            </TouchableOpacity>
            <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '900' }}>
              {mode === 'edit' ? 'Edit routine' : 'New routine'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={saveRoutine}
            disabled={saving}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: APP.accent,
              opacity: saving ? 0.75 : 1,
            }}
          >
            <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={APP.accent} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
              <Text style={{ color: COLORS.text.secondary, fontWeight: '900', marginBottom: 6 }}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Push / Pull / Legs"
                placeholderTextColor={APP.textDim}
                style={{
                  color: COLORS.text.primary,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(0,0,0,0.22)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              />
            </View>

            <View
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginBottom: 10 }}>Days</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DAY_OPTIONS.map((d) => {
                  const active = days.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      activeOpacity={0.9}
                      onPress={() => toggleDay(d)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: APP.cardBorder,
                        backgroundColor: active ? 'rgba(45, 212, 191, 0.18)' : 'rgba(0,0,0,0.22)',
                      }}
                    >
                      <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Exercises</Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setPickerOpen(true)}
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

              {exercises.length === 0 ? (
                <Text style={{ color: COLORS.text.secondary, marginTop: 10 }}>
                  Add exercises and set defaults to make this routine repeatable.
                </Text>
              ) : (
                exercises.map((e) => (
                  <View
                    key={e.exerciseId}
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
                          {e.title}
                        </Text>
                        <Text style={{ color: COLORS.text.secondary, marginTop: 2 }} numberOfLines={1}>
                          {e.intensity} • {e.category}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeExercise(e.exerciseId)} activeOpacity={0.9}>
                        <AntDesign name="closecircle" size={18} color={COLORS.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => addDefaultSet(e.exerciseId)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: APP.accent,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>+ Default set</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Text style={{ color: COLORS.text.tertiary, width: 42 }}>#</Text>
                      <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>Reps</Text>
                      <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>Weight</Text>
                      <Text style={{ color: COLORS.text.tertiary, flex: 1 }}>RPE</Text>
                    </View>
                    {(e.defaultSets || []).map((s, idx) => (
                      <View key={`${e.exerciseId}-${idx}`} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Text style={{ color: COLORS.text.secondary, width: 42, fontWeight: '800' }}>{idx + 1}</Text>
                        <TextInput
                          value={String(s.reps ?? '')}
                          onChangeText={(t) => updateDefaultSet(e.exerciseId, idx, { reps: t.replace(/[^\d]/g, '') })}
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
                          onChangeText={(t) => updateDefaultSet(e.exerciseId, idx, { weight: t.replace(/[^\d.]/g, '') })}
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
                          onChangeText={(t) => updateDefaultSet(e.exerciseId, idx, { rpe: t.replace(/[^\d.]/g, '') })}
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
                      </View>
                    ))}
                  </View>
                ))
              )}

              {exercises.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={startRoutine}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: 'rgba(45, 212, 191, 0.14)',
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    alignItems: 'center',
                    opacity: saving ? 0.65 : 1,
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>
                    {saving ? 'Saving…' : 'Start routine'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {pickerOpen ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Add exercise</Text>
                  <TouchableOpacity onPress={() => setPickerOpen(false)} activeOpacity={0.9}>
                    <AntDesign name="closecircle" size={18} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: APP.cardBorder,
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <AntDesign name="search1" size={16} color={COLORS.text.secondary} />
                  <TextInput
                    value={pickerQuery}
                    onChangeText={setPickerQuery}
                    placeholder="Search exercises…"
                    placeholderTextColor={COLORS.text.tertiary}
                    style={{ flex: 1, color: COLORS.text.primary, paddingVertical: 4 }}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ height: 420, marginTop: 10 }}>
                  <FlashList
                    data={filteredExercises}
                    estimatedItemSize={100}
                    keyExtractor={(item) => String(item.id)}
                    ListEmptyComponent={
                      pickerQuery.trim() ? (
                        <View style={{ paddingVertical: 28, paddingHorizontal: 8 }}>
                          <Text
                            style={{ color: COLORS.text.primary, fontWeight: '900', textAlign: 'center' }}
                            numberOfLines={2}
                          >
                            No matches for &quot;{pickerQuery.trim()}&quot;
                          </Text>
                          <Text style={{ color: COLORS.text.secondary, textAlign: 'center', marginTop: 8 }}>
                            Try a shorter search or clear the field.
                          </Text>
                        </View>
                      ) : null
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => addExercise(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'stretch',
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: APP.cardBorder,
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          marginBottom: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <ExerciseGifCardMedia
                          intensity={item.intensity}
                          gifFileName={item.gif_url}
                          style={{ width: 96, minHeight: 96 }}
                          imageStyle={{
                            borderTopLeftRadius: 13,
                            borderBottomLeftRadius: 13,
                          }}
                          accentColor={APP.accent}
                        />
                        <View
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: COLORS.text.primary, fontWeight: '900' }} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={{ color: COLORS.text.secondary, marginTop: 4 }} numberOfLines={1}>
                            {item.category}
                          </Text>
                          <Text style={{ color: COLORS.text.tertiary, marginTop: 2 }} numberOfLines={1}>
                            {item.intensity}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

