import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { ref, getDownloadURL } from '@firebase/storage';
import { storage } from '../../Firebase/config';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import MuscleGroupsSection from '../components/MuscleGroupsSection';
import { COLORS } from '../theme/colors';

const countDownAudio = require('../../assets/audio/countdownaudio.mp3');

const APP = COLORS.app;
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.min(300, Math.round(SCREEN_W * 0.78));

function formatTimer(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

const ExerciseScreen = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const initialTime = 60;
  const minTime = 10;

  const [gifUrl, setGifUrl] = useState(null);
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [countDownSound, setCountDownSound] = useState();

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(countDownAudio);
    setCountDownSound(sound);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setIsAudioPlaying(false);
      }
    });
    await sound.playAsync();
    setIsAudioPlaying(true);
  }

  const fetchGifUrl = async () => {
    try {
      const storageRef = ref(storage, `AllExercises/${item.gif_url}`);
      const url = await getDownloadURL(storageRef);
      setGifUrl(url);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchGifUrl();
  }, [item?.gif_url]);

  const handleDecreaseTime = () => {
    if (!isRunning && time > minTime) {
      setTime((prevTime) => prevTime - 10);
    }
  };

  const handleIncreaseTime = () => {
    if (!isRunning) {
      setTime((prevTime) => prevTime + 10);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFirstTime(true);
    setTime(initialTime);
    if (countDownSound && isAudioPlaying) {
      countDownSound.stopAsync();
      setIsAudioPlaying(false);
    }
  };

  useEffect(() => {
    let countDownInterval;
    if (isRunning && time > 0) {
      countDownInterval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) return 0;
          const next = prevTime - 1;
          if (next === 4) playSound();
          return next;
        });
      }, 1000);
    } else {
      setIsRunning(false);
      clearInterval(countDownInterval);
    }
    return () => clearInterval(countDownInterval);
  }, [isRunning, time]);

  const handleStart = () => {
    if (!isRunning && isFirstTime) {
      setIsFirstTime(false);
      setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const categories = item.category ? item.category.split(', ').filter(Boolean) : [];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[APP.bgTop, APP.bgMid, APP.bgBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
      >
        <View style={[styles.heroWrap, { height: HERO_H }]}>
          {gifUrl ? (
            <Image source={{ uri: gifUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <ActivityIndicator size="large" color={APP.accent} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(12,14,20,0.2)', 'rgba(18,21,31,0.65)']}
            locations={[0.5, 0.82, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.backRow, { top: insets.top + 8 }]}>
            <BackButton mode="light" />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{item.title}</Text>

          {categories.length > 0 ? (
            <View style={styles.chipRow}>
              {categories.map((cat, index) => (
                <View key={`${cat}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{cat.trim()}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Intensity</Text>
              <View style={styles.intensityPill}>
                <Text style={styles.intensityText}>{item.intensity}</Text>
              </View>
            </View>
          </View>

          <MuscleGroupsSection muscleGroups={item.muscleGroups} />

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {item.instructions.map((instruction) => (
              <View key={instruction.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{instruction.step}</Text>
                </View>
                <Text style={styles.stepText}>{instruction.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Rest / hold timer</Text>
            <View style={styles.timerRow}>
              <TouchableOpacity
                onPress={handleDecreaseTime}
                disabled={isRunning || time <= minTime}
                style={[
                  styles.timerBtn,
                  styles.timerBtnMinus,
                  (isRunning || time <= minTime) && styles.timerBtnDisabled,
                ]}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={28} color="#fff" />
              </TouchableOpacity>

              <View style={styles.timerDisplay}>
                <Text style={styles.timerValue}>{formatTimer(time)}</Text>
                <Text style={styles.timerUnit}>Tap + / − to adjust (±10s)</Text>
              </View>

              <TouchableOpacity
                onPress={handleIncreaseTime}
                disabled={isRunning}
                style={[styles.timerBtn, styles.timerBtnPlus, isRunning && styles.timerBtnDisabled]}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={28} color={APP.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timerActions}>
              <TouchableOpacity
                onPress={isRunning ? handlePause : handleStart}
                disabled={time === 0}
                style={[styles.primaryBtn, time === 0 && styles.primaryBtnDisabled]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={20}
                  color={COLORS.text.onPrimary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryBtnText}>{isRunning ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleReset} style={styles.secondaryBtn} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP.bgTop,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroWrap: {
    width: '100%',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0a0c12',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRow: {
    position: 'absolute',
    left: 12,
    zIndex: 20,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: APP.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  chipText: {
    color: APP.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  metaCard: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: APP.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  intensityPill: {
    backgroundColor: APP.accentMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  intensityText: {
    color: APP.accent,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  sectionCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP.text,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: APP.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: APP.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: APP.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  timerCard: {
    marginTop: 20,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  timerLabel: {
    color: APP.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtnMinus: {
    backgroundColor: COLORS.ui.error,
    opacity: 0.95,
  },
  timerBtnPlus: {
    backgroundColor: APP.accent,
  },
  timerBtnDisabled: {
    opacity: 0.35,
  },
  timerDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '800',
    color: APP.text,
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    marginTop: 2,
    fontSize: 13,
    color: APP.textDim,
    fontWeight: '600',
  },
  timerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 148,
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: COLORS.text.onPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryBtnText: {
    color: APP.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ExerciseScreen;
