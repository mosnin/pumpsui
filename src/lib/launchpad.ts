export interface LaunchProject {
  id: string
  name: string
  symbol: string
  description: string
  website: string
  twitter: string
  logoGradient: string[]    // two colors for gradient placeholder
  category: 'DeFi' | 'Gaming' | 'Infrastructure' | 'Social' | 'Meme'

  // Sale params
  totalForSale: number      // tokens
  pricePerTokenSui: number
  softCapSui: number
  hardCapSui: number
  minContributionSui: number
  maxContributionSui: number

  // State
  raisedSui: number
  contributors: number
  startDate: string         // ISO
  endDate: string           // ISO
  status: 'upcoming' | 'live' | 'ended_success' | 'ended_failed'

  // Access
  whitelistRequired: boolean  // requires OMNI stake
  minOmniStake: number        // minimum OMNI staked for whitelist

  // Vesting
  vestingMonths: number
  cliffMonths: number
  tgePercent: number          // % unlocked at TGE
}

export function generateDemoProjects(): LaunchProject[] {
  return [
    {
      id: '1',
      name: 'SuiZen',
      symbol: 'ZEN',
      description: 'Liquid staking protocol for Sui. Stake SUI, receive ZEN, earn yield.',
      website: 'https://suizen.fi',
      twitter: '@SuiZen_Fi',
      logoGradient: ['#6366F1', '#8B5CF6'],
      category: 'DeFi',
      totalForSale: 10_000_000,
      pricePerTokenSui: 0.05,
      softCapSui: 100_000,
      hardCapSui: 500_000,
      minContributionSui: 10,
      maxContributionSui: 5_000,
      raisedSui: 347_820,
      contributors: 1_247,
      startDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
      status: 'live',
      whitelistRequired: true,
      minOmniStake: 1000,
      vestingMonths: 12,
      cliffMonths: 3,
      tgePercent: 10,
    },
    {
      id: '2',
      name: 'FlowDAO',
      symbol: 'FLOW',
      description: 'Decentralized autonomous organization tooling for Sui builders.',
      website: 'https://flowdao.xyz',
      twitter: '@FlowDAO',
      logoGradient: ['#06B6D4', '#0EA5E9'],
      category: 'Infrastructure',
      totalForSale: 50_000_000,
      pricePerTokenSui: 0.01,
      softCapSui: 50_000,
      hardCapSui: 200_000,
      minContributionSui: 5,
      maxContributionSui: 2_000,
      raisedSui: 0,
      contributors: 0,
      startDate: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 3600000).toISOString(),
      status: 'upcoming',
      whitelistRequired: true,
      minOmniStake: 500,
      vestingMonths: 18,
      cliffMonths: 6,
      tgePercent: 5,
    },
    {
      id: '3',
      name: 'MoonDoge',
      symbol: 'MDOGE',
      description: 'The first community meme token on Sui with actual utility.',
      website: 'https://moondoge.xyz',
      twitter: '@MoonDogeSui',
      logoGradient: ['#F59E0B', '#EF4444'],
      category: 'Meme',
      totalForSale: 1_000_000_000,
      pricePerTokenSui: 0.0001,
      softCapSui: 10_000,
      hardCapSui: 100_000,
      minContributionSui: 1,
      maxContributionSui: 500,
      raisedSui: 100_000,
      contributors: 3_891,
      startDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      endDate: new Date(Date.now() - 24 * 3600000).toISOString(),
      status: 'ended_success',
      whitelistRequired: false,
      minOmniStake: 0,
      vestingMonths: 3,
      cliffMonths: 0,
      tgePercent: 25,
    },
    {
      id: '4',
      name: 'SuiGuild',
      symbol: 'SGLD',
      description: 'On-chain gaming guild infrastructure — shared inventories, tournaments, and reward splits.',
      website: 'https://suiguild.gg',
      twitter: '@SuiGuild',
      logoGradient: ['#10B981', '#06B6D4'],
      category: 'Gaming',
      totalForSale: 25_000_000,
      pricePerTokenSui: 0.02,
      softCapSui: 40_000,
      hardCapSui: 150_000,
      minContributionSui: 5,
      maxContributionSui: 3_000,
      raisedSui: 112_400,
      contributors: 874,
      startDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
      endDate: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
      status: 'live',
      whitelistRequired: true,
      minOmniStake: 750,
      vestingMonths: 9,
      cliffMonths: 2,
      tgePercent: 15,
    },
    {
      id: '5',
      name: 'NexusLink',
      symbol: 'NXL',
      description: 'Cross-chain identity and reputation protocol for Web3 social graphs.',
      website: 'https://nexuslink.xyz',
      twitter: '@NexusLinkXYZ',
      logoGradient: ['#8B5CF6', '#EC4899'],
      category: 'Social',
      totalForSale: 30_000_000,
      pricePerTokenSui: 0.008,
      softCapSui: 20_000,
      hardCapSui: 80_000,
      minContributionSui: 2,
      maxContributionSui: 1_000,
      raisedSui: 12_300,
      contributors: 289,
      startDate: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
      endDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      status: 'ended_failed',
      whitelistRequired: false,
      minOmniStake: 0,
      vestingMonths: 6,
      cliffMonths: 1,
      tgePercent: 20,
    },
  ]
}

export function formatTimeRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (d > 0) return `${d}d ${h}h remaining`
  if (h > 0) return `${h}h ${m}m remaining`
  return `${m}m remaining`
}

export function formatTimeUntil(startDate: string): string {
  const diff = new Date(startDate).getTime() - Date.now()
  if (diff <= 0) return 'Started'
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (d > 0) return `Starts in ${d}d ${h}h`
  if (h > 0) return `Starts in ${h}h ${m}m`
  return `Starts in ${m}m`
}

export function fillPercent(project: LaunchProject): number {
  return Math.min(100, Math.round((project.raisedSui / project.hardCapSui) * 100))
}

export function formatSui(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
  return amount.toLocaleString()
}
