import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import exerciseData from '../../exercise_data.json';
import { auth, db } from '../../Firebase/config';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { resolveExerciseGifUrl } from '../utils/exerciseGifUrls';

const APP = COLORS.app;
const WH = COLORS.workoutHome;
const exerciseFallbackImage = require('../../assets/images/exercise1.jpg');

function TrainExerciseCardMedia({ intensity, gifFileName, style, imageStyle, children }) {
  const [uri, setUri] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setResolving(true);
    setUri(null);

    (async () => {
      const url = await resolveExerciseGifUrl(intensity, gifFileName);
      if (cancelled) return;
      setUri(url);
      setResolving(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [intensity, gifFileName]);

  return (
    <ImageBackground
      source={uri ? { uri } : exerciseFallbackImage}
      style={style}
      imageStyle={imageStyle}
      resizeMode="cover"
    >
      {resolving ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <ActivityIndicator size="small" color={WH.accent} />
        </View>
      ) : null}
      {children}
    </ImageBackground>
  );
}

export default function TrainScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [searchQuery, setSearchQuery] = useState('');
  const [recentRoutines, setRecentRoutines] = useState([]);
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    if (!user) {
      setRecentRoutines([]);
      setLastSession(null);
      return;
    }

    const routinesRef = collection(db, 'users', user.uid, 'routines');
    const routinesQ = query(routinesRef, orderBy('updatedAt', 'desc'), limit(3));
    const unsubRoutines = onSnapshot(
      routinesQ,
      (snap) => setRecentRoutines(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.log('Train routines error:', err);
        setRecentRoutines([]);
      }
    );

    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const sessionsQ = query(sessionsRef, orderBy('timestamp', 'desc'), limit(1));
    const unsubSessions = onSnapshot(
      sessionsQ,
      (snap) => {
        const doc = snap.docs[0];
        setLastSession(doc ? { id: doc.id, ...doc.data() } : null);
      },
      (err) => {
        console.log('Train last session error:', err);
        setLastSession(null);
      }
    );

    return () => {
      unsubRoutines();
      unsubSessions();
    };
  }, [user]);

  const normalized = searchQuery.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalized) return exerciseData;
    return exerciseData.filter((e) => {
      const title = String(e.title || '').toLowerCase();
      const category = String(e.category || '').toLowerCase();
      const intensity = String(e.intensity || '').toLowerCase();
      return title.includes(normalized) || category.includes(normalized) || intensity.includes(normalized);
    });
  }, [normalized]);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: WH.accent }]}>LIBRARY</Text>
            <Text style={[styles.pageTitle, { color: WH.text }]}>Exercises</Text>
            <Text style={[styles.pageSub, { color: WH.textDim }]}>
              Search moves, read instructions, and start a timer
            </Text>
          </View>
          <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
            <Ionicons name="fitness-outline" size={22} color={WH.accent} />
          </View>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Routines')}
            style={styles.quickCard}
          >
            <Text style={styles.quickTitle}>Routines</Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              {recentRoutines.length ? `${recentRoutines.length} recent` : 'Create templates'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (!lastSession?.exercises?.length) return;
              navigation.navigate('Session', {
                prefill: {
                  title: lastSession.title || 'Repeat session',
                  restTargetSeconds: lastSession.restTargetSeconds || 0,
                  exercises: (lastSession.exercises || []).map((e) => ({
                    exerciseId: e.exerciseId,
                    title: e.title,
                    intensity: e.intensity,
                    category: e.category,
                    sets: (e.sets || []).map((s) => ({
                      reps: s?.reps == null ? '' : String(s.reps),
                      weight: s?.weight == null ? '' : String(s.weight),
                      rpe: s?.rpe == null ? '' : String(s.rpe),
                      restSeconds: typeof s?.restSeconds === 'number' ? s.restSeconds : null,
                    })),
                  })),
                },
              });
            }}
            disabled={!lastSession?.exercises?.length}
            style={[styles.quickCard, !lastSession?.exercises?.length && { opacity: 0.6 }]}
          >
            <Text style={styles.quickTitle}>Repeat last</Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              {lastSession?.title ? lastSession.title : 'No sessions yet'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 4,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: APP.cardBorder,
            backgroundColor: 'rgba(255,255,255,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AntDesign name="search1" size={16} color={COLORS.text.secondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises, category, intensity…"
            placeholderTextColor={COLORS.text.tertiary}
            style={{ flex: 1, color: COLORS.text.primary, paddingVertical: 4 }}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
              <AntDesign name="closecircle" size={16} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={{ color: COLORS.text.secondary, marginTop: 10 }}>
          {results.length} exercises
        </Text>

        <View style={{ flex: 1, marginTop: 10 }}>
          <FlashList
            data={results}
            estimatedItemSize={200}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => {
              if (index % 2 !== 0) return null;
              const nextItem = results[index + 1];

              const Card = ({ data }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Exercise', { item: data })}
                  style={styles.cardOuter}
                >
                  <TrainExerciseCardMedia
                    intensity={data.intensity}
                    gifFileName={data.gif_url}
                    style={styles.cardBg}
                    imageStyle={styles.cardImage}
                  >
                    <LinearGradient
                      colors={['rgba(15,23,42,0.2)', 'rgba(0,0,0,0.82)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.topTag}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {data.category}
                      </Text>
                    </View>
                    <View style={styles.bottomBlock}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {data.title}
                      </Text>
                      <Text style={styles.tapHint} numberOfLines={1}>
                        {String(data.intensity || '').toUpperCase() || 'TAP TO START'}
                      </Text>
                    </View>
                  </TrainExerciseCardMedia>
                </TouchableOpacity>
              );

              return (
                <View style={styles.row}>
                  <Card data={item} />
                  {nextItem ? <Card data={nextItem} /> : <View style={{ flex: 1, marginHorizontal: 4 }} />}
                </View>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSub: {
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
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WH.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  quickTitle: {
    color: WH.text,
    fontWeight: '900',
    fontSize: 14,
  },
  quickSub: {
    color: WH.textMuted,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
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
});

