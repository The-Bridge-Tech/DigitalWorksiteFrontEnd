import styled from 'styled-components';
import { theme } from '../../../theme/colors.js';

export const StyledContainer = styled.div`
    display: block;
    font-size: 1.125rem;
    line-height: 200%;
    margin: 3rem;
    background: ${theme.neutral.white};
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;
