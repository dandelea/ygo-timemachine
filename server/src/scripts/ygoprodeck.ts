/**
 * Minimal YGOPRODeck client for the data scripts. The API allows 20 requests
 * per second and blocks the IP for an hour above that, and asks clients to
 * store the data instead of calling it repeatedly. So requests go one at a
 * time with a pause between them, and any error stops the script instead of
 * retrying. The app itself never calls the API.
 */

export const CARD_API = 'https://db.ygoprodeck.com/api/v7'
export const BANLIST_API = 'https://ygoprodeck.com/api/banlist'
const PAUSE_MS = 2000
const USER_AGENT = 'ygo-timemachine (manual data refresh)'

export type GetJson = <T>(url: string) => Promise<T>

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Returns a `getJson` that waits `pauseMs` after every request. */
export function pacedClient(pauseMs = PAUSE_MS): GetJson & { requests: () => number } {
  let requests = 0
  const getJson = async <T>(url: string): Promise<T> => {
    requests += 1
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)
    const body = (await response.json()) as T
    await pause(pauseMs)
    return body
  }
  return Object.assign(getJson, { requests: () => requests })
}
