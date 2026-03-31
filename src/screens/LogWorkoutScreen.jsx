import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function LogWorkoutScreen() {
  const navigation = useNavigation();

  // Timer/Tracking States
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [startTimestamp, setStartTimestamp] = useState(null); // store ms of workout start
  const [pauseTimestamp, setPauseTimestamp] = useState(null); // store ms of pause start
  const intervalRef = useRef(null);

  // Workout Details
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');

  // Timer effect
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

  // Start
  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    setElapsedTime(0);
    setStartTimestamp(Date.now());
  };

  // Pause
  const handlePause = () => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    setPauseTimestamp(Date.now());
  };

  // Resume
  const handleResume = () => {
    if (!isPaused) return;
    setIsPaused(false);
    const now = Date.now();
    const pausedDuration = now - pauseTimestamp; // how long we were paused
    setStartTimestamp((prev) => prev + pausedDuration);
  };

  // Stop & save
  const handleStop = async () => {
    if (!isRunning) return;
    setIsRunning(false);
    setIsPaused(false);
    clearInterval(intervalRef.current);

    const end = Date.now();
    const totalDurationMs = end - (startTimestamp || end);
    const totalSeconds = Math.floor(totalDurationMs / 1000);

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No user is currently logged in!');
      return;
    }

    try {
      const ref = collection(db, 'users', user.uid, 'activities');
      await addDoc(ref, {
        title: workoutTitle || 'Logged Workout',
        timestamp: serverTimestamp(),
        duration: totalSeconds,
        caloriesBurned: parseFloat(calories) || 0,
        notes: notes || '',
        startTime: new Date(startTimestamp),
        endTime: new Date(),
      });
      Alert.alert(
        'Workout Logged',
        `Workout duration: ${formatTime(totalSeconds)}\nSuccessfully saved to history.`
      );

      // Reset
      setElapsedTime(0);
      setStartTimestamp(null);
      setPauseTimestamp(null);
      setWorkoutTitle('');
      setCalories('');
      setNotes('');
    } catch (error) {
      console.log('Error logging workout:', error);
      Alert.alert('Error', error.message);
    }
  };

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const leftover = secs % 60;
    return `${minutes}m ${leftover}s`;
  };

  const displayedTime = formatTime(elapsedTime);
  return (
    <LinearGradient
      colors={[APP.bgTop, APP.bgMid, APP.bgBottom]}
      locations={[0, 0.45, 1]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-4 pt-10 pb-6"
      >
        <Text className="text-3xl font-extrabold text-ui-text-primary mt-4 mb-6 text-center">
          Log Workout
        </Text>

        <View className="items-center justify-center mb-8">
          <Text className="text-primary text-6xl font-bold mb-4 tracking-tight">
            {displayedTime}
          </Text>
          {!isRunning ? (
            <TouchableOpacity
              onPress={handleStart}
              className="bg-primary py-3 px-6 rounded-full"
            >
              <Text className="text-momentum-bg text-lg font-bold">Start Workout</Text>
            </TouchableOpacity>
          ) : !isPaused ? (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handlePause}
                className="bg-amber-500 py-3 px-5 rounded-full"
              >
                <Text className="text-momentum-bg text-base font-semibold">Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStop}
                className="bg-ui-error py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleResume}
                className="bg-primary py-3 px-5 rounded-full"
              >
                <Text className="text-momentum-bg text-base font-bold">Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStop}
                className="bg-ui-error py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="rounded-2xl p-4 border border-momentum-border bg-ui-card">
          <Text className="text-ui-text-secondary text-base font-semibold mb-1">Workout Title</Text>
          <TextInput
            className="bg-ui-surface rounded-lg px-3 py-2 mb-4 text-ui-text-primary border border-momentum-border"
            placeholder="e.g. 45-min cardio"
            placeholderTextColor="#64748b"
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
          />

          <Text className="text-ui-text-secondary text-base font-semibold mb-1">Calories Burned</Text>
          <TextInput
            className="bg-ui-surface rounded-lg px-3 py-2 mb-4 text-ui-text-primary border border-momentum-border"
            placeholder="e.g. 350"
            placeholderTextColor="#64748b"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />

          <Text className="text-ui-text-secondary text-base font-semibold mb-1">Notes</Text>
          <TextInput
            className="bg-ui-surface rounded-lg px-3 py-2 text-ui-text-primary border border-momentum-border"
            placeholder="e.g. Felt great!"
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
