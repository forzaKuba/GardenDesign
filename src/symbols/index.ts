import type { SymbolDef } from '@/types/symbols'
import { treesSymbols } from './trees'
import { structuresSymbols } from './structures'
import { gardenSymbols } from './garden'
import { hardscapeSymbols } from './hardscape'

export const SYMBOL_LIBRARY: SymbolDef[] = [
  ...treesSymbols,
  ...structuresSymbols,
  ...gardenSymbols,
  ...hardscapeSymbols,
]

export const SYMBOL_MAP: Record<string, SymbolDef> = Object.fromEntries(
  SYMBOL_LIBRARY.map((s) => [s.id, s])
)

export { treesSymbols, structuresSymbols, gardenSymbols, hardscapeSymbols }
