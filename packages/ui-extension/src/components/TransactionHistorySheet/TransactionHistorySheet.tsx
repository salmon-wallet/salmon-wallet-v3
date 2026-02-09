/**
 * TransactionHistorySheet - Dialog for transaction history (web/extension version)
 *
 * Migrated from packages/ui (React Native) to MUI Dialog.
 *
 * Features:
 * - MUI Dialog container (replacing RN Modal + Reanimated)
 * - Scrollable transaction list with .map() (replacing FlatList)
 * - Loading skeletons (MUI Skeleton replacing react-content-loader)
 * - Empty and error states
 * - Infinite scroll via scroll event listener
 * - ScalesBackground decorative pattern
 */

import React, { useCallback, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { colors, spacing, borderRadius } from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { TransactionItem } from './TransactionItem';
import type { TransactionHistorySheetProps, Transaction } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.dialog.border}`,
    minWidth: 380,
    maxWidth: 440,
    maxHeight: '85vh',
    overflow: 'hidden',
    position: 'relative',
  },
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: 0,
  pointerEvents: 'none',
});

const StyledDialogTitle = styled(DialogTitle)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const TitleText = styled(Typography)({
  fontSize: 20,
  fontWeight: 800,
  color: colors.text.primary,
  letterSpacing: -0.12,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.xl}px`,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// Skeleton styles
const SkeletonItem = styled(Box)({
  backgroundColor: colors.background.tokenItem,
  borderRadius: 12,
  marginBottom: 12,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
});

const SkeletonInfoSection = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

const SkeletonRightSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 4,
});

// Empty state styles
const EmptyContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `60px ${spacing.lg}px`,
});

const EmptyTitle = styled(Typography)({
  fontSize: 16,
  fontWeight: 500,
  color: colors.text.primary,
  marginTop: 16,
  marginBottom: 10,
});

const EmptySubtitle = styled(Typography)({
  fontSize: 14,
  color: colors.text.secondary,
  textAlign: 'center',
});

// Error state styles
const ErrorContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `60px ${spacing.lg}px`,
});

const ErrorTitle = styled(Typography)({
  fontSize: 16,
  fontWeight: 500,
  color: colors.text.primary,
  marginBottom: 10,
});

const ErrorMessage = styled(Typography)({
  fontSize: 14,
  color: colors.text.secondary,
  textAlign: 'center',
  marginBottom: 18,
});

const RetryButton = styled(Button)({
  backgroundColor: colors.accent.primary,
  color: colors.text.primary,
  textTransform: 'none',
  fontWeight: 500,
  padding: `8px 24px`,
  borderRadius: 10,
  '&:hover': {
    backgroundColor: colors.accent.primary,
    opacity: 0.9,
  },
});

// Loading more indicator
const LoadingMoreContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  padding: `16px 0`,
});

// ============================================================================
// Skeleton Components
// ============================================================================

const TransactionItemSkeleton: React.FC = () => (
  <SkeletonItem>
    <Skeleton
      variant="circular"
      width={40}
      height={40}
      sx={{ bgcolor: colors.skeleton.base, flexShrink: 0 }}
    />
    <SkeletonInfoSection>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Skeleton
          variant="rounded"
          width={70}
          height={14}
          sx={{ bgcolor: colors.skeleton.base }}
        />
        <Skeleton
          variant="rounded"
          width={50}
          height={12}
          sx={{ bgcolor: colors.skeleton.base }}
        />
      </Box>
      <Skeleton
        variant="rounded"
        width={100}
        height={12}
        sx={{ bgcolor: colors.skeleton.base }}
      />
    </SkeletonInfoSection>
    <SkeletonRightSection>
      <Skeleton
        variant="rounded"
        width={80}
        height={14}
        sx={{ bgcolor: colors.skeleton.base }}
      />
      <Skeleton
        variant="rounded"
        width={60}
        height={12}
        sx={{ bgcolor: colors.skeleton.base }}
      />
      <Skeleton
        variant="rounded"
        width={40}
        height={10}
        sx={{ bgcolor: colors.skeleton.base }}
      />
    </SkeletonRightSection>
  </SkeletonItem>
);

const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <TransactionItemSkeleton key={`skeleton-${index}`} />
    ))}
  </Box>
);

// ============================================================================
// State Components
// ============================================================================

const EmptyState: React.FC = () => (
  <EmptyContainer>
    <ReceiptLongIcon sx={{ fontSize: 48, color: colors.text.tertiary }} />
    <EmptyTitle>No Transactions</EmptyTitle>
    <EmptySubtitle>Your transaction history will appear here</EmptySubtitle>
  </EmptyContainer>
);

const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <ErrorContainer>
    <ErrorTitle>Failed to load transactions</ErrorTitle>
    <ErrorMessage>{message}</ErrorMessage>
    {onRetry && (
      <RetryButton
        onClick={onRetry}
        startIcon={<RefreshIcon />}
      >
        Tap to retry
      </RetryButton>
    )}
  </ErrorContainer>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransactionHistorySheet - Dialog for displaying transaction history
 *
 * @example
 * ```tsx
 * <TransactionHistorySheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   transactions={transactions}
 *   loading={loading}
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 * />
 * ```
 */
export const TransactionHistorySheet: React.FC<TransactionHistorySheetProps> = ({
  visible,
  onClose,
  transactions,
  loading = false,
  loadingMore = false,
  onLoadMore,
  hasMore = false,
  hiddenBalance = false,
  onTransactionPress,
  onTransactionDetailClick,
  error = null,
  onRetry,
  className,
  style,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingMore || !onLoadMore) return;

      const target = event.currentTarget;
      const scrollBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      // Trigger load more when within 100px of the bottom
      if (scrollBottom < 100) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore]
  );

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      onTransactionPress?.(transaction);
    },
    [onTransactionPress]
  );

  const handleTransactionDetailClick = useCallback(
    (transaction: Transaction) => {
      onTransactionDetailClick?.(transaction);
    },
    [onTransactionDetailClick]
  );

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="transaction-history-title"
      className={className}
      PaperProps={{ style }}
    >
      {/* Decorative background */}
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

      {/* Title Bar */}
      <StyledDialogTitle id="transaction-history-title">
        <TitleText>Transaction History</TitleText>
        <CloseButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      {/* Content */}
      <StyledDialogContent
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* Error State */}
        {error && !loading && (
          <ErrorState message={error} onRetry={onRetry} />
        )}

        {/* Loading State */}
        {loading && !error && (
          <TransactionListSkeleton count={6} />
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <EmptyState />
        )}

        {/* Transaction List */}
        {!loading && !error && transactions.length > 0 && (
          <Box>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onPress={handleTransactionPress}
                onDetailClick={handleTransactionDetailClick}
                hiddenBalance={hiddenBalance}
              />
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <LoadingMoreContainer>
                <CircularProgress
                  size={24}
                  sx={{ color: colors.accent.primary }}
                />
              </LoadingMoreContainer>
            )}
          </Box>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default TransactionHistorySheet;
