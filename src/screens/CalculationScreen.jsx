import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform ,StyleSheet,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

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
      return { message: 'You are underweight. Consider consulting a doctor.', color: 'text-red-500' };
    } else if (numericBmi < 24.9) {
      return { message: 'Congratulations! You are in a healthy weight range.', color: 'text-green-500' };
    } else if (numericBmi < 29.9) {
      return { message: 'You are overweight. Consider consulting a nutritionist.', color: 'text-yellow-500' };
    } else {
      return { message: 'You are obese. Please consider consulting a health professional.', color: 'text-red-500' };
    }
  };

  const bmiMessage = getBmiMeaning();
const styles = StyleSheet.create({
    background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 300,
    },
  });
  return (
    <LinearGradient
            
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.background}
          >
      <SafeAreaView className="flex-1 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Text className="text-white text-3xl font-extrabold text-center mt-8 mb-6">
            BMI Calculator
          </Text>

          
          <View className="bg-white/90 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-gray-700 font-semibold mb-2 text-center">Select Units</Text>
            <View className="flex-row justify-between">
              {/* Weight Unit Picker */}
              <View className="flex-1 mx-1 bg-white rounded-lg">
                <Picker
                  selectedValue={weightUnit}
                  onValueChange={(val) => setWeightUnit(val)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Kg" value="kg" />
                  <Picker.Item label="Pounds" value="lbs" />
                </Picker>
              </View>

              
              <View className="flex-1 mx-1 bg-white rounded-lg">
                <Picker
                  selectedValue={heightUnit}
                  onValueChange={(val) => setHeightUnit(val)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Cm" value="cm" />
                  <Picker.Item label="Inches" value="in" />
                </Picker>
              </View>
            </View>
          </View>

          
          <View className="bg-white/90 rounded-2xl px-4 py-4">
            <Text className="text-gray-700 font-semibold mb-1">Enter Weight ({weightUnit})</Text>
            <TextInput
              placeholder={`Enter your weight in ${weightUnit}`}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              className="bg-white rounded-lg px-3 py-2 mb-4"
            />

            <Text className="text-gray-700 font-semibold mb-1">Enter Height ({heightUnit})</Text>
            <TextInput
              placeholder={`Enter your height in ${heightUnit}`}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              className="bg-white rounded-lg px-3 py-2 mb-4"
            />

            
            <TouchableOpacity
              onPress={calculateBmi}
              className="bg-green-500 rounded-full py-3 my-2"
            >
              <Text className="text-center text-white font-semibold text-lg">Calculate BMI</Text>
            </TouchableOpacity>
          </View>

          
          {bmi !== null && (
            <View className="bg-white/90 rounded-2xl px-4 py-4 mt-6">
              <Text className="text-lg font-bold text-center mb-2">
                Your BMI: <Text className="text-blue-600">{bmi}</Text>
              </Text>
              {bmiMessage && (
                <Text
                  className={`text-center px-3 text-base ${bmiMessage.color}`}
                >
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
