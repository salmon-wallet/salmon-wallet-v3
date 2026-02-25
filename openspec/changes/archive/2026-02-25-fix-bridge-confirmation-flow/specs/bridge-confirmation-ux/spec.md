## ADDED Requirements

### Requirement: Backend exchange response uses camelCase fields
The backend `createExchange` endpoint SHALL apply the `bridge-exchange-resource` decorator and return camelCase field names matching the frontend `BridgeExchange` type (`payinAddress`, `payoutAddress`, `amountExpectedFrom`, `amountExpectedTo`, `currencyFrom`, `currencyTo`).

#### Scenario: Exchange creation returns mapped fields
- **WHEN** the frontend calls `GET /v1/bridge/exchange?symbolIn=usdc&symbolOut=btc&amount=33&addressTo=...`
- **THEN** the response SHALL contain `payinAddress` (not `address_from`), `amountExpectedTo` (not `amount_to`), and all other fields in camelCase
- **AND** the `status` field SHALL be transformed via `getStatus()` as already done for `getTransaction`

### Requirement: Single notification on bridge success
When a bridge exchange is created successfully, exactly ONE notification mechanism SHALL fire. The duplicate `onBridgeInitiated` callback SHALL be removed.

#### Scenario: No duplicate alerts
- **WHEN** the user confirms a bridge swap
- **THEN** `onBridgeSuccess` SHALL be called exactly once
- **AND** `onBridgeInitiated` SHALL NOT be called (removed)
- **AND** no `window.alert()` or `Alert.alert()` SHALL appear

### Requirement: Bridge info shown in success screen
After a successful bridge exchange creation, the in-app success screen SHALL display the bridge deposit address, input amount with symbol, estimated output amount with symbol, and exchange ID.

#### Scenario: Success screen shows bridge details
- **WHEN** the bridge exchange is created successfully
- **THEN** the success screen SHALL display the deposit address where the user must send funds
- **AND** SHALL display the input amount and symbol (e.g., "33 USDC")
- **AND** SHALL display the estimated output amount and symbol (e.g., "0.00041798 BTC")
- **AND** SHALL display the exchange ID for tracking
- **AND** SHALL NOT show an explorer link (bridges are off-chain)
