import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Reusable Card component for displaying content in cards
 * 
 * @param {boolean} hasShadow - Whether the card has a shadow
 * @param {string} variant - 'default', 'flat', 'elevated', 'glass', 'primary', 'secondary'
 * @param {boolean} isTouchable - Whether the card is touchable
 * @param {boolean} useGradient - Whether to use gradient background
 * @param {function} onPress - Function to call when card is pressed
 * @param {object} style - Additional styles to apply
 * @param {node} children - Content to display inside the card
 */
export const Card = ({
  hasShadow = true,
  variant = 'default',
  isTouchable = false,
  useGradient = false,
  onPress,
  style,
  children,
  ...props
}) => {
  // Get card styles based on variant
  const variantStyles = styles.variants[variant] || styles.variants.default;
  
  // Common style array for both touchable and non-touchable cards
  const cardStyleArray = [
    styles.card,
    variantStyles,
    hasShadow && SHADOWS.small,
    style,
  ];

  // Card content
  const CardContent = () => (
    <View style={styles.contentContainer}>
      {children}
    </View>
  );
  
  // If using glass morphism (using a gradient instead of blur effect to fix issues)
  if (variant === 'glass') {
    const WrapperComponent = isTouchable ? TouchableOpacity : View;
    
    return (
      <WrapperComponent
        style={[styles.card, hasShadow && SHADOWS.small, style]}
        onPress={isTouchable ? onPress : undefined}
        activeOpacity={isTouchable ? 0.7 : undefined}
        {...props}
      >
        <LinearGradient
          colors={COLORS.gradient.glass}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glassFill}
        >
          <CardContent />
        </LinearGradient>
      </WrapperComponent>
    );
  }
  
  // If using gradient variant
  if (useGradient && (variant === 'primary' || variant === 'secondary')) {
    const gradientVariant = variant === 'primary' ? COLORS.gradient.primary : COLORS.gradient.secondary;
    const WrapperComponent = isTouchable ? TouchableOpacity : View;
    
    return (
      <WrapperComponent
        style={[styles.card, hasShadow && SHADOWS.small, style]}
        onPress={isTouchable ? onPress : undefined}
        activeOpacity={isTouchable ? 0.7 : undefined}
        {...props}
      >
        <LinearGradient
          colors={gradientVariant}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          <CardContent />
        </LinearGradient>
      </WrapperComponent>
    );
  }
  
  // If card is touchable, wrap in TouchableOpacity
  if (isTouchable) {
    return (
      <TouchableOpacity
        style={cardStyleArray}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }
  
  // Otherwise, render as a simple View
  return (
    <View style={cardStyleArray} {...props}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: SPACING.md,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
  },
  glassFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    // Removing backdropFilter property which might not be supported
  },
  // Card style variations
  variants: {
    default: {
      backgroundColor: COLORS.ui.card,
    },
    flat: {
      backgroundColor: COLORS.ui.surface,
      borderWidth: 1,
      borderColor: COLORS.ui.border,
    },
    elevated: {
      backgroundColor: COLORS.ui.card,
      ...SHADOWS.medium,
    },
    glass: {
      backgroundColor: 'transparent',
    },
    primary: {
      backgroundColor: COLORS.primary.default,
    },
    secondary: {
      backgroundColor: COLORS.secondary.default,
    },
    success: {
      backgroundColor: COLORS.ui.success,
    },
    warning: {
      backgroundColor: COLORS.ui.warning,
    },
    error: {
      backgroundColor: COLORS.ui.error,
    },
  },
}); 