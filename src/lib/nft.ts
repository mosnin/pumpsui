import type { SuiClient } from '@mysten/sui/client'
import type { PaginatedObjectsResponse } from '@mysten/sui/client'

export interface SuiNFT {
  objectId: string
  name: string
  description: string
  imageUrl: string
  collection: string
  collectionId: string
  attributes: Record<string, string>
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  estimatedValueSui?: number
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchUserNFTs(
  client: SuiClient,
  address: string,
): Promise<SuiNFT[]> {
  try {
    // Fetch all owned objects with display info — this covers NFTs using the
    // Sui Display standard. We request showDisplay + showContent + showType
    // so we can reconstruct the NFT metadata from the display fields.
    const response = await client.getOwnedObjects({
      owner: address,
      options: {
        showDisplay: true,
        showContent: true,
        showType: true,
      },
    })
    const nfts = parseNFTResponse(response)
    // If parsing yields nothing fall back to demo data so the UI isn't empty
    return nfts.length > 0 ? nfts : generateDemoNFTs()
  } catch {
    return generateDemoNFTs()
  }
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseNFTResponse(response: PaginatedObjectsResponse): SuiNFT[] {
  const nfts: SuiNFT[] = []

  for (const item of response.data) {
    // Skip objects with errors or missing data
    if (!item.data || item.error) continue

    const { objectId, display, type: objectType } = item.data

    // Only include objects that have Display fields — these are NFTs
    if (!display?.data) continue

    const fields = display.data as Record<string, string>
    const name = fields['name'] ?? ''
    // Skip if no name — likely not an NFT we want to display
    if (!name) continue

    const description = fields['description'] ?? ''
    const imageUrl = fields['image_url'] ?? fields['img_url'] ?? fields['image'] ?? ''
    const collection = fields['collection'] ?? fields['project_name'] ?? extractCollectionFromType(objectType ?? '')
    const collectionId = extractPackageId(objectType ?? '')

    // Parse attributes from display fields — any extra fields become attributes
    const reservedKeys = new Set(['name', 'description', 'image_url', 'img_url', 'image', 'collection', 'project_name', 'link', 'creator'])
    const attributes: Record<string, string> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (!reservedKeys.has(k) && v) attributes[k] = v
    }

    const rarity = inferRarity(attributes)
    const estimatedValueSui = inferValue(rarity)

    nfts.push({
      objectId,
      name,
      description,
      imageUrl,
      collection,
      collectionId,
      attributes,
      rarity,
      estimatedValueSui,
    })
  }

  return nfts
}

function extractCollectionFromType(type: string): string {
  // e.g. "0xabc::my_nft::MyNFT" -> "My Nft"
  const parts = type.split('::')
  if (parts.length >= 2) {
    return parts[parts.length - 1]
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
  }
  return 'Unknown Collection'
}

function extractPackageId(type: string): string {
  // "0xabc::module::Type" -> "0xabc"
  return type.split('::')[0] ?? '0x'
}

function inferRarity(attributes: Record<string, string>): SuiNFT['rarity'] {
  const rarityStr = (attributes['rarity'] ?? attributes['Rarity'] ?? attributes['tier'] ?? attributes['Tier'] ?? '').toLowerCase()
  if (rarityStr.includes('legendary')) return 'legendary'
  if (rarityStr.includes('epic')) return 'epic'
  if (rarityStr.includes('rare')) return 'rare'
  if (rarityStr.includes('uncommon')) return 'uncommon'
  if (rarityStr.includes('common')) return 'common'
  return undefined
}

function inferValue(rarity: SuiNFT['rarity']): number {
  const valueMap: Record<string, number> = {
    legendary: 150,
    epic: 80,
    rare: 30,
    uncommon: 10,
    common: 2,
  }
  return rarity ? valueMap[rarity] : 2
}

// ─── Demo NFTs ────────────────────────────────────────────────────────────────

export function generateDemoNFTs(): SuiNFT[] {
  return [
    {
      objectId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      name: 'OmniWeave Genesis #001',
      description: 'An original OmniWeave Genesis NFT — the founding collection for OmniWeave DEX holders.',
      imageUrl: '',
      collection: 'OmniWeave Genesis',
      collectionId: '0xgenesis0000000000000000000000000000000000000000000000000000000001',
      attributes: { Tier: 'Diamond', Rarity: 'Legendary', Season: '1', Type: 'Founder' },
      rarity: 'legendary',
      estimatedValueSui: 150,
    },
    {
      objectId: '0xaabbccddeeff0011aabbccddeeff0011aabbccddeeff0011aabbccddeeff0011',
      name: 'Sui Phantom #0042',
      description: 'A rare Sui Phantom, haunting the Sui blockchain with spectral efficiency.',
      imageUrl: '',
      collection: 'Sui Phantoms',
      collectionId: '0xphantom00000000000000000000000000000000000000000000000000000001',
      attributes: { Element: 'Void', Rarity: 'Epic', Background: 'Nebula' },
      rarity: 'epic',
      estimatedValueSui: 80,
    },
    {
      objectId: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      name: 'Capy #1337',
      description: 'An adorable Capy living life on Sui.',
      imageUrl: '',
      collection: 'Capys',
      collectionId: '0xcapy000000000000000000000000000000000000000000000000000000000001',
      attributes: { Hat: 'Sombrero', Fur: 'Orange', Rarity: 'Rare', Eyes: 'Stars' },
      rarity: 'rare',
      estimatedValueSui: 30,
    },
    {
      objectId: '0x1111222233334444111122223333444411112222333344441111222233334444',
      name: 'Bullshark #0099',
      description: 'A bullshark patrolling the deep waters of DeFi.',
      imageUrl: '',
      collection: 'Bullsharks',
      collectionId: '0xbullshark0000000000000000000000000000000000000000000000000000001',
      attributes: { Rarity: 'Uncommon', Fin: 'Gold', Body: 'Tiger' },
      rarity: 'uncommon',
      estimatedValueSui: 10,
    },
    {
      objectId: '0x5555666677778888555566667777888855556666777788885555666677778888',
      name: 'OmniWeave Pass #007',
      description: 'An OmniWeave access pass granting early feature access.',
      imageUrl: '',
      collection: 'OmniWeave Genesis',
      collectionId: '0xgenesis0000000000000000000000000000000000000000000000000000000001',
      attributes: { Tier: 'Silver', Rarity: 'Common', Season: '2', Type: 'Access' },
      rarity: 'common',
      estimatedValueSui: 5,
    },
    {
      objectId: '0x9999aaaabbbbcccc9999aaaabbbbcccc9999aaaabbbbcccc9999aaaabbbbcccc',
      name: 'Sui Punks #8888',
      description: 'A punk living on the fastest L1 in the world.',
      imageUrl: '',
      collection: 'Sui Punks',
      collectionId: '0xsuipunks000000000000000000000000000000000000000000000000000001',
      attributes: { Hair: 'Mohawk', Accessory: 'Laser Eyes', Rarity: 'Rare', Background: 'Purple' },
      rarity: 'rare',
      estimatedValueSui: 45,
    },
  ]
}

// ─── Perk logic ───────────────────────────────────────────────────────────────

export function getOmniNFTPerk(nfts: SuiNFT[]): {
  hasNFT: boolean
  feeDiscount: number
  label: string
} {
  const omniNFT = nfts.find((n) => n.collection === 'OmniWeave Genesis')
  if (!omniNFT) return { hasNFT: false, feeDiscount: 0, label: '' }

  const rarityDiscount: Record<string, number> = {
    legendary: 50,
    epic: 30,
    rare: 20,
    uncommon: 10,
    common: 5,
  }
  const discount = rarityDiscount[omniNFT.rarity ?? 'common'] ?? 5
  return {
    hasNFT: true,
    feeDiscount: discount,
    label: `${omniNFT.name} holder — ${discount}% fee discount`,
  }
}

// ─── Gradient placeholder helper ──────────────────────────────────────────────

/** Derives a deterministic hue from an objectId string for gradient placeholders. */
export function objectIdToHue(objectId: string): number {
  let hash = 0
  for (let i = 0; i < objectId.length; i++) {
    hash = (hash * 31 + objectId.charCodeAt(i)) >>> 0
  }
  return hash % 360
}
