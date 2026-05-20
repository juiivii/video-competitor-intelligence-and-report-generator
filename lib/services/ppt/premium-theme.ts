/**
 * Premium Design System for Consulting-Grade Reports
 * Dark, sophisticated, and intentionally spacious
 */

export const premiumTheme = {
  // Core color palette - premium dark with accent
  colors: {
    // Primary palette
    background: '#0F1419', // Deep navy background
    surface: '#1A1F2E', // Card background
    accent: '#00D9FF', // Cyan accent
    accentDark: '#00A8CC', // Darker cyan
    
    // Text colors
    textPrimary: '#FFFFFF', // Main text
    textSecondary: '#B0B9CC', // Secondary text
    textTertiary: '#7A8396', // Tertiary text
    
    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    info: '#3B82F6', // Blue
    
    // Chart colors - premium palette
    chart: {
      blue: '#3B82F6',
      cyan: '#06B6D4',
      purple: '#A855F7',
      pink: '#EC4899',
      amber: '#F59E0B',
      emerald: '#10B981',
    },
    
    // Neutral palette
    neutral: {
      900: '#0F1419',
      800: '#1A1F2E',
      700: '#2D3748',
      600: '#4A5568',
      500: '#718096',
      400: '#A0AEC0',
      300: '#CBD5E0',
      200: '#E2E8F0',
      100: '#F7FAFC',
    },
  },

  // Typography scale - premium hierarchy
  typography: {
    // Page title
    h1: {
      fontSize: 44,
      bold: true,
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    
    // Section title
    h2: {
      fontSize: 36,
      bold: true,
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    
    // Subsection title
    h3: {
      fontSize: 28,
      bold: true,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    
    // Card title
    h4: {
      fontSize: 18,
      bold: true,
      color: '#FFFFFF',
    },
    
    // Body text
    body: {
      fontSize: 14,
      color: '#B0B9CC',
      lineSpacing: 1.6,
    },
    
    // Small text
    small: {
      fontSize: 12,
      color: '#7A8396',
      lineSpacing: 1.5,
    },
    
    // Caption
    caption: {
      fontSize: 11,
      color: '#4A5568',
      lineSpacing: 1.4,
    },
    
    // Metric value
    metric: {
      fontSize: 32,
      bold: true,
      color: '#00D9FF',
      letterSpacing: -0.5,
    },
    
    // Metric label
    metricLabel: {
      fontSize: 13,
      color: '#7A8396',
      letterSpacing: 0.5,
    },
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
  },

  // Shadow system
  shadows: {
    none: { type: 'none' },
    sm: { blur: 4, offset: 0, angle: 90, color: '#000000', opacity: 0.1 },
    md: { blur: 8, offset: 0, angle: 90, color: '#000000', opacity: 0.15 },
    lg: { blur: 16, offset: 0, angle: 90, color: '#000000', opacity: 0.2 },
    glow: { blur: 20, offset: 0, angle: 90, color: '#00D9FF', opacity: 0.2 },
  },

  // Slide configuration
  slide: {
    width: 10,
    height: 5.625,
    margin: {
      top: 0.4,
      right: 0.4,
      bottom: 0.4,
      left: 0.4,
    },
  },

  // Layout grid
  grid: {
    columns: 12,
    gutter: 0.12,
  },
};

export type PremiumTheme = typeof premiumTheme;
