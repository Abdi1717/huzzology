/**
 * Mock Data for Graph Visualization
 * 
 * Sample archetype data for testing and development
 */

import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode } from '@/types/archetype';

// Sample archetype data
export const mockArchetypes: ArchetypeNode[] = [
  {
    id: 'clean-girl',
    label: 'Clean Girl',
    description: 'Minimalist beauty aesthetic emphasizing natural, dewy skin and effortless styling',
    keywords: ['minimal', 'natural', 'dewy', 'effortless', 'skincare'],
    influences: ['wellness', 'sustainability', 'self-care'],
    color: '#8B5CF6',
    examples: [
      {
        id: 'clean-girl-example-1',
        platform: 'tiktok',
        url: 'https://tiktok.com/example1',
        caption: 'Clean girl morning routine',
        timestamp: '2024-01-15T10:00:00Z',
        engagement_metrics: { likes: 125000, shares: 8500, comments: 3200 },
        creator: { username: '@cleanbeauty', follower_count: 450000 }
      },
      {
        id: 'clean-girl-example-2',
        platform: 'instagram',
        url: 'https://instagram.com/example1',
        caption: 'No makeup makeup look',
        timestamp: '2024-01-10T14:30:00Z',
        engagement_metrics: { likes: 89000, shares: 2100, comments: 1800 }
      }
    ],
    metadata: {
      origin_date: '2022-03-01',
      peak_popularity: '2023-06-01',
      influence_score: 0.85,
      platforms: ['tiktok', 'instagram', 'pinterest'],
      trending: true,
      category: 'Beauty'
    }
  },
  {
    id: 'dark-academia',
    label: 'Dark Academia',
    description: 'Aesthetic inspired by classic literature, gothic architecture, and scholarly pursuits',
    keywords: ['gothic', 'scholarly', 'vintage', 'literature', 'academic'],
    influences: ['classical education', 'gothic literature', 'ivy league'],
    color: '#7C2D12',
    examples: [
      {
        id: 'dark-academia-example-1',
        platform: 'instagram',
        url: 'https://instagram.com/example2',
        caption: 'Dark academia outfit inspiration',
        timestamp: '2024-01-12T16:45:00Z',
        engagement_metrics: { likes: 45000, shares: 12000, comments: 890 }
      }
    ],
    metadata: {
      origin_date: '2019-09-01',
      peak_popularity: '2020-11-01',
      influence_score: 0.72,
      platforms: ['pinterest', 'tumblr', 'tiktok'],
      trending: false,
      category: 'Aesthetic'
    }
  },
  {
    id: 'cottagecore',
    label: 'Cottagecore',
    description: 'Romanticized rural life aesthetic emphasizing simplicity, nature, and traditional crafts',
    keywords: ['rural', 'nature', 'crafts', 'simple', 'pastoral'],
    influences: ['sustainability', 'slow living', 'traditional skills'],
    color: '#16A34A',
    examples: [
      {
        id: 'cottagecore-example-1',
        platform: 'instagram',
        url: 'https://instagram.com/example3',
        caption: 'Baking bread in my cottage kitchen',
        timestamp: '2024-01-08T09:15:00Z',
        engagement_metrics: { likes: 67000, shares: 3400, comments: 2100 }
      }
    ],
    metadata: {
      origin_date: '2018-05-01',
      peak_popularity: '2020-08-01',
      influence_score: 0.68,
      platforms: ['instagram', 'pinterest', 'youtube'],
      trending: false,
      category: 'Lifestyle'
    }
  },
  {
    id: 'y2k-revival',
    label: 'Y2K Revival',
    description: 'Nostalgic return to early 2000s fashion, technology, and pop culture aesthetics',
    keywords: ['nostalgic', '2000s', 'metallic', 'futuristic', 'pop'],
    influences: ['millennium bug', 'early internet', 'pop music'],
    color: '#EC4899',
    examples: [
      {
        id: 'y2k-revival-example-1',
        platform: 'tiktok',
        url: 'https://tiktok.com/example4',
        caption: 'Y2K makeup transformation',
        timestamp: '2024-01-14T20:30:00Z',
        engagement_metrics: { likes: 234000, shares: 15600, comments: 5800 }
      }
    ],
    metadata: {
      origin_date: '2021-01-01',
      peak_popularity: '2023-03-01',
      influence_score: 0.79,
      platforms: ['tiktok', 'instagram', 'twitter'],
      trending: true,
      category: 'Fashion'
    }
  },
  {
    id: 'soft-girl',
    label: 'Soft Girl',
    description: 'Gentle, feminine aesthetic with pastel colors, cute accessories, and youthful styling',
    keywords: ['pastel', 'cute', 'feminine', 'gentle', 'youthful'],
    influences: ['kawaii culture', 'e-girl', 'korean beauty'],
    color: '#F472B6',
    examples: [
      {
        id: 'soft-girl-example-1',
        platform: 'tiktok',
        url: 'https://tiktok.com/example5',
        caption: 'Soft girl makeup tutorial',
        timestamp: '2024-01-11T13:20:00Z',
        engagement_metrics: { likes: 156000, shares: 9200, comments: 4100 }
      }
    ],
    metadata: {
      origin_date: '2019-07-01',
      peak_popularity: '2020-04-01',
      influence_score: 0.65,
      platforms: ['tiktok', 'instagram'],
      trending: false,
      category: 'Beauty'
    }
  },
  {
    id: 'that-girl',
    label: 'That Girl',
    description: 'Aspirational lifestyle aesthetic focused on wellness, productivity, and self-improvement',
    keywords: ['wellness', 'productive', 'aspirational', 'morning routine', 'self-care'],
    influences: ['wellness culture', 'productivity', 'self-improvement'],
    color: '#F59E0B',
    examples: [
      {
        id: 'that-girl-example-1',
        platform: 'instagram',
        url: 'https://instagram.com/example6',
        caption: '5AM morning routine for that girl energy',
        timestamp: '2024-01-13T05:00:00Z',
        engagement_metrics: { likes: 98000, shares: 5600, comments: 2800 }
      }
    ],
    metadata: {
      origin_date: '2021-06-01',
      peak_popularity: '2022-09-01',
      influence_score: 0.73,
      platforms: ['instagram', 'tiktok', 'youtube'],
      trending: true,
      category: 'Lifestyle'
    }
  }
];

