import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
import Exercise from '../components/Exercise'
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const WorkoutScreen = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={[WH.bgTop, WH.bgMid, WH.bgBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView style={styles.safe}>
          <Welcome />
          <WorkoutOTD />
          <Separator />
          <Category />
          <Separator />
          <Exercise />
        </SafeAreaView>
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  safe: {
    paddingHorizontal: 20,
  },
})

export default WorkoutScreen
