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
    <View>
     {gifUrl ? (
      <Image source={{uri: gifUrl}} className='w-full h-80'/>
    ) :(
    <View className='justify-center items-center'>
      <ActivityIndicator size={"large"} color={"gray"}/>
    </View>)
      }
      <ScrollView className=''>
        <View>
          <Text className=''>{item.title}</Text>
          <Text className=''>
            {item.category.split(',').map((cat, index) => (
              <View key={index}>
                <View>
                  <Text>{cat}</Text>
                </View>
              </View>
            ))}
          </Text>
          <View>
            <Text>Itensity:</Text>
            <Text>{item.intensity}</Text>
          </View>
          <Text>Instructions:</Text>
          <View>
            {item.instructions.map((instruction) => (
              <View key={instruction.step}>
                <Text>{instruction.step}</Text>
                <Text>{instruction.text}</Text>
              </View>
            ))}
          </View>
        </View>
        <View>
          <TouchableOpacity>
            <Text>-</Text>
          </TouchableOpacity>
          <Text>10 Seconds</Text>
          <TouchableOpacity>
            <Text>+</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity>
            <Text>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
   
      </View>
  );
};

export default ExerciseScreen;