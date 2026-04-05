import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useRoute } from '@react-navigation/native';
import {ref, getDownloadURL} from '@firebase/storage';  
import {storage} from '../../Firebase/config';
import { useState } from 'react';
import { Image } from 'react-native';
import { Audio } from 'expo-av';
import BackButton from '../components/BackButton';
import MuscleGroupsSection from '../components/MuscleGroupsSection';
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog'
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const  countDownAudio = require('../../assets/audio/countdownaudio.mp3');

const WorkoutOTDScreen = () => {
const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const {name,url} = route.params;
  const initialTime = 60;
  const minTime = 10;
  const selectedExercise = EXERCISE_CATALOG.find((exercise) => exercise.gif_url === name);
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [countDownSound, setCountDownSound] = useState();


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




  
  return (
    <View className='flex-1 bg-momentum-bg'>
    {url ? (
     <Image source={{uri: url}} className='w-full h-80'/>
   ) :(
   <View className='justify-center items-center w-full h-80'>
     <ActivityIndicator size={"large"} color={"#2dd4bf"}/>
   </View>)
     }
     <View style={{ position: 'absolute', left: 16, top: insets.top + 12, zIndex: 50 }}>
       <BackButton mode="light" />
     </View>
     <ScrollView >
       <View className='mt-4 mx-3'>
         {selectedExercise ? (
           <>
         <Text className='text-2xl font-bold text-center mb-1 text-ui-text-primary'>{selectedExercise.title}</Text>
         <Text className='text-ui-text-secondary mt-1'>
           {selectedExercise.category.split(', ').map((cat, index) => (
             <View key={index} className='mr-2'>
               <View className='mr-2 bg-ui-surface border border-momentum-border rounded-2xl px-2'>
                 <Text className='text-primary'>{cat}</Text>
               </View>
             </View>
           ))}
         </Text>
         <View className='flex-row items-center space-x-2 mt-2'>
           <Text className='font-semibold text-primary'>Intensity:</Text>
           <Text className='text-ui-text-secondary italic text-base'>{selectedExercise.intensity}</Text>
         </View>
         <MuscleGroupsSection muscleGroups={selectedExercise.muscleGroups} />
         <Text className='text-xl font-semibold mt-4 text-ui-text-primary'>Instructions:</Text>
         <View className='mt-2'>
           {selectedExercise.instructions.map((instruction) => (
             <View key={instruction.step} className='flex-row items-center space-x-2 '>
               <Text className='text-base text-ui-text-tertiary mb-2'>{instruction.step}.</Text>
               <Text className='ml-2 text-base text-ui-text-primary'>{instruction.text}</Text>
             </View>
           ))}
         </View>
           </>
         ) : (
           <Text className="text-center text-gray-600 mb-2">
             Exercise details not found for this file. You can still use the timer below.
           </Text>
         )}
       </View>
       <View className='mt-4 flex-row items-center justify-center space-x-3'>
         <TouchableOpacity onPress={handleDecreaseTime} className='items-center justify-center w-14 h-14 bg-red-500 rounded-full' >
           <Text className='text-white text-4xl'>-</Text>
         </TouchableOpacity>
         <Text className='text-xl font-bold text-ui-text-primary'>{time} secs</Text>
         <TouchableOpacity onPress={handleIncreaseTime} className='items-center justify-center w-14 h-14 bg-primary rounded-full'>
           <Text className='text-white text-3xl'>+</Text>
         </TouchableOpacity>
       </View>
       <View className='mt-4 flex-row  items-center justify-center space-x-3 mb-10'>
         <TouchableOpacity onPress={isRunning ? handlePause : handleStart} disabled={time === 0}>
           <Text className={`text-primary text-xl py-2 border rounded-lg border-primary px-4 ${time === 0 ? 'opacity-50' : ''}`}>
             {isRunning ? "PAUSE" : "START"}
           </Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={handleReset}>
           <Text className='text-ui-text-secondary text-xl py-2 border rounded-lg border-momentum-border px-4'>RESET</Text>
         </TouchableOpacity>
       </View>
     </ScrollView>
   
  
     </View>
 );
}

export default WorkoutOTDScreen