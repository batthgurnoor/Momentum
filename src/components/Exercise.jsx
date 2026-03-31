import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import ExerciseItems from './ExerciseItems'
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const Exercise = () => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: WH.accent }]}>LIBRARY</Text>
          <Text style={[styles.title, { color: WH.text }]}>Exercises</Text>
          <Text style={[styles.sub, { color: WH.textDim }]}>
            Browse moves with instructions & timers
          </Text>
        </View>
        <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
          <Ionicons name="fitness-outline" size={22} color={WH.accent} />
        </View>
      </View>
      <ExerciseItems />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 260,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})

export default Exercise;
