import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

export default function CalculationScreen() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  const calculateBmi = () => {
    if (weight && height) {
      const weightKg = weightUnit === 'kg'
        ? parseFloat(weight)
        : parseFloat(weight) / 2.20462;
      const heightM = heightUnit === 'cm'
        ? parseFloat(height) / 100
        : parseFloat(height) * 0.0254;
      const bmiValue = weightKg / (heightM * heightM);
      setBmi(bmiValue.toFixed(2));
    } else {
      setBmi(null);
    }
  };

  const getBmiMeaning = () => {
    if (bmi === null) return null;
    const numericBmi = parseFloat(bmi);
    if (numericBmi < 18.5) {
      return { message: 'You are underweight. Consider consulting a doctor.', color: 'text-red-400' };
    } else if (numericBmi < 24.9) {
      return { message: 'Congratulations! You are in a healthy weight range.', color: 'text-primary' };
    } else if (numericBmi < 29.9) {
      return { message: 'You are overweight. Consider consulting a nutritionist.', color: 'text-amber-400' };
    } else {
      return { message: 'You are obese. Please consider consulting a health professional.', color: 'text-red-400' };
    }
  };

  const bmiMessage = getBmiMeaning();

  return (
    <LinearGradient
      colors={[APP.bgTop, APP.bgMid, APP.bgBottom]}
      locations={[0, 0.45, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Text className="text-ui-text-primary text-3xl font-extrabold text-center mt-8 mb-6">
            BMI Calculator
          </Text>

          <View className="rounded-2xl px-4 py-3 mb-4 border border-momentum-border bg-ui-card">
            <Text className="text-ui-text-secondary font-semibold mb-2 text-center">Select Units</Text>
            <View className="flex-row justify-between">
              <View className="flex-1 mx-1 rounded-lg overflow-hidden border border-momentum-border bg-ui-surface">
                <Picker
                  selectedValue={weightUnit}
                  onValueChange={(val) => setWeightUnit(val)}
                  style={{ height: 50, color: APP.text }}
                  dropdownIconColor={APP.accent}
                >
                  <Picker.Item label="Kg" value="kg" color={APP.text} />
                  <Picker.Item label="Pounds" value="lbs" color={APP.text} />
                </Picker>
              </View>

              <View className="flex-1 mx-1 rounded-lg overflow-hidden border border-momentum-border bg-ui-surface">
                <Picker
                  selectedValue={heightUnit}
                  onValueChange={(val) => setHeightUnit(val)}
                  style={{ height: 50, color: APP.text }}
                  dropdownIconColor={APP.accent}
                >
                  <Picker.Item label="Cm" value="cm" color={APP.text} />
                  <Picker.Item label="Inches" value="in" color={APP.text} />
                </Picker>
              </View>
            </View>
          </View>

          <View className="rounded-2xl px-4 py-4 border border-momentum-border bg-ui-card">
            <Text className="text-ui-text-secondary font-semibold mb-1">Enter Weight ({weightUnit})</Text>
            <TextInput
              placeholder={`Enter your weight in ${weightUnit}`}
              placeholderTextColor={APP.textDim}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              className="rounded-lg px-3 py-2 mb-4 text-ui-text-primary border border-momentum-border bg-ui-surface"
            />

            <Text className="text-ui-text-secondary font-semibold mb-1">Enter Height ({heightUnit})</Text>
            <TextInput
              placeholder={`Enter your height in ${heightUnit}`}
              placeholderTextColor={APP.textDim}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              className="rounded-lg px-3 py-2 mb-4 text-ui-text-primary border border-momentum-border bg-ui-surface"
            />

            <TouchableOpacity
              onPress={calculateBmi}
              className="bg-primary rounded-full py-3 my-2"
            >
              <Text className="text-center text-momentum-bg font-bold text-lg">Calculate BMI</Text>
            </TouchableOpacity>
          </View>

          {bmi !== null && (
            <View className="rounded-2xl px-4 py-4 mt-6 border border-momentum-border bg-ui-card">
              <Text className="text-lg font-bold text-center mb-2 text-ui-text-primary">
                Your BMI: <Text className="text-primary">{bmi}</Text>
              </Text>
              {bmiMessage && (
                <Text className={`text-center px-3 text-base ${bmiMessage.color}`}>
                  {bmiMessage.message}
                </Text>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
