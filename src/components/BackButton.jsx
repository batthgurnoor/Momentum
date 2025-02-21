import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const BackButton = () => {
    const navigation = useNavigation();
  return (
    <TouchableOpacity className='absolute top-20, left-2' onPress={()=> navigation.goBack()}> 
<Ionicons name="arrow-back-circle-outline" size={40} color="black" />
        </TouchableOpacity>
  )
}

export default BackButton