import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { auth, db } from '../../Firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

const APP = COLORS.app;

export default function SessionScreen() {
  const navigation = useNavigation();
  const intervalRef = useRef(null);
  const restIntervalRef = useRef(null);

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

  useEffect(() => {
    if (!restRunning) {
      clearInterval(restIntervalRef.current);
      return;
    }

    if (restSeconds <= 0) {
      setRestRunning(false);
      clearInterval(restIntervalRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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

  const handleFinish = async () => {
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

    try {
      const ref = collection(db, 'users', user.uid, 'activities');
      await addDoc(ref, {
        title: title || 'Training Session',
        timestamp: serverTimestamp(),
        duration: totalSeconds,
        caloriesBurned: parseFloat(calories) || 0,
        notes: notes || '',
        startTime: startTimestamp ? new Date(startTimestamp) : null,
        endTime: new Date(),
        source: 'session',
      });

      Alert.alert('Session saved', `Duration: ${formatTime(totalSeconds)}`);

      setElapsedTime(0);
      setStartTimestamp(null);
      setPauseTimestamp(null);
      setTitle('');
      setCalories('');
      setNotes('');
      navigation.goBack();
    } catch (e) {
      console.log('Error saving session:', e);
      Alert.alert('Error', e?.message ?? 'Could not save session.');
    }
  };

  const setRestPreset = (secs) => {
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '800' }}>Session</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>

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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

