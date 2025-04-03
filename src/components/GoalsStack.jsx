// GoalsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GoalListScreen from '../screens/GoalListScreen';
import GoalSetupScreen from '../screens/GoalSetupScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';

const Stack = createNativeStackNavigator();

export default function GoalsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GoalList" 
        component={GoalListScreen}
        options={{ title: 'Your Fitness Goals' }}
      />
      <Stack.Screen 
        name="GoalSetup" 
        component={GoalSetupScreen}
        options={{ title: 'Set a New Goal' }}
      />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen}
        options={{ title: 'Goal Detail' }}
      />
    </Stack.Navigator>
  );
}
