/** Formats a deck can be built for. Their cards and limits are in `data/formats.json`. */
export const FORMAT_IDS = ['goat', 'edison'] as const
export type FormatId = (typeof FORMAT_IDS)[number]

/** Copies of a card allowed when nothing restricts it. */
export const UNRESTRICTED_COPIES = 3

/** Link arrows, in the order they are shown (top row, middle row, bottom row). */
export const LINK_MARKERS = [
  'Top-Left',
  'Top',
  'Top-Right',
  'Left',
  'Right',
  'Bottom-Left',
  'Bottom',
  'Bottom-Right',
] as const
