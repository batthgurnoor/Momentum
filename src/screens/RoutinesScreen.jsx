import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { auth, db } from '../../Firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function RoutinesScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'users', user.uid, 'routines');
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRoutines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.log('Routines snapshot error:', err);
        setRoutines([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.9}>
              <AntDesign name="arrowleft" size={22} color={APP.text} />
            </TouchableOpacity>
            <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '900' }}>Routines</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RoutineEditor', { mode: 'create' })}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: APP.cardBorder,
              backgroundColor: 'rgba(45, 212, 191, 0.14)',
            }}
          >
            <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>+ New</Text>
          </TouchableOpacity>
        </View>

        {!user ? (
          <View style={{ marginTop: 18, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: APP.cardBorder, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginBottom: 6 }}>Sign in required</Text>
            <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
              Routines are saved to your account.
            </Text>
          </View>
        ) : loading ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={APP.accent} />
          </View>
        ) : routines.length === 0 ? (
          <View style={{ marginTop: 18, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: APP.cardBorder, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginBottom: 6 }}>No routines yet</Text>
            <Text style={{ color: COLORS.text.secondary, lineHeight: 20 }}>
              Create a routine to start training with structure.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            {routines.map((r) => (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('RoutineEditor', { mode: 'edit', routineId: r.id })}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: APP.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ color: COLORS.text.primary, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                  {r.name || 'Untitled routine'}
                </Text>
                <Text style={{ color: COLORS.text.secondary, marginTop: 6 }} numberOfLines={2}>
                  {(r.days || []).join(' • ') || 'No days set'}{'\n'}
                  {r.exercises?.length ? `${r.exercises.length} exercises` : 'No exercises yet'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

