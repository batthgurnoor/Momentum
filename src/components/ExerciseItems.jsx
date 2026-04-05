import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Platform } from 'react-native'
import React, { useMemo } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { EXERCISE_CATALOG } from '../utils/exerciseCatalog'
import { FlashList } from '@shopify/flash-list'
import { useNavigation } from '@react-navigation/native'
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const exerciseImage = require('../../assets/images/exercise1.jpg')

const ExerciseItems = () => {
  const navigation = useNavigation();

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("Exercise", { item })}
      style={styles.cardOuter}
    >
      <ImageBackground
        source={exerciseImage}
        style={styles.cardBg}
        imageStyle={styles.cardImage}
      >
        <LinearGradient
          colors={['rgba(15,23,42,0.2)', 'rgba(0,0,0,0.82)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topTag}>
          <Text style={styles.tagText} numberOfLines={1}>{item.category}</Text>
        </View>
        <View style={styles.bottomBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.tapHint}>Tap to start</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )

  return (
    <View style={styles.listWrap}>
      <FlashList
        data={gridRows}
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {renderWorkoutItem({ item: row.left })}
            {row.right ? renderWorkoutItem({ item: row.right }) : <View style={{ flex: 1, marginHorizontal: 4 }} />}
          </View>
        )}
        keyExtractor={(row) => row.key}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={200}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  listWrap: {
    minHeight: 400,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 2,
    marginVertical: 8,
  },
  cardOuter: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WH.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardBg: {
    height: 168,
    width: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 18,
  },
  topTag: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
    maxWidth: '90%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  tagText: {
    color: WH.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottomBlock: {
    padding: 12,
  },
  cardTitle: {
    color: WH.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  tapHint: {
    marginTop: 6,
    fontSize: 11,
    color: WH.accent,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
})

export default ExerciseItems;
