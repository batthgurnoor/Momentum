import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Reusable Button component with various styles and states
 * 
 * @param {string} variant - 'primary', 'secondary', 'outline', 'ghost'
 * @param {string} size - 'small', 'medium', 'large'
 * @param {boolean} isFullWidth - Whether button should take full width
 * @param {boolean} isLoading - Whether to show loading indicator
 * @param {boolean} isDisabled - Whether button is disabled
 * @param {boolean} useGradient - Whether to use gradient background
 * @param {function} onPress - Function to call when button is pressed
 * @param {string} iconLeft - Icon component to show on left
 * @param {string} iconRight - Icon component to show on right
 * @param {string} label - Button text
 */
export const Button = ({
  variant = 'primary',
  size = 'medium',
  isFullWidth = false,
  isLoading = false,
  isDisabled = false,
  useGradient = false,
  onPress,
  iconLeft,
  iconRight,
  label,
  style,
  ...props
}) => {
  
  // Get appropriate styles based on variant and size
  const variantStyles = styles.variants[variant] || styles.variants.primary;
  const sizeStyles = styles.sizes[size] || styles.sizes.medium;
  
  // Button content (text and icons)
  const renderContent = () => (
    <View style={styles.contentContainer}>
      {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
      <Text style={[
        TYPOGRAPHY.labelLarge, 
        sizeStyles.text, 
        variantStyles.text, 
        isDisabled && styles.disabledText
      ]}>
        {label}
      </Text>
      {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
    </View>
  );

  // If button is disabled or loading, prevent onPress function
  const handlePress = (isDisabled || isLoading) ? null : onPress;
  
  // Base button component
  const ButtonComponent = () => (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles.container,
        variantStyles.container,
        isFullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' 
            ? COLORS.primary.default 
            : COLORS.text.primary} 
        />
      ) : (
        renderContent()
      )}
    </TouchableOpacity>
  );
  
  // If using gradient, wrap button in LinearGradient
  if (useGradient && variant === 'primary' && !isDisabled) {
    return (
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          sizeStyles.container,
          isFullWidth && styles.fullWidth,
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.gradientButton}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={isDisabled || isLoading}
          {...props}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.text.primary} />
          ) : (
            renderContent()
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }
  
  return <ButtonComponent />;
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
  // Button size variations
  sizes: {
    small: {
      container: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        minHeight: 32,
      },
      text: {
        fontSize: 14,
      },
    },
    medium: {
      container: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        minHeight: 44,
      },
      text: {
        fontSize: 16,
      },
    },
    large: {
      container: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 56,
      },
      text: {
        fontSize: 18,
      },
    },
  },
  // Button style variations
  variants: {
    primary: {
      container: {
        backgroundColor: COLORS.primary.default,
      },
      text: {
        color: COLORS.text.primary,
      },
    },
    secondary: {
      container: {
        backgroundColor: COLORS.secondary.default,
      },
      text: {
        color: COLORS.text.primary,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary.default,
      },
      text: {
        color: COLORS.primary.default,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        elevation: 0,
      },
      text: {
        color: COLORS.primary.default,
      },
    },
  },
}); 