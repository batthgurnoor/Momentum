import {  GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { View, Text, } from 'react-native'

import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
import Exercise from '../components/Excercise'
const WorkoutScreen = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
  <ScrollView >
    <SafeAreaView className='mx-[1%]'>
      <Welcome></Welcome>

      
      <WorkoutOTD />
      <Separator />
      <Category></Category>
      <Separator />
      <Exercise/>
     
    </SafeAreaView>
    </ScrollView>
     </GestureHandlerRootView>
  )
}

export default WorkoutScreen