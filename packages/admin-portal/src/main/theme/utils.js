// Theme utility functions for applying colors to existing components
import { theme } from './colors.js';

// Apply theme colors to button elements
export const applyButtonTheme = (element, variant = 'primary') => {
  if (!element) return;
  
  const variants = {
    primary: {
      background: theme.primary.main,
      color: theme.primary.contrast,
      hoverBackground: theme.primary.dark
    },
    secondary: {
      background: theme.secondary.main,
      color: theme.secondary.contrast,
      hoverBackground: theme.secondary.dark
    },
    secondary2: {
      background: theme.secondary2.main,
      color: theme.secondary2.contrast,
      hoverBackground: theme.secondary2.dark
    }
  };
  
  const variantStyle = variants[variant] || variants.primary;
  
  element.style.backgroundColor = variantStyle.background;
  element.style.color = variantStyle.color;
  element.style.border = 'none';
  element.style.transition = 'all 0.2s ease';
  
  element.addEventListener('mouseenter', () => {
    element.style.backgroundColor = variantStyle.hoverBackground;
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.backgroundColor = variantStyle.background;
  });
};

// Apply theme colors to card elements
export const applyCardTheme = (element, variant = 'default') => {
  if (!element) return;
  
  element.style.backgroundColor = theme.neutral.white;
  element.style.borderRadius = '8px';
  element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  element.style.padding = '1.5rem';
  
  switch (variant) {
    case 'primary':
      element.style.borderLeft = `4px solid ${theme.primary.main}`;
      break;
    case 'secondary':
      element.style.borderLeft = `4px solid ${theme.secondary.main}`;
      break;
    case 'secondary2':
      element.style.borderLeft = `4px solid ${theme.secondary2.main}`;
      break;
    default:
      element.style.borderLeft = `4px solid ${theme.primary.main}`;
  }
};

// Get theme color by path (e.g., 'primary.main')
export const getThemeColorByPath = (path) => {
  const keys = path.split('.');
  let result = theme;
  for (const key of keys) {
    result = result[key];
    if (!result) return null;
  }
  return result;
};

// Apply theme to existing DOM elements by selector
export const applyThemeToElements = () => {
  // Apply to buttons with theme classes
  document.querySelectorAll('.theme-btn-primary').forEach(btn => {
    applyButtonTheme(btn, 'primary');
  });
  
  document.querySelectorAll('.theme-btn-secondary').forEach(btn => {
    applyButtonTheme(btn, 'secondary');
  });
  
  document.querySelectorAll('.theme-btn-secondary2').forEach(btn => {
    applyButtonTheme(btn, 'secondary2');
  });
  
  // Apply to cards with theme classes
  document.querySelectorAll('.theme-card').forEach(card => {
    applyCardTheme(card);
  });
  
  document.querySelectorAll('.theme-card-primary').forEach(card => {
    applyCardTheme(card, 'primary');
  });
  
  document.querySelectorAll('.theme-card-secondary').forEach(card => {
    applyCardTheme(card, 'secondary');
  });
  
  document.querySelectorAll('.theme-card-secondary2').forEach(card => {
    applyCardTheme(card, 'secondary2');
  });
};

// Initialize theme application on DOM ready
export const initThemeApplication = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyThemeToElements);
  } else {
    applyThemeToElements();
  }
  
  // Also apply when new elements are added
  const observer = new MutationObserver(() => {
    applyThemeToElements();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};