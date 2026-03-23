import { theme } from './colors.js';

// Inject CSS custom properties for theme colors
export const injectThemeCSS = () => {
  const root = document.documentElement;
  
  // Primary colors
  root.style.setProperty('--theme-primary-main', theme.primary.main);
  root.style.setProperty('--theme-primary-dark', theme.primary.dark);
  root.style.setProperty('--theme-primary-light', theme.primary.light);
  root.style.setProperty('--theme-primary-contrast', theme.primary.contrast);
  
  // Secondary colors
  root.style.setProperty('--theme-secondary-main', theme.secondary.main);
  root.style.setProperty('--theme-secondary-dark', theme.secondary.dark);
  root.style.setProperty('--theme-secondary-light', theme.secondary.light);
  root.style.setProperty('--theme-secondary-contrast', theme.secondary.contrast);
  
  // Secondary2 colors
  root.style.setProperty('--theme-secondary2-main', theme.secondary2.main);
  root.style.setProperty('--theme-secondary2-dark', theme.secondary2.dark);
  root.style.setProperty('--theme-secondary2-light', theme.secondary2.light);
  root.style.setProperty('--theme-secondary2-contrast', theme.secondary2.contrast);
  
  // Neutral colors
  root.style.setProperty('--theme-neutral-white', theme.neutral.white);
  root.style.setProperty('--theme-neutral-light', theme.neutral.light);
  root.style.setProperty('--theme-neutral-medium', theme.neutral.medium);
  root.style.setProperty('--theme-neutral-dark', theme.neutral.dark);
  root.style.setProperty('--theme-neutral-black', theme.neutral.black);
  
  // Gradients
  root.style.setProperty('--theme-gradient-primary', theme.gradients.primary);
  root.style.setProperty('--theme-gradient-secondary', theme.gradients.secondary);
  root.style.setProperty('--theme-gradient-secondary2', theme.gradients.secondary2);
  root.style.setProperty('--theme-gradient-primary-to-secondary', theme.gradients.primaryToSecondary);
  root.style.setProperty('--theme-gradient-primary-to-secondary2', theme.gradients.primaryToSecondary2);
  root.style.setProperty('--theme-gradient-secondary-to-secondary2', theme.gradients.secondaryToSecondary2);
};

// CSS class generator for theme colors
export const generateThemeCSS = () => {
  return `
    :root {
      --theme-primary-main: ${theme.primary.main};
      --theme-primary-dark: ${theme.primary.dark};
      --theme-primary-light: ${theme.primary.light};
      --theme-primary-contrast: ${theme.primary.contrast};
      
      --theme-secondary-main: ${theme.secondary.main};
      --theme-secondary-dark: ${theme.secondary.dark};
      --theme-secondary-light: ${theme.secondary.light};
      --theme-secondary-contrast: ${theme.secondary.contrast};
      
      --theme-secondary2-main: ${theme.secondary2.main};
      --theme-secondary2-dark: ${theme.secondary2.dark};
      --theme-secondary2-light: ${theme.secondary2.light};
      --theme-secondary2-contrast: ${theme.secondary2.contrast};
      
      --theme-neutral-white: ${theme.neutral.white};
      --theme-neutral-light: ${theme.neutral.light};
      --theme-neutral-medium: ${theme.neutral.medium};
      --theme-neutral-dark: ${theme.neutral.dark};
      --theme-neutral-black: ${theme.neutral.black};
      
      --theme-gradient-primary: ${theme.gradients.primary};
      --theme-gradient-secondary: ${theme.gradients.secondary};
      --theme-gradient-secondary2: ${theme.gradients.secondary2};
      --theme-gradient-primary-to-secondary: ${theme.gradients.primaryToSecondary};
      --theme-gradient-primary-to-secondary2: ${theme.gradients.primaryToSecondary2};
      --theme-gradient-secondary-to-secondary2: ${theme.gradients.secondaryToSecondary2};
    }
    
    /* Utility classes */
    .theme-bg-primary { background-color: var(--theme-primary-main) !important; }
    .theme-bg-secondary { background-color: var(--theme-secondary-main) !important; }
    .theme-bg-secondary2 { background-color: var(--theme-secondary2-main) !important; }
    .theme-text-primary { color: var(--theme-primary-main) !important; }
    .theme-text-secondary { color: var(--theme-secondary-main) !important; }
    .theme-text-secondary2 { color: var(--theme-secondary2-main) !important; }
    .theme-gradient-primary { background: var(--theme-gradient-primary) !important; }
    .theme-gradient-secondary { background: var(--theme-gradient-secondary) !important; }
    .theme-gradient-secondary2 { background: var(--theme-gradient-secondary2) !important; }
  `;
};