import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../theme';

/**
 * Reusable Text component for consistent typography
 * 
 * @param {string} variant - 'h1', 'h2', 'h3', 'h4', 'h5', 'bodyLarge', 'bodyMedium', 'bodySmall', 'labelLarge', 'labelMedium', 'labelSmall'
 * @param {string} color - Text color override
 * @param {boolean} isBold - Whether text is bold
 * @param {boolean} isItalic - Whether text is italic
 * @param {boolean} align - 'left', 'center', 'right'
 * @param {number} numberOfLines - Number of lines before truncating
 * @param {object} style - Additional styles to apply
 */
export const Text = ({
  variant = 'bodyMedium',
  color,
  isBold = false,
  isItalic = false,
  align,
  numberOfLines,
  style,
  children,
  ...props
}) => {
  return (
    <RNText
      style={[
        TYPOGRAPHY[variant] || TYPOGRAPHY.bodyMedium,
        align && { textAlign: align },
        isBold && styles.bold,
        isItalic && styles.italic,
        color && { color },
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Predefined text components for common use cases
export const Heading1 = (props) => <Text variant="h1" {...props} />;
export const Heading2 = (props) => <Text variant="h2" {...props} />;
export const Heading3 = (props) => <Text variant="h3" {...props} />;
export const Heading4 = (props) => <Text variant="h4" {...props} />;
export const Heading5 = (props) => <Text variant="h5" {...props} />;

export const BodyLarge = (props) => <Text variant="bodyLarge" {...props} />;
export const BodyMedium = (props) => <Text variant="bodyMedium" {...props} />;
export const BodySmall = (props) => <Text variant="bodySmall" {...props} />;

export const LabelLarge = (props) => <Text variant="labelLarge" {...props} />;
export const LabelMedium = (props) => <Text variant="labelMedium" {...props} />;
export const LabelSmall = (props) => <Text variant="labelSmall" {...props} />;

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
}); 