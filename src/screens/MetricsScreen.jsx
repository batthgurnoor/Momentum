import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../Firebase/config';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function MetricsScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'users', user.uid, 'metrics');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(30));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.log('Metrics snapshot error:', err);
        setEntries([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const latest = useMemo(() => entries[0] || null, [entries]);

  const saveWeight = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save metrics.');
      return;
    }
    const value = parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Invalid weight', 'Enter a valid weight (kg).');
      return;
    }

    setSaving(true);
    try {
      const ref = collection(db, 'users', user.uid, 'metrics');
      await addDoc(ref, {
        type: 'weight',
        unit: 'kg',
        value,
        timestamp: serverTimestamp(),
      });
      setWeight('');
    } catch (e) {
      console.log('Error saving metric:', e);
      Alert.alert('Error', e?.message ?? 'Could not save metric.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.text.primary, fontSize: 22, fontWeight: '900' }}>Metrics</Text>
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
            <Text style={{ color: COLORS.text.primary, fontWeight: '900' }}>Close</Text>
          </TouchableOpacity>
        </View>

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
          <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginBottom: 8 }}>Log weight (kg)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 72.4"
              placeholderTextColor={APP.textDim}
              keyboardType="numeric"
              style={{
                flex: 1,
                color: COLORS.text.primary,
                borderWidth: 1,
                borderColor: APP.cardBorder,
                backgroundColor: 'rgba(0,0,0,0.22)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={saveWeight}
              disabled={saving}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: APP.accent,
                opacity: saving ? 0.7 : 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: COLORS.text.onPrimary, fontWeight: '900' }}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: COLORS.text.secondary, marginTop: 10 }}>
            Latest: {latest?.value ? `${latest.value} ${latest.unit || 'kg'}` : '—'}
          </Text>
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: APP.cardBorder,
            backgroundColor: 'rgba(255,255,255,0.06)',
            flex: 1,
          }}
        >
          <Text style={{ color: COLORS.text.primary, fontWeight: '900', marginBottom: 10 }}>Recent entries</Text>
          {!user ? (
            <Text style={{ color: COLORS.text.secondary }}>Sign in to track metrics.</Text>
          ) : loading ? (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <ActivityIndicator size="large" color={APP.accent} />
            </View>
          ) : entries.length === 0 ? (
            <Text style={{ color: COLORS.text.secondary }}>No metrics yet. Add your first weigh-in above.</Text>
          ) : (
            entries.slice(0, 10).map((e) => {
              const dateStr = e.timestamp?.toDate ? e.timestamp.toDate().toLocaleDateString() : '—';
              return (
                <View
                  key={e.id}
                  style={{
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: APP.cardBorder,
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontWeight: '800' }}>
                    {e.value} {e.unit || 'kg'}
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginTop: 2 }}>{dateStr}</Text>
                </View>
              );
            })
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

