import { View, Text, ImageBackground,TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
const otdImage = require('../../assets/images/workoutotd.jpg')
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../../Firebase/config';
import {
  useFonts,
  Lato_400Regular,
} from '@expo-google-fonts/lato';
import { useNavigation } from '@react-navigation/native';



const WorkoutOTD = () => {
  const navigation = useNavigation();
  const [workoutOTDUrl, setWorkoutOTDUrl] = useState(null);
  const [workoutName, setWorkoutName] = useState(null);
  let [fontsLoaded] = useFonts({
    Lato_400Regular,
  });
  if (!fontsLoaded) {
    return null;
  }
  
const getExerciseOTD = async () => {

  const date = new Date().getDate();
  const storageRef = ref(storage, `AllExercises/`);


  listAll(storageRef).then(async (res) => {
    const exerciseUrl = res.items[date%29].fullPath;
    await getDownloadURL(ref(storage, exerciseUrl)).then((url) => {
      setWorkoutOTDUrl(url);
      const exerciseName = exerciseUrl.split('/').pop();
      setWorkoutName(exerciseName);
      
      navigation.navigate("WorkoutOTDScreen",{name:workoutName, url:workoutOTDUrl});
    });
  });
};

  return (
    <TouchableOpacity 
    onPress={getExerciseOTD}
    className="items-center justify-center">
      <View className="rounded-3xl overflow-hidden h-40 w-[80%]">
        <ImageBackground
           source ={otdImage}
            className="flex-1 justify-center items-center"
            resizeMode="cover">
              <View>
                <Text className="text-white/70 text-3xl tracking-tighter" style= {{fontFamily: 'Lato_400Regular'}}>
                  Workout Of the Day
                </Text>
              </View>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  )
}


export default WorkoutOTD;