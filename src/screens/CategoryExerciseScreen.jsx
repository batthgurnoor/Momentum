
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useRoute } from '@react-navigation/native';
import {ref, getDownloadURL, listAll} from '@firebase/storage';  
import {storage} from '../../Firebase/config';
import { useState } from 'react';
import { Image } from 'react-native';
import { Audio } from 'expo-av';
import BackButton from '../components/BackButton';
import ExerciseData from '../../exercise_data'
import AntDesign from '@expo/vector-icons/AntDesign';





const  countDownAudio = require('../../assets/audio/countdownaudio.mp3');


const CategoryExerciseScreen = () => {

    const route = useRoute();
    const {intensity} = route.params;
    const initialTime = 60;
      const minTime = 10;
      const [gifUrl, setGifUrl] = useState(null);
      const [time, setTime] = useState(initialTime);
      const [isRunning, setIsRunning] = useState(false);
      const [isAudioPlaying, setIsAudioPlaying] = useState(false);
      const [isFirstTime, setIsFirstTime] = useState(true);
      const [countDownSound, setCountDownSound] = useState();
      const [exercises, setExercises] = useState([]);
      const [categoryExercises, setCategoryExercises] = useState([]);
      const [exerciseIndex, setExerciseIndex] = useState(0);  

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
      const matchingExercises = []
      listAll(storageRef).then((res) => {
        res.items.forEach((item) => {
          const fileName = item.name.split('/').pop();
          const matchingExercise= ExerciseData.find((exercise) => 
            exercise.gif_url === fileName);
          if(matchingExercise){
            matchingExercises.push(matchingExercise);
          }
        })
        setExercises(matchingExercises);
      })
    } catch (error) {      
    }    
  }

  useEffect(() => {
    fetchExercisesByIntensity(intensity);
  },[]);

 const fetchGifUrl = async (exercise) => {
     try {
       const storageRef = ref(storage, `${intensity}Exercises/${exercise.gif_url}`);
       const url = await getDownloadURL(storageRef);
       return url;
     }
   catch (error) {
    console.log("error =", error);
    return null
    
   }
   }

   useEffect(() => {
    const fetchGifUrlsForExercises = async () => {
      const exerciseWithGifUrl = await Promise.all(
        exercises.map(async (exercise) => {
          const gifUrl = await fetchGifUrl(exercise)
          return{
            ...exercise,
            gif_url: gifUrl
          }
        }
      ));
      setCategoryExercises(exerciseWithGifUrl)
      
    }
    fetchGifUrlsForExercises();
   },[exercises])

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
        //console.log("inside time decrase useffect")
        if (isRunning && time > 0) {
          countDownInterval = setInterval(() => {
            setTime((prevTime) => prevTime - 1);
            if(time === 4){
              
              playSound();
            }
          },1000)
        }
        else{
          setIsRunning(false);
          clearInterval(countDownInterval);
        }
        return () => {clearInterval(countDownInterval)};
      }, [isRunning, time]);
    
      const handleStart =() => {
        if(!isRunning & isFirstTime){
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

  return (
    <View className='flex-1'>
      { currentExercise ? (
        <>
         <Image source={{uri: currentExercise.gif_url}} className='w-full h-80'/>
      
      <BackButton />
      <ScrollView >
        <View className='mt-4 mx-3'>
          <Text className='text-2xl font-bold text-center mb-1'>
            {currentExercise.title}
            </Text>
          <Text className='text-gray-500 mt-1'>
            {currentExercise.category.split(', ').map((cat, index) => (
              <View key={index} className='mr-2'>
                <View className='mr-2 bg-gray-300 rounded-2xl px-2 '>
                  <Text className='text-fuchsia-500'>{cat}</Text>
                </View>
              </View>
            ))}
          </Text>
          <View className='flex-row items-center space-x-2 mt-2'>
            <Text className='font-semibold text-blue-500'>Itensity:</Text>
            <Text className='text-cyan-400 italic text-base'>{currentExercise.intensity}</Text>
          </View>
          <Text className='text-xl font-semibold mt-4'>Instructions:</Text>
          <View className='mt-2'>
            {currentExercise.instructions.map((instruction) => (
              <View key={instruction.step} className='flex-row items-center space-x-2 '>
                <Text className='text-base text-gray-600 mb-2'>{instruction.step}.</Text>
                <Text className='ml-2 text-base '>{instruction.text}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className='mt-4 flex-row items-center justify-center space-x-3'>
          <TouchableOpacity onPress={handleDecreaseTime} className='items-center justify-center w-14 h-14 bg-red-500 rounded-full' >
            <Text className='text-white text-4xl'>-</Text>
          </TouchableOpacity>
          <Text className='text-xl font-bold'>{time} secs</Text>
          <TouchableOpacity onPress={handleIncreaseTime} className='items-center justify-center w-14 h-14 bg-green-500 rounded-full'>
            <Text className='text-white text-3xl'>+</Text>
          </TouchableOpacity>
        </View>
        <View className='mt-4 flex-row  items-center justify-center space-x-3 mb-10'>
        <TouchableOpacity onPress={navigateToPreviousExercise}>           
            <AntDesign name="leftcircleo" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={isRunning ? handlePause : handleStart} disabled={time === 0}>
            <Text className={`text-blue-500 text-xl py-2 border rounded-lg border-blue-500 px-4 ${time === 0 ? 'opacity-50' : ''}`}>
              {isRunning ? "PAUSE" : "START"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset}>
            <Text className='text-bray-500 text-xl py-2 border rounded-lg border-gray-500 px-4'>RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToNextExercise}>           
            <AntDesign name="rightcircleo" size={30} color="black" />
          </TouchableOpacity>
          </View>
      </ScrollView>  
        </>
      ) : <View className='justify-center items-center w-full h-80'>
      <ActivityIndicator size={"large"} color={"gray"}/>
    </View>}
      
       
      </View>
  )
}

export default CategoryExerciseScreen