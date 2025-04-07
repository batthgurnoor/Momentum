/**
 * Momentum App Color Theme
 * This file contains all the color values used throughout the app.
 */

export const COLORS = {
  // Primary brand colors
  primary: {
    default: '#6366F1', // Indigo - main brand color
    light: '#A5B4FC',   // Light indigo - secondary elements
    dark: '#4338CA',    // Deep indigo - accents
  },
  
  // Secondary colors for highlights and accents
  secondary: {
    default: '#EC4899', // Pink - highlights
    light: '#F9A8D4',   // Light pink
  },
  
  // Accent colors
  accent: {
    teal: '#14B8A6',
    amber: '#F59E0B',
    emerald: '#10B981',
    purple: '#8B5CF6',
  },
  
  // UI colors for interface elements
  ui: {
    background: '#0F172A',    // Dark slate background
    card: '#1E293B',          // Slate card background
    surface: '#334155',       // Surface elements
    border: '#475569',        // Border colors
    success: '#34D399',       // Success state
    warning: '#FBBF24',       // Warning state
    error: '#F43F5E',         // Error state
  },
  
  // Text color variations
  text: {
    primary: '#F8FAFC',     // Primary text - almost white
    secondary: '#CBD5E1',   // Secondary text - light slate
    tertiary: '#94A3B8',    // Tertiary text - slate
  },
  
  // Gradient presets
  gradient: {
    primary: ['#6366F1', '#4338CA', '#EC4899'],
    secondary: ['#14B8A6', '#10B981', '#8B5CF6'],
    workout: ['rgba(15,23,42,0.9)', 'rgba(15,23,42,0.4)', 'transparent'],
    dark: ['#0F172A', '#1E293B'],
    glass: ['rgba(30,41,59,0.9)', 'rgba(30,41,59,0.8)'],
  }
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
    colors: COLORS.gradient.workout,
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