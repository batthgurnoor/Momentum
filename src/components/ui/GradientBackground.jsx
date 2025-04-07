import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme';
import { StatusBar } from 'expo-status-bar';

/**
 * GradientBackground component for consistent screen backgrounds
 * 
 * @param {string} variant - 'primary', 'workout', 'dark'
 * @param {array} colors - Custom gradient colors array
 * @param {object} start - Start position for gradient
 * @param {object} end - End position for gradient
 * @param {boolean} safeArea - Whether to add safe area insets padding
 * @param {string} statusBarStyle - 'light', 'dark', 'auto'
 * @param {object} style - Additional styles to apply
 * @param {node} children - Content to display
 */
export const GradientBackground = ({
  variant = 'primary',
  colors,
  start,
  end,
  safeArea = true,
  statusBarStyle = 'light',
  style,
  children,
  ...props
}) => {
  // Use predefined gradient if variant is provided, otherwise use custom props
  const gradientProps = GRADIENTS[variant] || {
    colors: colors || COLORS.gradient.primary,
    start: start || { x: 0, y: 0 },
    end: end || { x: 1, y: 1 },
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />
      <LinearGradient
        style={[styles.gradient, style]}
        {...gradientProps}
        {...props}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
}); 