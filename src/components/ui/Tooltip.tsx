import { ReactNode, useState, useRef, useId, isValidElement, cloneElement } from 'react'

interface TooltipProps {
  content: string
  shortcut?: string
  children: ReactNode
  side?: 'right' | 'bottom' | 'top'
}

export function Tooltip({ content, shortcut, children, side = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const tooltipId = useId()

  function show() {
    timer.current = setTimeout(() => setVisible(true), 400)
  }
  function hide() {
    clearTimeout(timer.current)
    setVisible(false)
  }

  const posClass = side === 'right'
    ? 'left-full ml-2 top-1/2 -translate-y-1/2'
    : side === 'bottom'
      ? 'top-full mt-1 left-1/2 -translate-x-1/2'
      : 'bottom-full mb-1 left-1/2 -translate-x-1/2'

  // Inject aria-describedby on the trigger element so assistive tech
  // announces the tooltip content when it becomes visible.
  const trigger = isValidElement(children)
    ? cloneElement(children, {
        'aria-describedby': visible ? tooltipId : null,
      })
    : children

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      {trigger}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute ${posClass} z-50 pointer-events-none whitespace-nowrap
            bg-neutral-900 border border-neutral-700 text-neutral-200
            px-2 py-1 rounded text-xs flex items-center gap-2 shadow-lg
            animate-tooltip-fade`}
        >
          {content}
          {shortcut && (
            <kbd className="bg-neutral-700 text-neutral-300 px-1 py-0.5 rounded text-[10px] font-mono">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
