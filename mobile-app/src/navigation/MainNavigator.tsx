/**
 * Main App Navigator
 * Bottom tab navigation for main app features
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/main/DashboardScreen';
import GamificationScreen from '../screens/main/GamificationScreen';
import HabitsScreen from '../screens/main/HabitsScreen';
import MissionsScreen from '../screens/main/MissionsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Gamification: undefined;
  Habits: undefined;
  Missions: undefined;
  Analytics: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Gamification') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Habits') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Missions') {
            iconName = focused ? 'list' : 'list-outline';
          } else {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen
        name="Gamification"
        component={GamificationScreen}
        options={{ title: 'XP & Levels' }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{ title: 'Habits' }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{ title: 'Missions' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Tab.Navigator>
  );
}
