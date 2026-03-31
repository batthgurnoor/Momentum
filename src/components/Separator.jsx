import { View, StyleSheet } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const Separator = () => {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[WH.cardBorder, WH.accent, WH.cardBorder]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 22,
  },
  line: {
    height: 2,
    width: '42%',
    maxWidth: 200,
    borderRadius: 2,
    opacity: 0.85,
  },
})

export default Separator
