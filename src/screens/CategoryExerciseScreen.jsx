
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useRoute } from '@react-navigation/native';
import {ref, listAll} from '@firebase/storage';  
import {storage} from '../../Firebase/config';
import { Audio } from 'expo-av';
import BackButton from '../components/BackButton';
import MuscleGroupsSection from '../components/MuscleGroupsSection';
import ExerciseData from '../../exercise_data'
import AntDesign from '@expo/vector-icons/AntDesign';
import { COLORS } from '../theme/colors';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCachedDownloadUrl } from '../utils/storageUrlCache';





const  countDownAudio = require('../../assets/audio/countdownaudio.mp3');

function ExerciseThumb({ intensity, fileName, cachedUrl, onResolved }) {
  const [uri, setUri] = useState(cachedUrl || null);

  useEffect(() => {
    let cancelled = false;
    if (cachedUrl) {
      setUri(cachedUrl);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const path = `${intensity}Exercises/${fileName}`;
        const url = await getCachedDownloadUrl(path);
        if (cancelled) return;
        setUri(url);
        if (typeof onResolved === 'function') onResolved(url);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cachedUrl, fileName, intensity, onResolved]);

  return (
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: COLORS.app.cardBorder,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: 72, height: 72 }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={COLORS.app.accent} />
        </View>
      )}
    </View>
  );
}


