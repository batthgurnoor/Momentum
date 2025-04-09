/**
 * Momentum App Color Theme
 * This file contains all the color values used throughout the app.
 */

export const COLORS = {
  // Primary colors typically represent the main branding
  primary: {
    default: '#3498db',     // Main primary color (e.g., used for buttons, highlights)
    light: '#5dade2',       // A lighter version of the primary color for backgrounds, overlays, etc.
  },
  // Secondary colors complement the primary colors and add variety
  secondary: {
    default: '#e74c3c',     // Main secondary color, can be used for accent elements
    light: '#ec7063',       // Lighter shade of secondary
  },
  // Text colors for different elements
  text: {
    primary: '#2c3e50',     // Default text color, often a dark hue
    secondary: '#7f8c8d',   // Less prominent text
    tertiary: '#bdc3c7',    // For disabled or less emphasized text
    onPrimary: '#ffffff',   // Text displayed on top of primary-colored backgrounds
  },
  // Gradient definitions for backgrounds or decorative elements
  gradient: {
    dark: ['#141e30', '#243b55'],  // Example gradient from a dark blue to a slightly lighter tone
    primary: ['#3498db', '#5dade2'], // Primary color gradient
    secondary: ['#e74c3c', '#ec7063'], // Secondary color gradient
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'], // Glass effect gradient
  },
  // UI colors for alerts, errors, etc.
  ui: {
    error: '#ff4d4d',       // Red tone typically used for error messages or alerts
    surface: 'rgba(255, 255, 255, 0.05)', // Surface color for cards and inputs
  },
};

// Linear gradient combinations
export const GRADIENTS = {
  primary: {
    colors: COLORS.gradient.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: COLORS.gradient.secondary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  workout: {
    colors: COLORS.gradient.primary, // Using primary as fallback
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  dark: {
    colors: COLORS.gradient.dark,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  glass: {
    colors: COLORS.gradient.glass,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
}; 