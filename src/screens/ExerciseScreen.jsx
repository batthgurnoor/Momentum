import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useRoute } from '@react-navigation/native';
import {ref, getDownloadURL} from '@firebase/storage';  
import {storage} from '../../Firebase/config';
import { useState } from 'react';
import { Image } from 'react-native';

const ExerciseScreen = () => {

  const route = useRoute();

  const {item} = route.params;

  const [gifUrl, setGifUrl] = useState(null);
  

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

  return (
    <View className='flex-1'>
     {gifUrl ? (
      <Image source={{uri: gifUrl}} className='w-full h-80'/>
    ) :(
    <View className='justify-center items-center'>
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
          <TouchableOpacity className='items-center justify-center w-14 h-14 bg-red-500 rounded-full' >
            <Text className='text-white text-4xl'>-</Text>
          </TouchableOpacity>
          <Text className='text-xl font-bold'>10 Seconds</Text>
          <TouchableOpacity className='items-center justify-center w-14 h-14 bg-green-500 rounded-full'>
            <Text className='text-white text-3xl'>+</Text>
          </TouchableOpacity>
        </View>
        <View className='mt-4 flex-row  items-center justify-center space-x-3 mb-10'>
          <TouchableOpacity>
            <Text className='text-blue-500 text-xl py-2 border rounded-lg border-blue-500 px-4'>START</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className='text-bray-500 text-xl py-2 border rounded-lg border-gray-500 px-4'>RESET</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
   
      </View>
  );
};

export default ExerciseScreen;