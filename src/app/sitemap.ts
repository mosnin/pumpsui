import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://omniweave.xyz'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/swap`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/bridge`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/analytics`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/pools`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ]
}
