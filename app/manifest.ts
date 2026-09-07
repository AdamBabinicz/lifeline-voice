import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'First Aid Command Center',
    short_name: 'First Aid',
    description: 'High-contrast emergency first aid guidance dashboard.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#ff0000',
    lang: 'en',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  }
}
