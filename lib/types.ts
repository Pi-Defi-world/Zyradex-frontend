
export interface IAssetMetadata {
  name?: string
  description?: string
  image?: string
  code?: string
  issuer?: string
  homeDomain?: string
}



export interface IAssetRecord {
  _links: {
    toml: {
      href: string
    }
  }
  asset_type: string
  asset_code: string
  asset_issuer: string
  paging_token: string
  num_claimable_balances: number
  num_liquidity_pools: number
  num_contracts: number
  accounts: {
    authorized: number
    authorized_to_maintain_liabilities: number
    unauthorized: number
  }
  claimable_balances_amount: string
  liquidity_pools_amount: string
  contracts_amount: string
  balances: {
    authorized: string
    authorized_to_maintain_liabilities: string
    unauthorized: string
  }
  flags: {
    auth_required: boolean
    auth_revocable: boolean
    auth_immutable: boolean
    auth_clawback_enabled: boolean
  },
  metadata?:IAssetMetadata
}

export interface ILiquidityPool {
  _links: {
    self: { href: string };
    transactions: { href: string; templated: boolean };
    operations: { href: string; templated: boolean };
  };
  id: string;
  paging_token: string;
  fee_bp: number;
  type: string;
  total_trustlines: string;
  total_shares: string;
  reserves: Array<{
    asset: string;
    amount: string;
  }>;
  last_modified_ledger: number;
  last_modified_time: string;
}

export interface PaginatedResponse<T> {
  _embedded: {
    records: T[]
  }
  _links: {
    self: { href: string }
    next: { href: string }
    prev: { href: string }
  }
}

export interface MintTokenRequest {
  name: string
  symbol: string
  totalSupply: number
  initialAmount: number
  recipient: string
}
