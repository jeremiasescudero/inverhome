/**
 * Chart palette and chrome.
 *
 * Values come from the validated default data-viz palette, checked with the
 * palette validator against this app's chart surface (white cards):
 * lightness band, chroma floor, CVD separation and normal-vision floor all
 * pass for the three categorical slots in use. `AQUA` sits below 3:1 contrast
 * on white, so every chart that uses it also renders the numbers (relief
 * rule) — never color alone.
 */
export const SERIES = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
} as const

/** Reserved status colours; always paired with a written label. */
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

export const CHART_INK = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  secondary: '#52514e',
} as const

export const AXIS_TICK = { fill: CHART_INK.muted, fontSize: 11 } as const