const CategoryExerciseScreen = () => {

    const route = useRoute();
    const insets = useSafeAreaInsets();
    const {intensity} = route.params;
    const initialTime = 60;
      const minTime = 10;
      const [time, setTime] = useState(initialTime);
      const [isRunning, setIsRunning] = useState(false);
      const [isAudioPlaying, setIsAudioPlaying] = useState(false);
      const [isFirstTime, setIsFirstTime] = useState(true);
      const [countDownSound, setCountDownSound] = useState();
      const [categoryExercises, setCategoryExercises] = useState([]);
      const [exerciseIndex, setExerciseIndex] = useState(0);  
      const [view, setView] = useState('list'); // 'list' | 'detail'

 async function playSound() {
    const {sound}= await Audio.Sound.createAsync(countDownAudio);
    setCountDownSound(sound);
    console.log("Countdown Audio",countDownSound)
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setIsAudioPlaying(false);
    }
    
  })
  await sound.playAsync();
  setIsAudioPlaying(true)
  } 


  const fetchExercisesByIntensity = async (intensity) => {
    const folderPath = `${intensity}Exercises`;
    const storageRef = ref(storage, folderPath);
    try {
      const res = await listAll(storageRef);
      const items = [];
      res.items.forEach((it) => {
        const fileName = it.name.split('/').pop();
        const matchingExercise = ExerciseData.find((exercise) => exercise.gif_url === fileName);
        if (matchingExercise) {
          // keep original gif_url (filename) and attach cached URL slot
          items.push({ ...matchingExercise, gifDownloadUrl: null });
        }
      });
      setCategoryExercises(items);
    } catch (error) {
      console.log('Error listing intensity exercises:', error);
      setCategoryExercises([]);
    }
  }

  useEffect(() => {
    fetchExercisesByIntensity(intensity);
  }, []);

  const ensureExerciseUrl = async (index) => {
    const ex = categoryExercises[index];
    if (!ex) return null;
    if (ex.gifDownloadUrl) return ex.gifDownloadUrl;

    try {
      const path = `${intensity}Exercises/${ex.gif_url}`; // gif_url is filename in ExerciseData
      const url = await getCachedDownloadUrl(path);
      setCategoryExercises((prev) => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], gifDownloadUrl: url };
        return next;
      });
      return url;
    } catch (e) {
      console.log('Error fetching cached download URL:', e);
      return null;
    }
  };

    const handleDecreaseTime =() => {
        if(!isRunning && time > minTime){
          setTime((prevTime) => prevTime - 10);
        }
      };
      const handleIncreaseTime =() => {
        if(!isRunning){
          setTime((prevTime) => prevTime + 10);
        }
      };
    
      const handleReset =() => {
        setIsRunning(false);
        setIsFirstTime(true);
        setTime(initialTime);  
        if(countDownSound && isAudioPlaying){
          countDownSound.stopAsync();
          setIsAudioPlaying(false);
        }
      };  
    
      useEffect(() => {
        let countDownInterval;
        if (isRunning && time > 0) {
          countDownInterval = setInterval(() => {
            setTime((prevTime) => {
              if (prevTime <= 1) return 0;
              const next = prevTime - 1;
              if (next === 4) playSound();
              return next;
            });
          }, 1000);
        } else {
          setIsRunning(false);
          clearInterval(countDownInterval);
        }
        return () => clearInterval(countDownInterval);
      }, [isRunning, time]);
    
      const handleStart =() => {
        if(!isRunning && isFirstTime){
          setIsFirstTime(false);
          setIsRunning(true);
      }
      else{
        setIsRunning(true);
      };}
    
      const handlePause =() => {
        if(isRunning){
          setIsRunning(false);
        }
      }

      const currentExercise = categoryExercises[exerciseIndex];
      const totalExercises = categoryExercises.length;
      const intensityTitle = useMemo(() => {
        if (!intensity) return 'Workouts';
        return `${String(intensity).charAt(0).toUpperCase()}${String(intensity).slice(1)} Workouts`;
      }, [intensity]);

      const navigateToNextExercise = () => {
        if(exerciseIndex < categoryExercises.length - 1){
          setExerciseIndex(exerciseIndex + 1);
        }
      }

      const navigateToPreviousExercise = () => {
        if(exerciseIndex > 0){
          setExerciseIndex(exerciseIndex - 1);
        }
      }

  const openDetail = async (index) => {
    setExerciseIndex(index);
    setView('detail');
    setIsRunning(false);
    setIsFirstTime(true);
    setTime(initialTime);
    await ensureExerciseUrl(index);
  };

  const backToList = () => {
    setIsRunning(false);
    setView('list');
  };

  if (!categoryExercises.length) {
    return (
      <View className="flex-1 bg-momentum-bg">
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ height: 44, justifyContent: 'center' }}>
            <BackButton mode="light" />
          </View>
          <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '800', marginTop: 12 }}>
            {intensityTitle}
          </Text>
        </SafeAreaView>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.app.accent} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-momentum-bg">
      {view === 'list' ? (
        <View style={{ flex: 1 }}>
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
            <View style={{ height: 44, justifyContent: 'center' }}>
              <BackButton mode="light" />
            </View>
            <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '800', marginTop: 12 }}>
              {intensityTitle}
            </Text>
            <Text style={{ color: COLORS.text.secondary, marginTop: 4 }}>
              Tap a workout to open details.
            </Text>
          </SafeAreaView>

          <FlashList
            data={categoryExercises}
            estimatedItemSize={96}
            keyExtractor={(item, index) => String(item?.id ?? index)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openDetail(index)}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: COLORS.app.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  marginBottom: 10,
                }}
              >
                <ExerciseThumb
                  intensity={intensity}
                  fileName={item.gif_url}
                  cachedUrl={item.gifDownloadUrl}
                  onResolved={(url) => {
                    if (!url) return;
                    setCategoryExercises((prev) => {
                      const next = [...prev];
                      if (next[index] && !next[index].gifDownloadUrl) {
                        next[index] = { ...next[index], gifDownloadUrl: url };
                      }
                      return next;
                    });
                  }}
                />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ color: COLORS.text.primary, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginTop: 4 }} numberOfLines={1}>
                    {item.intensity}
                  </Text>
                  <Text style={{ color: COLORS.text.tertiary, marginTop: 2 }} numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
                <AntDesign name="right" size={18} color={COLORS.text.primary} style={{ alignSelf: 'center' }} />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <>
          {currentExercise ? (
            <>
              <Image
                source={{ uri: currentExercise.gifDownloadUrl || currentExercise.gif_url }}
                className="w-full h-80"
              />

              <SafeAreaView
                edges={['top']}
                style={{ position: 'absolute', left: 16, right: 16, top: 0, paddingTop: 12, zIndex: 50 }}
              >
                <View style={{ height: 44, justifyContent: 'center' }}>
                  <BackButton mode="light" onPress={backToList} />
                </View>
              </SafeAreaView>

              <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
                <View className="mt-4 mx-3">
                  <Text className="text-2xl font-bold text-center mb-1 text-ui-text-primary">
                    {currentExercise.title}
                  </Text>
                  <Text className="text-ui-text-secondary mt-1">
                    {currentExercise.category.split(', ').map((cat, idx) => (
                      <View key={`${cat}-${idx}`} className="mr-2">
                        <View className="mr-2 bg-ui-surface border border-momentum-border rounded-2xl px-2">
                          <Text className="text-primary">{cat}</Text>
                        </View>
                      </View>
                    ))}
                  </Text>
                  <View className="flex-row items-center space-x-2 mt-2">
                    <Text className="font-semibold text-primary">Intensity:</Text>
                    <Text className="text-ui-text-secondary italic text-base">{currentExercise.intensity}</Text>
                  </View>
                  <MuscleGroupsSection muscleGroups={currentExercise.muscleGroups} />
                  <Text className="text-xl font-semibold mt-4 text-ui-text-primary">Instructions:</Text>
                  <View className="mt-2">
                    {currentExercise.instructions.map((instruction) => (
                      <View key={instruction.step} className="flex-row items-center space-x-2 ">
                        <Text className="text-base text-ui-text-tertiary mb-2">{instruction.step}.</Text>
                        <Text className="ml-2 text-base text-ui-text-primary">{instruction.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="mt-4 flex-row items-center justify-center space-x-3">
                  <TouchableOpacity
                    onPress={handleDecreaseTime}
                    className="items-center justify-center w-14 h-14 bg-red-500 rounded-full"
                  >
                    <Text className="text-white text-4xl">-</Text>
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-ui-text-primary">{time} secs</Text>
                  <TouchableOpacity
                    onPress={handleIncreaseTime}
                    className="items-center justify-center w-14 h-14 bg-primary rounded-full"
                  >
                    <Text className="text-white text-3xl">+</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Bottom navigation bar (always visible) */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 14,
                  paddingTop: 10,
                  paddingBottom: 16,
                  backgroundColor: 'rgba(12, 14, 20, 0.92)',
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={navigateToPreviousExercise}
                    disabled={exerciseIndex <= 0}
                    style={{ opacity: exerciseIndex <= 0 ? 0.35 : 1 }}
                  >
                    <AntDesign name="leftcircle" size={36} color="#ffffff" />
                  </TouchableOpacity>

                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: COLORS.text.secondary, fontWeight: '600' }}>
                      {exerciseIndex + 1} / {totalExercises}
                    </Text>
                    <View className="flex-row items-center justify-center space-x-3">
                      <TouchableOpacity onPress={isRunning ? handlePause : handleStart} disabled={time === 0}>
                        <Text
                          className={`text-primary text-xl py-2 border rounded-lg border-primary px-4 ${
                            time === 0 ? 'opacity-50' : ''
                          }`}
                        >
                          {isRunning ? 'PAUSE' : 'START'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleReset}>
                        <Text className="text-ui-text-secondary text-xl py-2 border rounded-lg border-momentum-border px-4">
                          RESET
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={navigateToNextExercise}
                    disabled={exerciseIndex >= totalExercises - 1}
                    style={{ opacity: exerciseIndex >= totalExercises - 1 ? 0.35 : 1 }}
                  >
                    <AntDesign name="rightcircle" size={36} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={COLORS.app.accent} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default CategoryExerciseScreen