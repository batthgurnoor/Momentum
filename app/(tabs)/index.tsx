import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutScreen from "../../src/screens/WorkoutScreen";
import CalculationScreen from "../../src/screens/CalculationScreen";
import WorkoutOTDScreen from '../../src/screens/WorkoutOTDScreen';
import ProfileScreen from '../../src/screens/ProfileScreen';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import ExerciseScreen from '../../src/screens/ExerciseScreen';
import ActivityMonitoringScreen from '../../src/screens/ActivityMonitoringScreen';
import CategoryExerciseScreen from '@/src/screens/CategoryExerciseScreen';
import ProfileSetupScreen from '../../src/screens/ProfileSetupScreen';
import LoginScreen from '../../src/screens/LoginScreen';
import SignupScreen from '../../src/screens/SignUpScreen';
import AntDesign from '@expo/vector-icons/AntDesign';
import LogWorkoutScreen from '../../src/screens/LogWorkoutScreen';
import * as Notifications from 'expo-notifications';
import GoalListScreen from '../../src/screens/GoalListScreen';
import GoalSetupScreen from '../../src/screens/GoalSetupScreen';
import GoalDetailScreen from '../../src/screens/GoalDetailScreen';
import PlanListScreen from '../../src/screens/PlanListScreen';
import PlanSetupScreen from '../../src/screens/PlanSetupScreen';
import PlanDetailScreen from '../../src/screens/PlanDetailScreen';
import NotificationsScreen from '../../src/screens/NotificationsScreen';
import { registerForPushNotificationsAsync } from '../../src/notifications';
import '../../Firebase/config'; // Import firebase to ensure it's initialized

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


export default function App() {
  // Set up notifications when app loads
  useEffect(() => {
    // Configure how the notification will appear
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Get permission for notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Push token obtained:", token);
      }
    });

    // Handle notification response
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification responded to:", response);
      // You can add logic to navigate to specific screens based on notification
    });

    return () => {
      // Clean up listeners
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

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
              case "LogWorkout":
              iconName="timer-outline";
              return(<AntDesign name="book" size={size} color={color} />);
              case "Calculation":
              iconName="calculator-outline";
              return(<Ionicons name="calculator-outline" size={size} color={color} />);
              case "Profile":
              iconName="user";
              return(<AntDesign name="user" size={size} color={color} />);
              case "Goals":
              iconName="checkcircleo";
              return(<AntDesign name="checkcircleo" size={size} color={color}  />);
          }
        },
        tabBarShowLabel:false,
        headerShown:false,
        tabBarStyle:{
          backgroundColor:"black",
          paddingVertical:5,
          paddingTop:5,
        },
        tabBarActiveTintColor:"aqua",
        tabBarInactiveTintColor:"gray"

        })}>
        <Tab.Screen name="Workout" component={WorkoutScreen}></Tab.Screen>
        <Tab.Screen name="LogWorkout" component={LogWorkoutScreen} />
        <Tab.Screen name="Goals" component={GoalListScreen} />
        <Tab.Screen name="Calculation" component={CalculationScreen}></Tab.Screen>
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    )
  }
  return (

    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name='TabNav' component={TabNavigator}></Stack.Screen>
      <Stack.Screen name='Exercise' component={ExerciseScreen}></Stack.Screen>
      <Stack.Screen name='CategoryExercise' component={CategoryExerciseScreen}></Stack.Screen>
      <Stack.Screen name='WorkoutOTDScreen' component={WorkoutOTDScreen}></Stack.Screen>
      <Stack.Screen name="ActivityMonitoring" component={ActivityMonitoringScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="GoalList" component={GoalListScreen} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen}/>
        <Stack.Screen
        name="PlanList"
        component={PlanListScreen}
      />
      <Stack.Screen
        name="PlanSetup"
        component={PlanSetupScreen}
  
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

    </Stack.Navigator>


 );
}
