import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HabitFlow — Modern Habit Tracker & Behavioral OS',
    short_name: 'HabitFlow',
    description: 'Track habits, sleep, and screentime with an interaction-first behavioral operating system based on Atomic Habits.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
    orientation: 'portrait-primary',
    background_color: '#09090b',
    theme_color: '#09090b',
    categories: ['productivity', 'lifestyle', 'health'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
