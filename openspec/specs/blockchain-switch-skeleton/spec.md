# blockchain-switch-skeleton Specification

## Purpose

Define how the blockchain carousel on the HomePage stays in sync with the persisted `networkId`. The active carousel index must reflect the network restored from storage on mount and update whenever `networkId` or `allNetworks` changes from outside the carousel (e.g., settings actions, developer-networks toggle), so the visible card always matches the wallet's selected network.

## Requirements

### Requirement: Carousel index MUST sync with persisted networkId on mount
On all platforms (web, extension, mobile), the HomePage SHALL synchronize `activeBlockchainIndex` with the persisted `networkId` when the component mounts and when `networkId` or `allNetworks` changes. If `networkId` maps to an index in `allNetworks` that differs from the current `activeBlockchainIndex`, the carousel index SHALL be updated to match.

#### Scenario: App loads with Bitcoin as stored network
- **WHEN** the HomePage mounts with `networkId: 'bitcoin-mainnet'` restored from localStorage and `allNetworks` is `[solana-mainnet, solana-devnet, bitcoin-mainnet, bitcoin-testnet]`
- **THEN** `activeBlockchainIndex` SHALL be set to `2` (the index of `bitcoin-mainnet` in `allNetworks`), and the carousel SHALL display the Bitcoin mainnet card

#### Scenario: App loads with Solana Devnet as stored network
- **WHEN** the HomePage mounts with `networkId: 'solana-devnet'` and developer networks enabled
- **THEN** `activeBlockchainIndex` SHALL be set to the index of `solana-devnet` in `allNetworks`, and the carousel SHALL display the Solana Devnet card

#### Scenario: networkId not found in allNetworks
- **WHEN** `networkId` refers to a network not present in `allNetworks` (e.g., developer networks was disabled and the stored network is a devnet)
- **THEN** `activeBlockchainIndex` SHALL NOT be modified by the sync effect (the existing out-of-bounds reset effect handles this case)

#### Scenario: External network change updates carousel
- **WHEN** `networkId` changes programmatically (e.g., from a settings action) without going through `handleBlockchainChange`
- **THEN** the carousel index SHALL update to reflect the new `networkId`
