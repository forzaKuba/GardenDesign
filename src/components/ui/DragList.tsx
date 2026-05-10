import { ReactNode, useState } from 'react'

interface DragListProps<T> {
  items: T[]
  keyFn: (item: T) => string
  onReorder: (fromIdx: number, toIdx: number) => void
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLElement>) => ReactNode
}

export function DragList<T>({ items, keyFn, onReorder, renderItem }: DragListProps<T>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, idx) => (
        <div
          key={keyFn(item)}
          className={`transition-transform ${overIdx === idx && dragIdx !== null && dragIdx !== idx ? 'scale-[1.01] opacity-80' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(idx) }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx)
            setDragIdx(null)
            setOverIdx(null)
          }}
        >
          {renderItem(item, {
            draggable: true,
            onDragStart: () => setDragIdx(idx),
            onDragEnd: () => { setDragIdx(null); setOverIdx(null) },
          })}
        </div>
      ))}
    </div>
  )
}
