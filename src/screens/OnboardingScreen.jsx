import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { auth } from '../../Firebase/config';
import { markOnboardingComplete } from '../utils/onboardingStorage';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  {
    key: 'welcome',
    icon: 'barbell',
    title: 'Welcome to Momentum',
    body:
      'This short tour shows what you can do in the app. You can skip anytime and you will not see it again for this account.',
  },
  {
    key: 'today',
    icon: 'sunny',
    title: 'Today',
    body:
      'Your home base: browse workouts, open the workout of the day, explore exercises by category, and jump into quick actions from one place.',
  },
  {
    key: 'train',
    icon: 'fitness',
    title: 'Train',
    body:
      'Start a live session with a timer and sets, build weekly routines, repeat your last session, or open your saved plans when you are ready to move.',
  },
  {
    key: 'progress',
    icon: 'stats-chart',
    title: 'Progress',
    body:
      'See how your weeks stack up: activity history, session summaries, and weight entries so you can notice trends over time.',
  },
  {
    key: 'profile',
    icon: 'person',
    title: 'Profile',
    body:
      'Keep your details and metrics up to date, set workout and hydration reminders, adjust your photo, and manage your account when you need to.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const scrollToPage = useCallback((i) => {
    const clamped = Math.max(0, Math.min(i, STEPS.length - 1));
    listRef.current?.scrollToOffset({ offset: clamped * SCREEN_WIDTH, animated: true });
    setIndex(clamped);
  }, []);

  const finish = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    await markOnboardingComplete(uid);
    navigation.replace('TabNav');
  }, [navigation]);

  const goNext = useCallback(() => {
    if (index < STEPS.length - 1) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollToPage(index + 1);
    } else {
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finish();
    }
  }, [index, finish, scrollToPage]);

  const goBack = useCallback(() => {
    if (index > 0) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollToPage(index - 1);
    }
  }, [index, scrollToPage]);

  const onMomentumScrollEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SCREEN_WIDTH);
    if (i >= 0 && i < STEPS.length) setIndex(i);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={[styles.iconWrap, { borderColor: APP.cardBorder, backgroundColor: APP.accentMuted }]}>
          <Ionicons name={item.icon} size={40} color={APP.accent} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideBody}>{item.body}</Text>
      </View>
    ),
    []
  );

  const isLast = index === STEPS.length - 1;

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip tour">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={STEPS}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {index > 0 ? (
              <TouchableOpacity style={styles.secondaryBtn} onPress={goBack} activeOpacity={0.88}>
                <Ionicons name="chevron-back" size={22} color={APP.text} />
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>{isLast ? 'Get started' : 'Next'}</Text>
            {!isLast ? <Ionicons name="chevron-forward" size={20} color={COLORS.text.onPrimary} /> : null}
          </TouchableOpacity>
          <View style={styles.footerLeft} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  skipText: {
    color: COLORS.text.secondary,
    fontWeight: '700',
    fontSize: 15,
  },
  slide: {
    paddingHorizontal: 28,
    paddingTop: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  slideTitle: {
    color: APP.accent,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideBody: {
    color: COLORS.text.primary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.92,
    maxWidth: 340,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: APP.accent,
    width: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  footerLeft: {
    width: 96,
    alignItems: 'flex-start',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minWidth: 88,
  },
  secondaryBtnText: {
    color: APP.text,
    fontWeight: '700',
    fontSize: 16,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: APP.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    maxWidth: 280,
  },
  primaryBtnText: {
    color: COLORS.text.onPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
});
