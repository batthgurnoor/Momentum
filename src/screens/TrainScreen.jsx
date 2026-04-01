import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import exerciseData from '../../exercise_data.json';

const APP = COLORS.app;
const WH = COLORS.workoutHome;
const exerciseImage = require('../../assets/images/exercise1.jpg');

export default function TrainScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLowerCase();
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
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises, category, intensity…"
            placeholderTextColor={COLORS.text.tertiary}
            style={{ flex: 1, color: COLORS.text.primary, paddingVertical: 4 }}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8}>
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
                  <ImageBackground source={exerciseImage} style={styles.cardBg} imageStyle={styles.cardImage}>
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
                  </ImageBackground>
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

