import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function ProgressScreen() {
  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <Text style={{ color: COLORS.text.primary, fontSize: 26, fontWeight: '800', marginTop: 8 }}>
          Progress
        </Text>
        <Text style={{ color: COLORS.text.secondary, marginTop: 10, lineHeight: 20 }}>
          Coming next: weekly volume, workouts/week, PRs, and trends.
        </Text>
        <View
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: APP.cardBorder,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Text style={{ color: COLORS.text.primary, fontWeight: '800', marginBottom: 6 }}>Planned charts</Text>
          <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
            - Training minutes + sessions per week{'\n'}- Calories (optional){'\n'}- PR tracker (best set, best time){'\n'}
            - Consistency streaks
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

