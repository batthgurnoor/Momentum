import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function SessionScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '800' }}>Session</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>Close</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: COLORS.text.secondary, marginTop: 12, lineHeight: 20 }}>
          Coming next: choose a routine, track sets (reps/weight), rest timer, and save a session summary.
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
          <Text style={{ color: COLORS.text.primary, fontWeight: '800', marginBottom: 6 }}>Session logging v2</Text>
          <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
            - Add exercises
            {'\n'}- Track sets (reps/weight/RPE)
            {'\n'}- Rest timer + vibration
            {'\n'}- Finish + save to history
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

