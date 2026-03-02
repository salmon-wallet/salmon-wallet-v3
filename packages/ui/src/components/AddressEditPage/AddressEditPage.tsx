/**
 * AddressEditPage - Edit existing contact page
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  fontFamily,
  useAddressBookForm,
  type AddressBookEditBaseProps,
} from '@salmon/shared';
import { SettingsPageLayout } from '../SettingsPageLayout';
import { InputAddress } from '../InputAddress';

// ============================================================================
// Styled Components
// ============================================================================

const FieldLabel = styled(Typography)({
  color: colors.text.secondary,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginBottom: spacing.sm,
  marginTop: spacing.lg,
});

const StyledInput = styled(InputBase)({
  width: '100%',
  backgroundColor: colors.input.background,
  borderRadius: 12,
  border: `1px solid ${colors.input.border}`,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  '& .MuiInputBase-input': {
    padding: '12px 0',
    '&::placeholder': {
      color: colors.text.placeholder,
      opacity: 1,
    },
  },
});

const NetworkBox = styled(Box)({
  backgroundColor: colors.input.background,
  borderRadius: 12,
  padding: `${spacing.md}px ${spacing.lg}px`,
});

const NetworkText = styled(Typography)({
  color: colors.text.secondary,
  fontSize: 16,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

const SaveButton = styled(Button)({
  width: '100%',
  marginTop: spacing['2xl'],
  padding: `${spacing.md}px`,
  borderRadius: 12,
  textTransform: 'none',
  fontSize: 16,
  fontWeight: 500,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  backgroundColor: colors.accent.primary,
  color: colors.text.primary,
  '&:hover': {
    backgroundColor: colors.accent.primary,
    opacity: 0.9,
  },
  '&:disabled': {
    backgroundColor: colors.accent.primary,
    color: colors.text.primary,
    opacity: 0.4,
  },
});

// ============================================================================
// Component
// ============================================================================

export function AddressEditPage({
  contact,
  activeBlockchain: _activeBlockchain,
  onSave,
  onBack,
}: AddressBookEditBaseProps): React.ReactElement {
  const { t } = useTranslation();
  const form = useAddressBookForm({
    label: contact.name,
    address: contact.domain || contact.address,
    networkId: contact.networkId,
    resolvedAddress: contact.address,
    isDomain: !!contact.domain,
  });

  const handleSave = useCallback(async () => {
    if (!form.canSave) return;
    await onSave(contact.address, form.buildInput());
  }, [form, onSave, contact.address]);

  return (
    <SettingsPageLayout
      title={t('settings.addressbook.edit', 'Edit Address')}
      onBack={onBack}
    >
      <Box sx={{ px: `${spacing.lg}px` }}>
        {/* Label */}
        <FieldLabel>{t('settings.addressbook.label', 'Label')}</FieldLabel>
        <StyledInput
          value={form.label}
          onChange={(e) => form.setLabel(e.target.value)}
          placeholder={t('settings.addressbook.label', 'Label')}
          autoComplete="off"
          inputProps={{ spellCheck: false }}
        />

        {/* Address */}
        <Box sx={{ mt: `${spacing.lg}px` }}>
          <InputAddress
            address={form.address}
            onChange={form.setAddress}
            onValidation={form.handleValidation}
            label={t('general.address', 'Address')}
          />
        </Box>

        {/* Network */}
        <FieldLabel>Network</FieldLabel>
        <NetworkBox>
          <NetworkText>{contact.networkId.split('-')[0].charAt(0).toUpperCase() + contact.networkId.split('-')[0].slice(1)}</NetworkText>
        </NetworkBox>

        {/* Save */}
        <SaveButton onClick={handleSave} disabled={!form.canSave}>
          {t('settings.addressbook.save', 'Save Address')}
        </SaveButton>
      </Box>
    </SettingsPageLayout>
  );
}
