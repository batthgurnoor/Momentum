import { View, Text, ImageBackground,TouchableOpacity } from 'react-native'
import React from 'react'
const otdImage = require('../../assets/images/workoutotd.jpg')
import { useNotification } from 'NotificationContext'

import {
  useFonts,
  Lato_400Regular,
} from '@expo-google-fonts/lato';


const WorkoutOTD = () => {
  let [fontsLoaded] = useFonts({
    Lato_400Regular,
  });

  const { showSuccess, showInfo } = useNotification();
  
  const handleWorkoutSelect = () => {
    showSuccess('Workout of the day loaded!');
  };

  if (!fontsLoaded) {
    return null;
  }
  return (
    <TouchableOpacity 
      className="items-center justify-center" 
      onPress={handleWorkoutSelect}
    >
      <View className="rounded-3xl overflow-hidden h-40 w-[80%]">
        <ImageBackground
          source={otdImage}
          className="flex-1 justify-center items-center"
          resizeMode="cover">
            <View>
              <Text 
                className="text-white/70 text-3xl tracking-tighter" 
                style={{ fontFamily: 'Lato_400Regular' }}
              >
                Workout Of the Day
              </Text>
            </View>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  )
}

export default WorkoutOTD;