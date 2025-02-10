import { View, Text } from 'react-native'
import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
const WorkoutScreen = () => {
  return (
    <SafeAreaView className='mx-[1%]'>
      <Welcome></Welcome>
      <WorkoutOTD></WorkoutOTD>
      <Separator />
      <Category></Category>
    </SafeAreaView>
  )
}

export default WorkoutScreen