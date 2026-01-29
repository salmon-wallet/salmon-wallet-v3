import * as React from 'react';
import { render, screen } from '@testing-library/react-native';

import { MonoText } from '../StyledText';

it('renders correctly', () => {
  render(<MonoText>Test text</MonoText>);
  expect(screen.getByText('Test text')).toBeTruthy();
});
