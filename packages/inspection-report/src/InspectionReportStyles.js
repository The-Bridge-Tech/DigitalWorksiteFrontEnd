import styled from 'styled-components';

// Import theme from admin-portal since inspection-report doesn't have its own theme
const theme = {
  primary: { main: '#2DBE60', dark: '#1E8E4A', light: '#4DD17A', contrast: '#ffffff' },
  neutral: { white: '#ffffff', light: '#f8f9fa', medium: '#6c757d', dark: '#343a40', black: '#000000' }
};

const StyledContainer = styled.div`
    display: inline-block;
    font-size: 1.125rem;
    line-height: 200%;
    margin: 2rem 1rem;
    padding: 2rem 3rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    background-color: ${theme.neutral.white};
    border-left: 4px solid ${theme.primary.main};
`;

const StyledGreeting = styled.div`
    font-weight: bold;
    color: ${theme.primary.main};
    font-size: 1.5rem;
`;

export { StyledContainer, StyledGreeting };
