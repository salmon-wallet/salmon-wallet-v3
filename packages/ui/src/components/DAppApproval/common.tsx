import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
} from '@salmon/shared';
import { styled } from '../../utils/styled';

export const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  maxHeight: '100vh',
  padding: spacing.lg,
  background: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
  fontFamily: fontFamily.sans,
  overflow: 'hidden',
});

export const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 360,
  margin: '0 auto',
  minHeight: 0,
  padding: spacing.lg,
  gap: spacing.lg,
});

export const Header = styled(Box)({
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.md,
  paddingTop: spacing.sm,
});

export const LogoWrap = styled(Box)({
  width: 72,
  height: 72,
  borderRadius: borderRadius.full,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'radial-gradient(circle at top, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 52%, rgba(255, 255, 255, 0.02) 100%)',
  border: `1px solid ${colors.border.subtle}`,
  boxShadow: '0 18px 48px rgba(0, 0, 0, 0.3)',
});

export const LogoImage = styled('img')({
  width: 38,
  height: 38,
  objectFit: 'contain',
});

export const Title = styled(Typography)({
  fontSize: fontSize.title,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  textAlign: 'center',
  letterSpacing: '-0.02em',
});

export const Subtitle = styled(Typography)({
  maxWidth: 300,
  fontSize: fontSize.base,
  color: colors.text.secondary,
  textAlign: 'center',
  lineHeight: 1.5,
});

export const ScrollArea = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  paddingRight: spacing.xs,
  marginRight: -spacing.xs,
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: colors.border.default,
    borderRadius: borderRadius.full,
  },
});

export const Card = styled(Box)({
  width: '100%',
  padding: spacing.xl,
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.045) 100%)',
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: borderRadius.xl,
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)',
});

export const Label = styled(Typography)({
  fontSize: fontSize.xs,
  color: colors.text.secondary,
  fontWeight: fontWeight.medium,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: spacing.xs,
});

export const Value = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  wordBreak: 'break-all',
});

export const AppIdentityRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  marginBottom: spacing.sm,
});

export const AppIdentityIcon = styled('img')({
  width: 40,
  height: 40,
  borderRadius: borderRadius.md,
  objectFit: 'cover',
  flexShrink: 0,
  border: `1px solid ${colors.border.subtle}`,
  backgroundColor: colors.interactive.surface,
});

export const AppIdentityText = styled(Box)({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs / 2,
});

export const AppIdentityName = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  wordBreak: 'break-word',
});

export const MonoValue = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.secondary,
  fontFamily: fontFamily.mono,
  wordBreak: 'break-all',
  marginTop: spacing.sm,
});

export const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  flexShrink: 0,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  background: 'transparent',
});

export const SummaryGrid = styled(Box)({
  display: 'grid',
  width: '100%',
  gridTemplateColumns: '1fr',
  gap: spacing.md,
  '@media (min-width: 480px)': {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
});

export const SummaryItem = styled(Box)({
  padding: spacing.md,
  borderRadius: borderRadius.lg,
  backgroundColor: colors.interactive.surface,
  border: `1px solid ${colors.border.subtle}`,
});

export const SummaryLabel = styled(Typography)({
  fontSize: fontSize.xs,
  color: colors.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: spacing.xs,
});

export const SummaryValue = styled(Typography)({
  fontSize: fontSize.base,
  color: colors.text.primary,
  fontWeight: fontWeight.semibold,
  wordBreak: 'break-word',
});

export const Divider = styled(Box)({
  width: '100%',
  height: 1,
  backgroundColor: colors.border.subtle,
  margin: `${spacing.sm}px 0`,
});

export const FooterNote = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.secondary,
  lineHeight: 1.45,
});
