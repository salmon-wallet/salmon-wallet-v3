import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', muted: '#999', inverse: '#000' },
    border: { subtle: '#333', default: '#555' },
    background: { primary: '#000', secondary: '#111' },
    button: {
      primaryBackground: '#fff',
      primaryText: '#000',
      disabledOpacity: 0.5,
    },
  },
  fontFamilyNative: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: { sm: 14, md: 16, lg: 18, xl: 20 },
  letterSpacing: { wide: 0, widest: 0 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, headerPadding: 16 },
  ms: (v: number) => v,
  s: (v: number) => v,
  vs: (v: number) => v,
  componentSizes: { buttonHeight: 48, buttonRadius: 24, inputHeight: 44 },
}));

import { ActionParamForm, validateParameters } from '../ActionParamForm';

describe('validateParameters', () => {
  it('marks required empty fields as invalid', () => {
    const { isValid, errors } = validateParameters(
      [{ name: 'amount', required: true, type: 'text' }],
      {},
    );
    expect(isValid).toBe(false);
    expect(errors.amount).toBe('required');
  });

  it('passes when required field has a value', () => {
    const { isValid } = validateParameters(
      [{ name: 'amount', required: true, type: 'text' }],
      { amount: '5' },
    );
    expect(isValid).toBe(true);
  });

  it('rejects values that fail pattern regex', () => {
    const { isValid, errors } = validateParameters(
      [{ name: 'pin', required: true, type: 'text', pattern: '^[0-9]{4}$' }],
      { pin: 'abcd' },
    );
    expect(isValid).toBe(false);
    expect(errors.pin).toBe('pattern');
  });

  it('accepts values matching pattern regex', () => {
    const { isValid } = validateParameters(
      [{ name: 'pin', required: true, type: 'text', pattern: '^[0-9]{4}$' }],
      { pin: '1234' },
    );
    expect(isValid).toBe(true);
  });

  it('rejects numeric below min', () => {
    const { isValid, errors } = validateParameters(
      [{ name: 'qty', required: true, type: 'number', min: 5 }],
      { qty: '2' },
    );
    expect(isValid).toBe(false);
    expect(errors.qty).toBe('min');
  });

  it('rejects numeric above max', () => {
    const { isValid, errors } = validateParameters(
      [{ name: 'qty', required: true, type: 'number', max: 10 }],
      { qty: '99' },
    );
    expect(isValid).toBe(false);
    expect(errors.qty).toBe('max');
  });

  it('treats optional empty fields as valid', () => {
    const { isValid } = validateParameters(
      [{ name: 'memo', type: 'text' }],
      {},
    );
    expect(isValid).toBe(true);
  });
});

describe('ActionParamForm', () => {
  it('renders a TextInput for type=text', () => {
    const onChange = jest.fn();
    render(
      <ActionParamForm
        parameters={[{ name: 'memo', type: 'text', label: 'Memo' }]}
        value={{}}
        onChange={onChange}
      />,
    );
    const input = screen.getByTestId('param-memo');
    fireEvent.changeText(input, 'hi');
    expect(onChange).toHaveBeenCalledWith({ memo: 'hi' });
  });

  it('renders numeric keyboard for type=number', () => {
    render(
      <ActionParamForm
        parameters={[{ name: 'qty', type: 'number' }]}
        value={{}}
        onChange={jest.fn()}
      />,
    );
    const input = screen.getByTestId('param-qty');
    expect(input.props.keyboardType).toBe('numeric');
  });

  it('renders multiline for type=textarea', () => {
    render(
      <ActionParamForm
        parameters={[{ name: 'note', type: 'textarea' }]}
        value={{}}
        onChange={jest.fn()}
      />,
    );
    const input = screen.getByTestId('param-note');
    expect(input.props.multiline).toBe(true);
  });

  it('renders option pills for type=radio and updates value on press', () => {
    const onChange = jest.fn();
    render(
      <ActionParamForm
        parameters={[
          {
            name: 'tier',
            type: 'radio',
            options: [
              { label: 'Gold', value: 'gold' },
              { label: 'Silver', value: 'silver' },
            ],
          },
        ]}
        value={{}}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByTestId('param-tier-option-gold'));
    expect(onChange).toHaveBeenCalledWith({ tier: 'gold' });
  });

  it('renders option list for type=select', () => {
    const onChange = jest.fn();
    render(
      <ActionParamForm
        parameters={[
          {
            name: 'lang',
            type: 'select',
            options: [
              { label: 'EN', value: 'en' },
              { label: 'ES', value: 'es' },
            ],
          },
        ]}
        value={{}}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByTestId('param-lang-option-es'));
    expect(onChange).toHaveBeenCalledWith({ lang: 'es' });
  });

  it('renders a Switch row for type=checkbox', () => {
    const onChange = jest.fn();
    render(
      <ActionParamForm
        parameters={[{ name: 'agree', type: 'checkbox', label: 'Agree' }]}
        value={{}}
        onChange={onChange}
      />,
    );
    const sw = screen.getByTestId('param-agree');
    fireEvent(sw, 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith({ agree: 'true' });
  });
});
