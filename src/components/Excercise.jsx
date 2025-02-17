import { View, Text } from 'react-native'
import React from 'react'
import ExerciseItems from '../components/ExerciseItems'
const Excercise = () => {
  return (
    <View>
    <View className='flex-row items-center justify-between mx-10 mb-3'>
        <Text className='text-xl font-bold'>Exercises</Text>
    </View>
    <ExerciseItems></ExerciseItems>
    </View>
  )
}

export default Excercise;