import React, { useCallback, useEffect } from 'react';
import { Platform, Pressable } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutScreen from "../../src/screens/WorkoutScreen";
import CalculationScreen from "../../src/screens/CalculationScreen";
import WorkoutOTDScreen from '../../src/screens/WorkoutOTDScreen';
import ProfileScreen from '../../src/screens/ProfileScreen';
import ProgressScreen from '../../src/screens/ProgressScreen';
import TrainScreen from '../../src/screens/TrainScreen';
import SessionScreen from '../../src/screens/SessionScreen';
import MetricsScreen from '../../src/screens/MetricsScreen';
import RoutinesScreen from '../../src/screens/RoutinesScreen';
import RoutineEditorScreen from '../../src/screens/RoutineEditorScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import ExerciseScreen from '../../src/screens/ExerciseScreen';
import ActivityMonitoringScreen from '../../src/screens/ActivityMonitoringScreen';
import CategoryExerciseScreen from '@/src/screens/CategoryExerciseScreen';
import ProfileSetupScreen from '../../src/screens/ProfileSetupScreen';
import LoginScreen from '../../src/screens/LoginScreen';
import SignupScreen from '../../src/screens/SignUpScreen';
import * as Notifications from 'expo-notifications';
import PlanListScreen from '../../src/screens/PlanListScreen';
import PlanSetupScreen from '../../src/screens/PlanSetupScreen';
import PlanDetailScreen from '../../src/screens/PlanDetailScreen';
import NotificationsScreen from '../../src/screens/NotificationsScreen';
import OnboardingScreen from '../../src/screens/OnboardingScreen';
import { registerForPushNotificationsAsync } from '../../src/notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { preloadExerciseGifUrls } from '../../src/utils/exerciseGifUrls';
import { flushQueuedSessionWrite } from '../../src/utils/sessionFirestoreWrite';
import { auth } from '../../Firebase/config';
import { COLORS } from '../../src/theme/colors';
import ErrorBoundary from '../../src/components/ErrorBoundary';

const APP = COLORS.app;

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBarButton(props: BottomTabBarButtonProps) {
  const { children, onPress, onLongPress, accessibilityState, style, ...rest } = props;
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onLongPress={onLongPress}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      style={({ pressed }) => [style, pressed && { opacity: 0.9 }]}
    >
      {children}
    </Pressable>
  );
}

function TabNavigator() {
  const screenOptions = useCallback(
    ({ route }: { route: { name: string } }) => ({
      tabBarHideOnKeyboard: true,
      headerShown: false,
      tabBarShowLabel: false,
      tabBarButton: (p: BottomTabBarButtonProps) => <TabBarButton {...p} />,
      tabBarIcon: ({
        color,
        size,
        focused,
      }: {
        color: string;
        size: number;
        focused: boolean;
      }) => {
        const s = size ?? 24;
        switch (route.name) {
          case 'Today':
            return <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={s} color={color} />;
          case 'Train':
            return <Ionicons name={focused ? 'fitness' : 'fitness-outline'} size={s} color={color} />;
          case 'Progress':
            return <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={s} color={color} />;
          case 'Profile':
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={s} color={color} />;
          default:
            return null;
        }
      },
      tabBarStyle: {
        backgroundColor: APP.bgMid,
        paddingVertical: 8,
        paddingTop: 8,
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarActiveTintColor: APP.accent,
      tabBarInactiveTintColor: APP.textDim,
    }),
    []
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Today" component={WorkoutScreen} />
      <Tab.Screen name="Train" component={TrainScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ioniconsLoaded, ioniconsError] = useFonts(Ionicons.font);

  useEffect(() => {
    if (ioniconsLoaded || ioniconsError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ioniconsLoaded, ioniconsError]);

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

  useEffect(() => {
    preloadExerciseGifUrls({ concurrency: 6 }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.uid) flushQueuedSessionWrite(user.uid).catch(() => {});
    });
    return () => unsub();
  }, []);

  if (!ioniconsLoaded && !ioniconsError) {
    return null;
  }

  return (
    <ErrorBoundary title="Momentum crashed on this screen">
      <StatusBar style="light" backgroundColor={APP.bgTop} />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: APP.bgTop } }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="TabNav" component={TabNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Session" component={SessionScreen} />
        <Stack.Screen name="Calculation" component={CalculationScreen} />
        <Stack.Screen name="Metrics" component={MetricsScreen} />
        <Stack.Screen name="Routines" component={RoutinesScreen} />
        <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
        <Stack.Screen name="CategoryExercise" component={CategoryExerciseScreen} />
        <Stack.Screen name="WorkoutOTDScreen" component={WorkoutOTDScreen} />
        <Stack.Screen name="ActivityMonitoring" component={ActivityMonitoringScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="PlanList" component={PlanListScreen} />
        <Stack.Screen name="PlanSetup" component={PlanSetupScreen} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
