import styled from 'styled-components';
import { theme } from '../../theme/colors.js';

const StyledContainer = styled.div`
    display: block;
    font-size: 1.125rem;
    line-height: 200%;
    margin: 3rem;
`;

const StyledGreeting = styled.div`
    font-weight: bold;
    color: ${theme.secondary.main};
    font-size: 1.5rem;
`;

export { StyledContainer, StyledGreeting };
