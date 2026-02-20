/**
 * SupportScreen - Help & Support route
 *
 * Thin route file that connects the SupportSelector component
 * with the shared support options and platform link handler.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';

import { SUPPORT_OPTIONS, useOpenLink } from '@salmon/shared';
import { SupportSelector } from '../../../../src/components';

export default function SupportScreen() {
  const openLink = useOpenLink();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SupportSelector
      options={SUPPORT_OPTIONS}
      onOpenLink={openLink}
      onBack={handleBack}
    />
  );
}
