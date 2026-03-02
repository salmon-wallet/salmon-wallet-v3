## 1. Fix useBalance cache key (packages/shared)

- [x] 1.1 In `packages/shared/src/hooks/useBalance.ts`, rename `_networkId` to `networkId` (line 120) — remove the underscore prefix since the parameter is now actively used
- [x] 1.2 In the `prevAccountKeyRef` effect (line 138), change the key computation from `account?.getReceiveAddress()` to `${account?.getReceiveAddress()}:${networkId}` so network changes are detected even when the address is the same
- [x] 1.3 In `fetchBalance` (line 372), change `currentAccountKey` from `account.getReceiveAddress()` to `${account.getReceiveAddress()}:${networkId}` so the cache lookup includes the network
- [x] 1.4 Add `networkId` to the `fetchBalance` dependency array (line 419) so the callback is recreated when the network changes

## 2. Verification

- [x] 2.1 Run typecheck (`pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/web --filter=@salmon/mobile`) — shared and mobile pass, ui has pre-existing `isDanger` error unrelated to this change
- [ ] 2.2 Test web app: switch to Solana Devnet → $0.00, switch back to Solana Mainnet → should show original mainnet balance (not $0.00)
