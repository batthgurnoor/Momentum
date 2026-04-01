import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react'
import Welcome from '../components/welcome'
import WorkoutOTD from '../components/WorkoutOTD';
import { SafeAreaView } from 'react-native-safe-area-context'
import Separator from '../components/Separator'
import Category from '../components/Category'
import Exercise from '../components/Exercise'
import { COLORS } from '../theme/colors'
import { useNavigation } from '@react-navigation/native';

const WH = COLORS.workoutHome

const WorkoutScreen = () => {
  const navigation = useNavigation();
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Session')}
            style={styles.startSession}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Start a session</Text>
              <Text style={styles.startSub}>Track sets, rest, and save your workout</Text>
            </View>
            <Text style={styles.startCta}>Start</Text>
          </TouchableOpacity>
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
  startSession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
    marginBottom: 14,
  },
  startTitle: {
    color: WH.text,
    fontSize: 16,
    fontWeight: '800',
  },
  startSub: {
    color: WH.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  startCta: {
    color: WH.accent,
    fontSize: 14,
    fontWeight: '900',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
})

export default WorkoutScreen
