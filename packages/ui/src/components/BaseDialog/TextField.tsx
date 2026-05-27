/**
 * BaseDialog.TextField - Styled text field for dialogs
 */

import React from 'react';
import { StyledTextField } from './styles';
import type { TextFieldProps } from './types';

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error = false,
  helperText,
  disabled = false,
  autoFocus = false,
  placeholder,
  onKeyDown,
}: TextFieldProps): React.ReactElement {
  return (
    <StyledTextField
      fullWidth
      type={type}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      error={error}
      helperText={helperText}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
    />
  );
}
