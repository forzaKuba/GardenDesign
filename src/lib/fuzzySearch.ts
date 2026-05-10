export interface SearchItem {
  label: string
  sublabel?: string
  action: () => void
  shortcut?: string
}

/** Simple character-subsequence fuzzy match. Returns a score ≥ 0 or -1 if no match. */
function score(query: string, target: string): number {
  if (!query) return 0
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  let consecutive = 0
  let s = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++
      consecutive++
      s += consecutive
    } else {
      consecutive = 0
    }
  }
  return qi === q.length ? s : -1
}

export function fuzzySearch(query: string, items: SearchItem[]): SearchItem[] {
  if (!query.trim()) return items.slice(0, 10)
  return items
    .map((item) => ({ item, score: score(query, item.label) }))
    .filter(({ score: s }) => s >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item)
}
