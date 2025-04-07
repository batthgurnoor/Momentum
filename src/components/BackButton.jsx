import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../theme';

/**
 * Enhanced back button component with animations and modern styling
 * 
 * @param {string} color - Color of the icon and background (default to theme colors)
 * @param {string} mode - 'light' or 'dark' to determine background/foreground contrast 
 * @param {function} onPress - Optional custom action on press, defaults to navigation.goBack()
 * @param {object} style - Additional styles for the container
 */
const BackButton = ({ 
  color = COLORS.primary.default, 
  mode = 'light',
  onPress,
  style
}) => {
  const navigation = useNavigation();
  const animatedValue = new Animated.Value(1);
  
  // Scale animation on press
  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  // Select background and icon colors based on mode
  const bgColor = mode === 'light' 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'rgba(0, 0, 0, 0.15)';
    
  const iconColor = mode === 'light' 
    ? COLORS.text.primary 
    : color;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: animatedValue }] }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor: bgColor },
          style
        ]}
        onPress={onPress || (() => navigation.goBack())}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
});

export default BackButton;