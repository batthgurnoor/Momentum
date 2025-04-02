
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WorkoutScreen from "../../src/screens/WorkoutScreen";
import CalculationScreen from "../../src/screens/CalculationScreen";
import TimerScreen from "../../src/screens/TimerScreen";
import WorkoutOTDScreen from '../../src/screens/WorkoutOTDScreen';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import ExerciseScreen from '../../src/screens/ExerciseScreen';

import CategoryExerciseScreen from '@/src/screens/CategoryExerciseScreen';
import { NavigationContainer } from '@react-navigation/native';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


export default function App() {
  function TabNavigator(){
    return(
      <Tab.Navigator
      screenOptions={({route})=>({
        tabBarHideOnKeyboard:true,
        tabBarIcon:({color,size})=>{
          let iconName;
          switch(route.name){
            case "Workout":
              iconName="dumbbell";
              return(<FontAwesome6 name={iconName} size={size} color={color} />);
              case "Timer":
              iconName="timer-outline";
              return(<Ionicons name="timer-outline" size={size} color={color} />);
              case "Calculation":
              iconName="calculator-outline";
              return(<Ionicons name="calculator-outline" size={size} color={color} />);
          }
        },
        tabBarShowLabel:false,
        headerShown:false,
        tabBarStyle:{
          backgroundColor:"black",
          borderTopRightRadius:20,
          borderTopLeftRadius:20,
          paddingVertical:5,
        },
        tabBarActiveTintColor:"aqua",
        tabBarInactiveTintColor:"gray"

        })}>
        <Tab.Screen name="Workout" component={WorkoutScreen}></Tab.Screen>
        <Tab.Screen name="Timer" component={TimerScreen}></Tab.Screen>
        <Tab.Screen name="Calculation" component={CalculationScreen}></Tab.Screen>
      </Tab.Navigator>
    )
  }
  return (

    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name='TabNav' component={TabNavigator}></Stack.Screen>
      <Stack.Screen name='Exercise' component={ExerciseScreen}></Stack.Screen>
      <Stack.Screen name='CategoryExercise' component={CategoryExerciseScreen}></Stack.Screen>
      <Stack.Screen name='WorkoutOTDScreen' component={WorkoutOTDScreen}></Stack.Screen>
    </Stack.Navigator>


 );
}
