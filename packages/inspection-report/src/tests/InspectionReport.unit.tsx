import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InspectionReport from '../InspectionReport';

test('increases counter when button is clicked', async () => {
    const user = userEvent.setup();
    render(<InspectionReport />);
    const button = await screen.findByRole('button');
    await user.click(button);
    expect(screen.getByTestId('message')).toHaveTextContent("You've clicked the button 1 time");
});

test('displays the correct message when counter is zero', async () => {
    render(<InspectionReport />);
    expect(screen.getByTestId('message')).toHaveTextContent('You should try clicking the button.');
});
