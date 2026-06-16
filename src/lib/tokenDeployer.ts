export interface TokenConfig {
  name: string           // e.g. "My Token"
  symbol: string         // e.g. "MTK" (uppercase, 2-6 chars)
  description: string    // max 200 chars
  iconUrl: string        // optional IPFS/URL to logo
  decimals: number       // 0-9, default 9
  initialSupply: number  // tokens to mint to deployer (0 = no mint)
}

export interface DeploymentResult {
  packageId: string
  coinType: string       // e.g. "0xabc::my_token::MY_TOKEN"
  treasuryCapId: string
  metadataId: string
  txHash: string
}

// Generate the Move module source code from template
export function generateMoveSource(config: TokenConfig): string {
  const moduleName = config.symbol.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const witness = config.symbol.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const iconLine = config.iconUrl
    ? `option::some(sui::url::new_unsafe_from_bytes(b"${config.iconUrl}"))`
    : 'option::none()'

  return `module deployer::${moduleName} {
    use sui::coin::{Self, TreasuryCap};
    use sui::url;

    public struct ${witness} has drop {}

    fun init(witness: ${witness}, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            ${config.decimals},
            b"${config.symbol}",
            b"${config.name}",
            b"${config.description}",
            ${iconLine},
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, ctx.sender());
    }

    public fun mint(
        treasury_cap: &mut TreasuryCap<${witness}>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    public fun burn(treasury_cap: &mut TreasuryCap<${witness}>, coin: coin::Coin<${witness}>) {
        coin::burn(treasury_cap, coin);
    }
}`.trim()
}

// Validate token config — return array of error strings (empty = valid)
export function validateTokenConfig(config: Partial<TokenConfig>): string[] {
  const errors: string[] = []
  if (!config.name?.trim()) errors.push('Token name is required')
  if (!config.symbol?.trim()) errors.push('Token symbol is required')
  else if (!/^[A-Z0-9]{2,10}$/.test(config.symbol.toUpperCase())) {
    errors.push('Symbol must be 2-10 uppercase letters/numbers')
  }
  if (config.description && config.description.length > 200) {
    errors.push('Description must be 200 characters or less')
  }
  if (config.decimals !== undefined && (config.decimals < 0 || config.decimals > 9)) {
    errors.push('Decimals must be 0-9')
  }
  return errors
}

export const DECIMAL_PRESETS = [
  { value: 9, label: '9 (like SUI)', description: 'Standard for most tokens' },
  { value: 6, label: '6 (like USDC)', description: 'Standard for stablecoins' },
  { value: 0, label: '0 (NFT-like)', description: 'Whole numbers only' },
] as const
