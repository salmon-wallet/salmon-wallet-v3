## ADDED Requirements

### Requirement: CollectiblesTab fetches and displays NFTs by blockchain
The CollectiblesTab (rendered inside HomePage's collectibles tab) SHALL fetch NFTs for each blockchain the active account has, using `activeAccount.networksAccounts`, and render one NftCarouselSection per blockchain.

#### Scenario: User views collectibles with Solana NFTs
- **WHEN** user switches to Collectibles tab and account has Solana NFTs
- **THEN** an NftCarouselSection titled "Solana NFTs (N)" renders with NFT cards

#### Scenario: Account has NFTs on multiple chains
- **WHEN** account has NFTs on Solana and Ethereum
- **THEN** two NftCarouselSection components render, one per blockchain

#### Scenario: No NFTs found
- **WHEN** account has no NFTs on any chain
- **THEN** an empty state message is shown

### Requirement: NftCarouselSection see-all navigates to NftSeeAllRoute
The `onSeeAllPress` callback SHALL navigate to `/nft/all` passing the blockchain and NFTs via location state.

#### Scenario: User taps See All
- **WHEN** user clicks "See All" on a Solana NftCarouselSection
- **THEN** app navigates to `/nft/all` with `{ blockchain: 'solana', nfts, title }` in location state

### Requirement: NftCarouselSection press navigates to NftDetailRoute
The `onNftPress` callback SHALL navigate to `/nft/:mint` passing the NFT data via location state.

#### Scenario: User taps an NFT card
- **WHEN** user clicks an NFT card
- **THEN** app navigates to `/nft/{mint}` with the full NftData in location state

### Requirement: NftSeeAllRoute renders NftSeeAllPage
The NftSeeAllRoute SHALL read NFT data from location state and render NftSeeAllPage from `@salmon/ui`. If location state is missing (deep link), it SHALL show a fallback message.

#### Scenario: Normal navigation from collectibles
- **WHEN** user navigates via See All button (location state present)
- **THEN** NftSeeAllPage renders with the full NFT grid

#### Scenario: Deep link without state
- **WHEN** user navigates directly to `/nft/all` without location state
- **THEN** a message directs user back to home (NFTs need to be loaded from collectibles tab)

### Requirement: NftDetailRoute renders NftDetailPage
The NftDetailRoute SHALL read NFT data from location state and render NftDetailPage from `@salmon/ui` with send and burn actions.

#### Scenario: User views NFT detail
- **WHEN** user clicks an NFT from collectibles or see-all
- **THEN** NftDetailPage shows the NFT image, name, attributes, and action buttons

#### Scenario: User sends NFT
- **WHEN** user clicks Send on NftDetailPage
- **THEN** NftSendDialog opens for entering recipient address

#### Scenario: Deep link without state
- **WHEN** user navigates directly to `/nft/{mint}` without location state
- **THEN** a message directs user back to home

### Requirement: NftDetailRoute back navigation
The onBack callback SHALL call `navigate(-1)` to return to the previous page.

#### Scenario: User goes back from NFT detail
- **WHEN** user clicks back on NftDetailPage
- **THEN** app navigates back to the previous page (collectibles tab or see-all)
