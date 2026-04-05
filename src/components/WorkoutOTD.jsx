import { View, Text, ImageBackground, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native'
import React from 'react'
const otdImage = require('../../assets/images/workoutotd.jpg')
import { LinearGradient } from 'expo-linear-gradient'
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../../Firebase/config';
import {
  useFonts,
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors'

const WH = COLORS.workoutHome

const WorkoutOTD = ({ prefetched }) => {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });
  if (!fontsLoaded) {
    return null;
  }

  const getExerciseOTD = async () => {
    if (prefetched?.name && prefetched?.url) {
      navigation.navigate('WorkoutOTDScreen', { name: prefetched.name, url: prefetched.url });
      return;
    }
    try {
      const date = new Date().getDate();
      const rootRef = ref(storage, `AllExercises/`);
      const res = await listAll(rootRef);

      if (!res.items.length) {
        Alert.alert('No exercises', 'No exercises found in storage.');
        return;
      }

      const idx = date % res.items.length;
      const exerciseUrl = res.items[idx].fullPath;
      const url = await getDownloadURL(ref(storage, exerciseUrl));
      const exerciseName = exerciseUrl.split('/').pop();

      navigation.navigate('WorkoutOTDScreen', { name: exerciseName, url });
    } catch (e) {
      Alert.alert('Error', e?.message ?? 'Could not load workout of the day.');
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={getExerciseOTD}
      style={styles.touch}
    >
      <View style={styles.card}>
        <ImageBackground
          source={otdImage}
          style={styles.image}
          imageStyle={styles.imageRadius}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.badge}>
            <Ionicons name="flash" size={14} color={WH.accent} />
            <Text style={[styles.badgeText, { color: WH.accent }]}>DAILY PICK</Text>
          </View>
          <View style={styles.bottom}>
            <Text style={[styles.title, { fontFamily: 'Lato_700Bold', color: WH.text }]}>
              Workout of the day
            </Text>
            <Text style={[styles.hint, { fontFamily: 'Lato_400Regular', color: WH.textMuted }]}>
              {prefetched?.error && !prefetched?.url
                ? 'Tap to try again'
                : prefetched?.loading && !prefetched?.url
                  ? `Tap to open — loading today's exercise...`
                  : `Tap to open today's exercise`}
            </Text>
            <View style={[styles.ctaRow, { borderColor: WH.cardBorder }]}>
              <Text style={[styles.cta, { fontFamily: 'Lato_700Bold', color: WH.accent }]}>
                Start
              </Text>
              <Ionicons name="arrow-forward" size={18} color={WH.accent} />
            </View>
          </View>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  touch: {
    alignItems: 'center',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WH.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  image: {
    height: 200,
    width: '100%',
    justifyContent: 'space-between',
  },
  imageRadius: {
    borderRadius: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    marginLeft: 14,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: WH.cardBorder,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bottom: {
    padding: 16,
    paddingTop: 0,
  },
  title: {
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: WH.accentMuted,
    borderWidth: 1,
  },
  cta: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
})

export default WorkoutOTD;
