import { View, Text } from 'react-native'
import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'

const WorkoutScreen = () => {
  return (
    <SafeAreaView className='mx-[1%]'>
      <Welcome></Welcome>
      <WorkoutOTD></WorkoutOTD>
    </SafeAreaView>
  )
}

export default WorkoutScreen