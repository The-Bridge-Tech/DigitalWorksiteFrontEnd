import React, { createContext, useContext } from 'react';
import styled from 'styled-components';
import { theme } from './colors.js';

// Theme Context
const ThemeContext = createContext(theme);

// Theme Provider Component
export const ThemeProvider = ({ children, customTheme = {} }) => {
  const mergedTheme = { ...theme, ...customTheme };
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme in components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return theme; // Fallback to default theme
  }
  return context;
};

// Helper function to create styled components with theme access
export const createStyledComponent = (component, styles) => {
  return styled(component)`
    ${props => styles(props.theme || theme, props)}
  `;
};

// Pre-built styled components with theme
export const StyledButton = styled.button`
  background: ${props => props.variant === 'secondary' ? props.theme.secondary.main : 
                props.variant === 'secondary2' ? props.theme.secondary2.main : 
                props.theme.primary.main};
  color: ${props => props.variant === 'secondary' ? props.theme.secondary.contrast : 
            props.variant === 'secondary2' ? props.theme.secondary2.contrast : 
            props.theme.primary.contrast};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'secondary' ? props.theme.secondary.dark : 
                  props.variant === 'secondary2' ? props.theme.secondary2.dark : 
                  props.theme.primary.dark};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: ${props => props.theme.neutral.medium};
    color: ${props => props.theme.neutral.white};
    cursor: not-allowed;
    transform: none;
  }
`;

export const StyledCard = styled.div`
  background: ${props => props.theme.neutral.white};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => props.theme.primary.main};
`;

export const StyledGradientBackground = styled.div`
  background: ${props => props.gradient ? props.theme.gradients[props.gradient] : props.theme.gradients.primary};
  color: ${props => props.theme.neutral.white};
  padding: 1rem;
  border-radius: 8px;
`;