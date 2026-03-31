import { View, Text, FlatList, TouchableOpacity, ImageBackground, StyleSheet, Platform } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const beginner = require("../../assets/images/beginner.jpg")
const balance = require("../../assets/images/balance.jpg")
const gentle = require("../../assets/images/gentle.jpg")
const intense = require("../../assets/images/intense.jpg")
const moderate = require("../../assets/images/moderate.jpg")
const strength = require("../../assets/images/strength.jpg")
const toning = require("../../assets/images/toning.jpg")

const workoutData = [
    { id: 1, imageSource: balance, numberOfExercises: 9, title: 'Balance' },
    { id: 2, imageSource: beginner, numberOfExercises: 7, title: 'Beginner' },
    { id: 3, imageSource: gentle, numberOfExercises: 5, title: 'Gentle' },
    { id: 4, imageSource: intense, numberOfExercises: 8, title: 'Intense' },
    { id: 5, imageSource: moderate, numberOfExercises: 23, title: 'Moderate' },
    { id: 6, imageSource: strength, numberOfExercises: 11, title: 'Strength' },
    { id: 7, imageSource: toning, numberOfExercises: 10, title: 'Toning' },
];

const CategoryItems = () => {
  const navigation = useNavigation();

  const handleExercisePress = (intensity) => {
    navigation.navigate('CategoryExercise', { intensity });
  }

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleExercisePress(item.title)}
      style={styles.cardOuter}
    >
      <ImageBackground
        source={item.imageSource}
        style={styles.cardBg}
        imageStyle={styles.cardImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.chip}>
          <FontAwesome5 name="dumbbell" size={12} color={WH.accent} />
          <Text style={styles.chipText}>{item.numberOfExercises}</Text>
        </View>
        <View style={styles.labelBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={workoutData}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listPad}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  listPad: {
    paddingRight: 8,
    paddingBottom: 4,
  },
  cardOuter: {
    marginHorizontal: 6,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WH.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardBg: {
    height: 152,
    width: 132,
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  chipText: {
    color: WH.text,
    fontSize: 13,
    fontWeight: '800',
  },
  labelBlock: {
    padding: 12,
    paddingTop: 0,
  },
  cardTitle: {
    color: WH.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
})

export default CategoryItems
