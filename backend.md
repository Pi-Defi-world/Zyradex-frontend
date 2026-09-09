http://localhost:8000/api-docs/#/

Pi DEX API
 1.0.0 
OAS 3.0
Pi Blockchain-based DEX API Documentation

Servers

http://localhost:8000 - Local Dev Server

Authorize
Account
Account import, balances and transactions



POST
/v1/account/import
Import account from mnemonic or secret


Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "mnemonic": "string",
  "secret": "string"
}
Responses
Code	Description	Links
200	
Imported successfully

No links

GET
/v1/account/balance/{publicKey}
Get balances by publicKey (path)



GET
/v1/account/operations/{publicKey}
Get account operations by publicKey (param) with pagination


Fees
Endpoints for managing all platform and DEX-related fees



GET
/v1/fees
List all configured fees



POST
/v1/fees
Create a new fee configuration



PUT
/v1/fees/{key}
Update an existing fee configuration



DELETE
/v1/fees/{key}
Delete an existing fee configuration


Deletes a fee configuration by key. Only accessible to authenticated admins.

Parameters
Try it out
Name	Description
key *
string
(path)
The key of the fee to delete

key
Responses
Code	Description	Links
200	
Fee deleted successfully

Media type

application/json
Controls Accept header.
Example Value
{
  "success": true,
  "message": "Fee with key 'swap.transaction' has been deleted."
}
No links
404	
Fee not found

Media type

application/json
Example Value
{
  "success": false,
  "message": "Fee not found"
}
No links
Tokens
Operations for token creation, trustlines, and burning



GET
/v1/tokens
Get all tokens



POST
/v1/tokens/trustline
Establish trustline for a token



POST
/v1/tokens/mint
Mint new token



POST
/v1/tokens/burn
Burn existing tokens


Liquidity
Liquidity pool creation, deposit, withdraw, and rewards



GET
/v1/liquidity-pools
List all liquidity pools



POST
/v1/liquidity-pools
Create a new liquidity pool



POST
/v1/liquidity-pools/deposit
Deposit liquidity into pool



POST
/v1/liquidity-pools/withdraw
Withdraw liquidity from pool



GET
/v1/liquidity-pools/rewards
Get rewards for liquidity provider



GET
/v1/liquidity-pools/user-pools
Get all pools a user participates in


Swap
Token swapping operations via liquidity pools



POST
/v1/swap
Swap token using pool matching algthm (simple)



GET
/v1/swap/quote
Preview swap result using x*y=k formula



POST
/v1/swap/execute
Execute token swap through liquidity pool



GET
/v1/swap/pools-for-pair
Get list of pools supporting swap between token pair



POST
/v1/swap/distribute-fees
Distribute accumulated swap fees to LP holders


Pairs
Endpoints for managing and verifying tradable token pairs (pool registry).


OrderBook
Endpoints for retrieving live market order books and user offers from Horizon.



GET
/v1/market/orderbook
Get order book for a pair



GET
/v1/market/offers/{account}
List active offers by account


Trade
Endpoints for creating, buying, and cancelling trade offers on Stellar DEX.



POST
/v1/trade/sell
Create a sell offer



POST
/v1/trade/buy
Create a buy offer



POST
/v1/trade/cancel
Cancel a trade offer

---

## Launchpad (Pi Launchpad)

Base path: `/v1/launchpad`

| Method | Path | Description |
|--------|------|-------------|
| POST | /launches | Create launch (projectId, projectAppUrl, tokenAsset, T_available, etc.) |
| GET | /launches | List launches (query: limit, status) |
| GET | /launches/:launchId | Get single launch |
| PATCH | /launches/:launchId/status | Transition launch status (body: { status }) |
| GET | /launches/:launchId/pi-power | Get PiPower for user (query: userId) |
| POST | /launches/:launchId/commit | Commit Pi (body: { committedPi, userId? }) |
| POST | /launches/:launchId/engagement | Record engagement event (body: { userId?, eventType, payload? }) |
| POST | /launches/:launchId/close-window | Close participation window |
| POST | /launches/:launchId/run-allocation | Run allocation (Design 1) |
| POST | /launches/:launchId/escrow | Create escrow wallet |
| POST | /launches/:launchId/execute-tge | Execute TGE (body: { escrowSecret }) |
| POST | /launches/:launchId/dividend-rounds | Create dividend round (body: { recordAt?, totalPayoutAmount }) |

---

## Dividend rounds

Base path: `/v1/dividend-rounds`

| Method | Path | Description |
|--------|------|-------------|
| POST | /:roundId/snapshot | Run holder snapshot (Stellar Horizon); creates holder records with payout amounts (0.6% fee applied) |
| GET | /:roundId | Get round details |
| GET | /:roundId/holders | List holders (query: limit, cursor) |
| POST | /:roundId/claim | Record claim (body: { publicKey, txHash }) |

---

## Savings

Base path: `/v1/savings`

| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List savings products (query: asset?) |
| POST | /products | Create product (body: asset, termDays, apy, minAmount?, active?) |
| POST | /deposit | Create position (body: productId, amount, userId; auth or body) |
| GET | /positions | List user positions (query: userId; auth or query) (query: status?) |
| POST | /positions/:positionId/withdraw | Withdraw (0.6% fee on interest portion) |

---

## Lending

Base path: `/v1/lending`

| Method | Path | Description |
|--------|------|-------------|
| GET | /pools | List lending pools (query: active?) |
| POST | /pools | Create pool (body: asset, supplyRate, borrowRate, collateralFactor, collateralAssets?) |
| GET | /pools/:poolId | Get pool |
| POST | /pools/:poolId/supply | Supply (body: amount, userId?); 0.6% fee on deposit |
| POST | /pools/:poolId/withdraw | Withdraw (body: amount, userId?) |
| POST | /pools/:poolId/borrow | Borrow (body: collateralAsset, collateralAmount, borrowAmount, userId?); 0.6% origination fee; rate from env (small/big business) + credit discount |
| GET | /positions | Get user positions (query: userId); returns supply and borrow with accrued interest and totalDebt |
| POST | /positions/:borrowPositionId/repay | Repay (body: amount) |
| POST | /positions/:borrowPositionId/liquidate | Liquidate (body: repayAmount, userId?) |
| GET | /prices | Get asset prices in Pi (query: assets, comma-separated) |
| GET | /credit-score | Get credit score (query: userId; required) |
| POST | /credit-score | Set credit score (body: userId, score 0–100) |
| GET | /fee-destination | Get platform fee public key (where 0.6% fees are sent) |