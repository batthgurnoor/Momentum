import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useRoute } from '@react-navigation/native';
import {ref, getDownloadURL} from '@firebase/storage';  
import {storage} from '../../Firebase/config';
import { useState } from 'react';
import { Image } from 'react-native';

const ExerciseScreen = () => {

  const route = useRoute();
  const initialTime = 60;
  const minTime = 10;
  const {item} = route.params;

  const [gifUrl, setGifUrl] = useState(null);
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  

  const fetchGifUrl = async () => {
    try {

      const storageRef = ref(storage, `AllExercises/${item.gif_url}`);
      const url = await getDownloadURL(storageRef);
      setGifUrl(url);
      
    }
  catch (error) {}


  }

  useEffect (() => {
    fetchGifUrl();
    
  },[]);
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
  };  

  useEffect(() => {
    
    let countDownInterval;
    //console.log("inside time decrase useffect")
    if (isRunning && time > 0) {
      countDownInterval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      },1000)
    }
    else{
      setIsRunning(false);
      clearInterval(countDownInterval);
    }

    return () => {clearInterval(countDownInterval)};
  }, [isRunning, time]);


  const handleStart =() => {

  console.log("Is first time -",isFirstTime,"is running -",isRunning);
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



  return (
    <View className='flex-1'>
     {gifUrl ? (
      <Image source={{uri: gifUrl}} className='w-full h-80'/>
    ) :(
    <View className='justify-center items-center w-full h-80'>
      <ActivityIndicator size={"large"} color={"gray"}/>
    </View>)
      }
      <ScrollView >
        <View className='mt-4 mx-3'>
          <Text className='text-2xl font-bold text-center mb-1'>{item.title}</Text>
          <Text className='text-gray-500 mt-1'>
            {item.category.split(', ').map((cat, index) => (
              <View key={index} className='mr-2'>
                <View className='mr-2 bg-gray-300 rounded-2xl px-2 '>
                  <Text className='text-fuchsia-500'>{cat}</Text>
                </View>
              </View>
            ))}
          </Text>
          <View className='flex-row items-center space-x-2 mt-2'>
            <Text className='font-semibold text-blue-500'>Itensity:</Text>
            <Text className='text-cyan-400 italic text-base'>{item.intensity}</Text>
          </View>
          <Text className='text-xl font-semibold mt-4'>Instructions:</Text>
          <View className='mt-2'>
            {item.instructions.map((instruction) => (
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
          <TouchableOpacity onPress={isRunning ? handlePause : handleStart}>
            <Text className='text-blue-500 text-xl py-2 border rounded-lg border-blue-500 px-4'>
              {isRunning ? "PAUSE" : "START"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset}>
            <Text className='text-bray-500 text-xl py-2 border rounded-lg border-gray-500 px-4'>RESET</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
   
      </View>
  );
};

export default ExerciseScreen;