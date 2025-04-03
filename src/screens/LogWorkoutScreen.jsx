import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../Firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

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
  const styles = StyleSheet.create({
    background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 300,
    },
  });


  return (
    <LinearGradient
        // Background Linear Gradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.background}
      >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-4 pt-10 pb-6"
      >
        <Text className="text-3xl font-extrabold text-white mt-4 mb-6 text-center">
          Log Workout
        </Text>

        
        <View className="items-center justify-center mb-8">
          <Text className="text-white text-6xl font-bold mb-4 tracking-tight">
            {displayedTime}
          </Text>
          {!isRunning ? (
            <TouchableOpacity
              onPress={handleStart}
              className="bg-green-500 py-3 px-6 rounded-full"
            >
              <Text className="text-white text-lg font-semibold">Start Workout</Text>
            </TouchableOpacity>
          ) : !isPaused ? (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handlePause}
                className="bg-yellow-400 py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStop}
                className="bg-red-500 py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleResume}
                className="bg-blue-500 py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStop}
                className="bg-red-500 py-3 px-5 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

    
        <View className="bg-white/80 rounded-2xl p-4">
          <Text className="text-gray-700 text-base font-semibold mb-1">Workout Title</Text>
          <TextInput
            className="bg-white rounded-lg px-3 py-2 mb-4"
            placeholder="e.g. 45-min cardio"
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
          />

          <Text className="text-gray-700 text-base font-semibold mb-1">Calories Burned</Text>
          <TextInput
            className="bg-white rounded-lg px-3 py-2 mb-4"
            placeholder="e.g. 350"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />

          <Text className="text-gray-700 text-base font-semibold mb-1">Notes</Text>
          <TextInput
            className="bg-white rounded-lg px-3 py-2"
            placeholder="e.g. Felt great!"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
