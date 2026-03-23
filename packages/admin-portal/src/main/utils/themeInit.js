import { injectThemeCSS, generateThemeCSS } from '../theme/cssVariables.js';

// Initialize theme on app startup
export const initializeTheme = () => {
  // Inject CSS custom properties
  injectThemeCSS();
  
  // Add theme CSS to document head
  const styleElement = document.createElement('style');
  styleElement.id = 'digital-worksite-theme';
  styleElement.textContent = generateThemeCSS();
  
  // Remove existing theme styles if any
  const existingStyle = document.getElementById('digital-worksite-theme');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(styleElement);
};

// Call on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
  initializeTheme();
}