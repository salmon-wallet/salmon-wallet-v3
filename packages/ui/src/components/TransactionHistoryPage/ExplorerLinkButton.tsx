/**
 * ExplorerLinkButton - Button to view transactions on blockchain explorers
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 * Uses window.open instead of Linking.openURL.
 *
 * Features:
 * - Single button mode opens the default explorer
 * - Menu mode with multiple explorer options via MUI Menu
 */

import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '../../utils/styled';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LanguageIcon from '@mui/icons-material/Language';
import {
  colors,
  borderRadius,
  getTransactionUrl,
  getAvailableExplorers,
  getDefaultExplorer,
} from '@salmon/shared';
import type { ExplorerLinkButtonProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledButton = styled(ButtonBase)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  backgroundColor: `${colors.palette.amber}15`,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.palette.amber}30`,
  width: '100%',
  gap: 8,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: `${colors.palette.amber}25`,
  },
});

const ButtonText = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.palette.amber,
});

const StyledMenu = styled(Menu)({
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(56, 63, 82, 0.20)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${colors.border.default}`,
    borderRadius: borderRadius.lg,
  },
});

const StyledMenuItem = styled(MenuItem)({
  padding: '12px 16px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

// ============================================================================
// Component
// ============================================================================

export function ExplorerLinkButton({
  txHash,
  blockchain = 'SOLANA',
  environment = 'solana-mainnet',
  explorerKey,
  showMenu = false,
  onPress,
  className,
}: ExplorerLinkButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const availableExplorers = useMemo(
    () => getAvailableExplorers(blockchain, environment),
    [blockchain, environment]
  );

  const selectedExplorerKey = explorerKey || getDefaultExplorer(blockchain);

  const selectedExplorer = useMemo(
    () => availableExplorers.find((e) => e.key === selectedExplorerKey),
    [availableExplorers, selectedExplorerKey]
  );

  const openExplorer = useCallback(
    (explorer: { key: string; name: string }) => {
      const url = getTransactionUrl(blockchain, environment, explorer.key, txHash);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        onPress?.(url, explorer.name);
      }
      setAnchorEl(null);
    },
    [blockchain, environment, txHash, onPress]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (showMenu && availableExplorers.length > 1) {
        setAnchorEl(event.currentTarget);
      } else if (selectedExplorer) {
        openExplorer(selectedExplorer);
      }
    },
    [showMenu, availableExplorers, selectedExplorer, openExplorer]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  if (availableExplorers.length === 0 || !selectedExplorer) {
    return null;
  }

  const buttonText =
    showMenu && availableExplorers.length > 1
      ? 'View on Explorer'
      : `View on ${selectedExplorer.name}`;

  return (
    <>
      <StyledButton
        onClick={handleClick}
        className={className}
        aria-label={buttonText}
      >
        <OpenInNewIcon sx={{ fontSize: 16, color: colors.palette.amber }} />
        <ButtonText>{buttonText}</ButtonText>
        {showMenu && availableExplorers.length > 1 && (
          <ExpandMoreIcon sx={{ fontSize: 14, color: colors.palette.amber }} />
        )}
      </StyledButton>

      {showMenu && availableExplorers.length > 1 && (
        <StyledMenu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: { width: anchorEl?.offsetWidth },
            },
          }}
        >
          {availableExplorers.map((explorer) => (
            <StyledMenuItem
              key={explorer.key}
              onClick={() => openExplorer(explorer)}
            >
              <ListItemIcon>
                <LanguageIcon sx={{ fontSize: 18, color: colors.text.primary }} />
              </ListItemIcon>
              <ListItemText
                primary={explorer.name}
                primaryTypographyProps={{
                  sx: { fontSize: 13, fontWeight: 500, color: colors.text.primary },
                }}
              />
              <OpenInNewIcon sx={{ fontSize: 16, color: colors.text.tertiary }} />
            </StyledMenuItem>
          ))}
        </StyledMenu>
      )}
    </>
  );
}

export default ExplorerLinkButton;
