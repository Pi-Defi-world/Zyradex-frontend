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