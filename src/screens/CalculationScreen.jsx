import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React,{useState}  from 'react'
import {Picker} from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const CalculationScreen = () => {

  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
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


  const bmiMessage = getBmiMeaning();
  return (
    <SafeAreaView className='bg-gray-200 flex-1 items-center '>
      <Text className='text-2xl my-4 font-bold '>BMI Calculator</Text>
      <View className='flex-row'>
        <Text className='text-center flex-1 text-lg font medium bg-neutral-300 ml-8 mr-8 rounded-lg'>Weight Unit</Text> 
        <Text className='text-center flex-1 text-lg font medium bg-neutral-300 ml-8 mr-8 rounded-lg' >Height Unit</Text> 
      </View>
      <View className='flex-row space-y mb-5'>
        <Picker style={{flex :1, height: 50}} 
      selectedValue={weightUnit}
      onValueChange={setWeightUnit}
     
      >
          <Picker.Item label="Kg" value="kg" />
          <Picker.Item label="Pounds" value="lbs" />
        </Picker>
        <Picker style={{flex :1, height: 50}}
         selectedValue={heightUnit}
         onValueChange={setHeightUnit}>
          <Picker.Item label="Cm" value="cm" />
          <Picker.Item label="Inches" value="in" />
        </Picker>
      </View>

      <TextInput placeholder={`Enter your weight in ${weightUnit}`} 
      keyboardType='numeric' 
      onChangeText={setWeight}
      value = {weight}
      className='w-[70%] p-2 rounded-xl bg-white text-base mb-5 text-center'></TextInput>
      <TextInput placeholder={`Enter your height in ${heightUnit}`} 
      keyboardType='numeric' 
      onChangeText={setHeight}
      value = {height}
      className='w-[70%] p-2 rounded-xl bg-white text-base text-center'></TextInput>



    <TouchableOpacity onPress={calculateBmi} className='p-3 bg-blue-300 my-5 rounded-xl mt-10'>
      <Text className='font-bold text-lg'>Calculate BMI</Text>
    </TouchableOpacity>

    {bmi!==null ? (
      <View className='my-10 rounded-2xl bg-neutral-300 p-5'>
        <Text className='text-lg font-bold text-center'>Your BMI is :  <Text className='text-2xl font-bold text-center'>{bmi}</Text></Text>
        
        <Text style={{fontSize:20,marginTop:10,textAlign:'center',color:bmiMessage.color}}>{bmiMessage.messsage}</Text>
      </View>
    ): null}
    </SafeAreaView>
  )
}

export default CalculationScreen