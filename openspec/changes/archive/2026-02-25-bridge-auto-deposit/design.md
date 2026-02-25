## Context

StealthEx is a non-custodial exchange. The flow is:
1. Client creates exchange via API → gets `payinAddress` (deposit address)
2. **Client sends funds** to `payinAddress` on-chain
3. StealthEx detects the deposit and executes the swap
4. StealthEx sends output tokens to `payoutAddress`

Step 2 is currently missing. The wallet has the transfer infrastructure already built:
- `SolanaAccount.transfer(to, token, amount)` — signs and broadcasts SPL/SOL transfers
- `EthereumAccount.transfer(to, token, amount)` — same for ERC-20/ETH
- `BitcoinAccount.transfer(to, token, amount)` — same for BTC
- All accessed via `BlockchainAccount` interface with the same `.transfer()` signature

## Goals / Non-Goals

**Goals:**
- After exchange creation, automatically transfer input tokens to the deposit address
- Use existing `BlockchainAccount.transfer()` — no new transfer logic
- Show deposit transaction ID in the success screen
- Handle transfer failure gracefully (show error, don't show fake success)

**Non-Goals:**
- Implementing fee estimation UI before the deposit (the bridge review already shows the estimate)
- Polling StealthEx for exchange completion status (future feature)
- Supporting partial deposits or retry logic

## Decisions

### 1. Add `onSendDeposit` callback to SwapScreenProps

**Decision:** Add a new callback `onSendDeposit(depositAddress: string, tokenAddress: string, amount: number) => Promise<{ txId: string }>` to `SwapScreenProps`. Each platform's SwapPage implements it using `activeBlockchainAccount.transfer()`.

**Rationale:** The shared hook (`useSwapScreenLogic`) can't import blockchain accounts directly — it receives everything via props. This follows the existing pattern where `onSwap`, `onGetQuote`, etc. are all prop callbacks.

### 2. Execute deposit inside `handleConfirmBridge`, after exchange creation

**Decision:** In `handleConfirmBridge`, after `onCreateBridgeExchange` succeeds, immediately call `onSendDeposit` with the returned `depositAddress`. If the deposit transfer fails, throw an error (which is caught by the existing error handling).

**Rationale:** The deposit is a direct consequence of exchange creation — it's not a separate user action. The user already confirmed the bridge on the review screen. Splitting it into two steps would add friction without benefit.

### 3. Store deposit txId alongside exchange in success state

**Decision:** Extend the success state to include `depositTxId: string | null`. Show it in the success screen alongside the exchange info.

**Rationale:** The user needs to see proof that funds were sent, and can use the txId to verify on a block explorer.

## Risks / Trade-offs

- **[Risk] Transfer fails after exchange is created** → Mitigation: StealthEx exchanges without deposits simply expire after ~24h. The user keeps their funds. Show clear error message.
- **[Risk] Network congestion causes transfer to be slow** → Mitigation: The existing `transfer()` waits for confirmation. The UI shows "Processing..." while waiting.
- **[Trade-off] No fee estimation step before deposit** → Acceptable because Solana fees are negligible (~0.000005 SOL) and the user already reviewed the bridge amounts.
