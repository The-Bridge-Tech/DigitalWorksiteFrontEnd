import React from 'react';
import layout from '@splunk/react-page';
import ReportingCenter from '@splunk/reporting-center';
import { getUserTheme } from '@splunk/splunk-utils/themes';
import { StyledContainer } from './Styles';

getUserTheme()
    .then((theme) => {
        layout.default(
            <StyledContainer>
                <ReportingCenter />
            </StyledContainer>,
            {
                theme,
            }
        );
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
