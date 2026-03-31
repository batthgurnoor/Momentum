import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import {
  useFonts,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat'
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const Welcome = () => {
  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
  })
  if (!fontsLoaded) {
    return null
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: WH.accent }]}>TODAY</Text>
      <Text style={[styles.title, { fontFamily: 'Caveat_700Bold', color: WH.text }]}>
        Welcome back
      </Text>
      <Text style={[styles.sub, { color: WH.textMuted }]}>
        Pick your focus — categories by intensity or browse all exercises.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    maxWidth: 340,
  },
})

export default Welcome
