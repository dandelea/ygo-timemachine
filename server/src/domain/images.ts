const IMAGE_HOST = 'https://images.ygoprodeck.com/images'

/**
 * The seed data references the retired `storage.googleapis.com/ygoprodeck.com`
 * host, which now answers 403. Rewrite those URLs to the current YGOPRODeck
 * image host, keeping the image id from the original file name.
 */
export function currentImageUrl(url: string | null, size: 'large' | 'small'): string | null {
  if (url === null) return null
  const match = /\/(\d+)\.jpg$/.exec(url)
  if (!match) return url
  const folder = size === 'large' ? 'cards' : 'cards_small'
  return `${IMAGE_HOST}/${folder}/${match[1] ?? ''}.jpg`
}
