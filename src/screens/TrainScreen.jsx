import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function TrainScreen() {
  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <Text style={{ color: COLORS.text.primary, fontSize: 26, fontWeight: '800', marginTop: 8 }}>
          Train
        </Text>
        <Text style={{ color: COLORS.text.secondary, marginTop: 10, lineHeight: 20 }}>
          Coming next: exercise library, routines/templates, and a real session flow.
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
          <Text style={{ color: COLORS.text.primary, fontWeight: '800', marginBottom: 6 }}>Planned shortcuts</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: 'rgba(45, 212, 191, 0.14)',
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>Browse exercises</Text>
            <Text style={{ color: COLORS.text.secondary, marginTop: 2 }}>Search + filters + favorites</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

