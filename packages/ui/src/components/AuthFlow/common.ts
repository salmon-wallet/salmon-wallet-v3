import { borderRadius, colors } from '@salmon/shared';

export function getAuthContainerStyles(contained = false) {
  if (!contained) {
    return {
      minHeight: '100vh',
      width: '100%',
    };
  }

  return {
    width: 'min(100%, 380px)',
    height: 'min(760px, calc(100vh - 48px))',
    margin: '24px auto',
    borderRadius: borderRadius['2xl'],
    border: `1px solid ${colors.border.subtle}`,
    boxShadow: '0 28px 64px rgba(0, 0, 0, 0.38)',
    overflow: 'hidden',
  };
}