// mockArchetypes already contains the correct ArchetypeNode structure

// Sample edges showing relationships between archetypes
export const mockEdges: ArchetypeEdge[] = [
  {
    id: 'clean-girl-soft-girl',
    source: 'clean-girl',
    target: 'soft-girl',
    type: 'similarity',
    data: { 
      strength: 0.7, 
      label: 'Similar aesthetic values'
    }
  },
  {
    id: 'clean-girl-that-girl',
    source: 'clean-girl',
    target: 'that-girl',
    type: 'influence',
    data: { 
      strength: 0.8, 
      label: 'Wellness influence'
    }
  },
  {
    id: 'cottagecore-dark-academia',
    source: 'cottagecore',
    target: 'dark-academia',
    type: 'similarity',
    data: { 
      strength: 0.6, 
      label: 'Romanticized aesthetics'
    }
  },
  {
    id: 'y2k-revival-soft-girl',
    source: 'y2k-revival',
    target: 'soft-girl',
    type: 'evolution',
    data: { 
      strength: 0.5, 
      label: 'Fashion evolution'
    }
  },
  {
    id: 'that-girl-clean-girl',
    source: 'that-girl',
    target: 'clean-girl',
    type: 'influence',
    data: { 
      strength: 0.9, 
      label: 'Wellness to beauty'
    }
  }
];

// mockArchetypes is already exported above

// Sample filters for testing
export const mockFilters = {
  categories: ['Beauty', 'Lifestyle', 'Fashion', 'Aesthetic'],
  platforms: ['tiktok', 'instagram', 'pinterest', 'youtube'],
  influenceRange: [0.5, 1.0] as [number, number],
  timeRange: ['2018-01-01', '2024-12-31'] as [string, string],
  searchQuery: '',
  showTrendingOnly: false
}; 