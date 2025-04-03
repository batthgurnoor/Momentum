import {  GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { View, Text,StyleSheet, } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
import Exercise from '../components/Exercise'
const WorkoutScreen = () => {


  const styles = StyleSheet.create({
      background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
      },
    });
  return (

    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
            
    colors={['rgba(0,0,0,0.8)', 'transparent']}
    style={styles.background}
  >
  <ScrollView >
    <SafeAreaView className='mx-[1%]'>
      <Welcome></Welcome>

      
      <WorkoutOTD />
      <Separator />
      <Category></Category>
      <Separator />
      <Exercise/>
     
    </SafeAreaView>
    </ScrollView></LinearGradient>
     </GestureHandlerRootView>
  )
}

export default WorkoutScreen