import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import WorkoutScreen from "../../src/screens/WorkoutScreen";
import CalculationScreen from "../../src/screens/CalculationScreen";
import TimerScreen from "../../src/screens/TimerScreen";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';

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
    </Stack.Navigator>
  
  );
}