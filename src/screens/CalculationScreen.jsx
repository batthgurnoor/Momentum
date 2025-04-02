import { View, Text, TextInput } from 'react-native'
import React,{useState}  from 'react'
import {Picker} from '@react-native-picker/picker';

const CalculationScreen = () => {

  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [bmi, setBmi] = useState(null);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  const calculateBmi = () => {
    if (weight && height) {
      const wightKg = weightUnit === 'kg' ? parseFloat(weight) : parseFloat(weight) / 2.20462;
      const heightM = heightUnit === 'cm' ? parseFloat(height)/100 : parseFloat(height) * 0.0254
      const bmiValue = wightKg / (heightM * heightM);
    setBmi(bmiValue.toFixed(2));
  }else{
    setBmi(null);
  }
  }

  const getBmiMeaning = () => {
    if(bmi !==null){
      if(bmi<18.5){
        return {messsage:'You are underweight. Consider consulting a doctor or a nutitionist.',color:'red'};
    }else if(bmi>=18.5 && bmi<24.9){
      return {messsage:'Congratulations! You are in a healthy weight range.',color:'green'};
    }else if(bmi>=24.9 && bmi<29.9){
      return {messsage:'You are overweight. Consider consulting a doctor or a nutitionist.',color:'orange'};
    }
    else{
      return {messsage:'You are obese. Please consider consulting a health professional.',color:'red'};
    }
  }
  }
  return (
    <View className='bg-gray-200'>
      <Text>BMI Calculator</Text>
      <View>
        <Text>Weight Unit</Text> 
        <Text>Height Unit</Text> 
      </View>
      <View>
        <Picker style={{flex :1, height: 50}}>
          <Picker.Item label="Kg" value="kg" />
          <Picker.Item label="Pounds" value="lbs" />
        </Picker>
        <Picker>
          <Picker.Item label="Cm" value="cm" />
          <Picker.Item label="Inches" value="in" />
        </Picker>
      </View>

      <TextInput placeholder={`Enter your weight in ${weightUnit}`} 
      keyboardType='numeric' 
      onChangeText={setWeight}
      value = {weight}
      className='w-[70%] p-2 rounded-xl bg-white text-base'></TextInput>
      <TextInput placeholder={`Enter your height in ${heightUnit}`} 
      keyboardType='numeric' 
      onChangeText={setHeight}
      value = {height}
      className='w-[70%] p-2 rounded-xl bg-white text-base'></TextInput>
    </View>
  )
}

export default CalculationScreen