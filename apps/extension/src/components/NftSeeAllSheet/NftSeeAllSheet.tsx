/**
 * NftSeeAllSheet - Full grid view of all NFTs for a blockchain section
 *
 * Uses BaseSheetDialog with large size, 2-column grid of NftCard.
 */
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import { spacing } from '@salmon/shared';
import { BaseSheetDialog } from '../BaseSheetDialog';
import { NftCard, NftCardSkeleton } from '../NftCard';
import type { NftSeeAllSheetProps } from './types';

const Grid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md,
  justifyItems: 'center',
});

export function NftSeeAllSheet({
  visible,
  onClose,
  title,
  nfts,
  loading,
  onNftPress,
  style,
  className,
}: NftSeeAllSheetProps) {
  return (
    <BaseSheetDialog
      visible={visible}
      onClose={onClose}
      size="large"
      colorScheme="secondary"
      showScalesBackground
      style={style}
      className={className}
    >
      <BaseSheetDialog.StandardHeader title={title} />
      <BaseSheetDialog.Content padding="lg" scrollable>
        <Grid>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <NftCardSkeleton key={i} />)
            : nfts.map((nft, index) => (
                <NftCard
                  key={`${nft.mint}-${index}`}
                  nft={nft}
                  onPress={onNftPress ? () => onNftPress(nft) : undefined}
                />
              ))}
        </Grid>
      </BaseSheetDialog.Content>
    </BaseSheetDialog>
  );
}
