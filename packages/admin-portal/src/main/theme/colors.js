// Digital Worksite Theme Colors
export const theme = {
  primary: {
    main: '#2DBE60',
    dark: '#1E8E4A',
    light: '#4DD17A',
    contrast: '#ffffff'
  },
  secondary: {
    main: '#F2C300',
    dark: '#D4A900',
    light: '#F5D333',
    contrast: '#000000'
  },
  secondary2: {
    main: '#E31E24',
    dark: '#B71C1C',
    light: '#EF5350',
    contrast: '#ffffff'
  },
  neutral: {
    white: '#ffffff',
    light: '#f8f9fa',
    medium: '#6c757d',
    dark: '#343a40',
    black: '#000000'
  }
};

// Add gradients after theme object is created
theme.gradients = {
  primary: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.dark} 100%)`,
  secondary: `linear-gradient(135deg, ${theme.secondary.main} 0%, ${theme.secondary.dark} 100%)`,
  secondary2: `linear-gradient(135deg, ${theme.secondary2.main} 0%, ${theme.secondary2.dark} 100%)`,
  primaryToSecondary: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.secondary.main} 100%)`,
  primaryToSecondary2: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.secondary2.main} 100%)`,
  secondaryToSecondary2: `linear-gradient(135deg, ${theme.secondary.main} 0%, ${theme.secondary2.main} 100%)`
};

// Utility functions for theme colors
export const getThemeColor = (colorPath) => {
  const keys = colorPath.split('.');
  let result = theme;
  for (const key of keys) {
    result = result[key];
    if (!result) return null;
  }
  return result;
};

export const getRoleColor = (role) => {
  const roleColors = {
    admin: theme.secondary2.main,
    site_manager: theme.primary.main,
    contractor: theme.primary.dark,
    inspector: theme.secondary.main,
    viewer: theme.neutral.medium
  };
  return roleColors[role] || theme.neutral.medium;
};

export default theme;