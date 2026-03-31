'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

interface TooltipInfoProps {
  text: string
  size?: 'xs' | 'sm'
  className?: string
}

export function TooltipInfo({ text, size = 'xs', className = '' }: TooltipInfoProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!visible || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPosition(rect.top < 120 ? 'bottom' : 'top')
  }, [visible])

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-3 w-3'

  return (
    <span
      ref={ref}
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="Mais informações"
    >
      <HelpCircle
        className={`${iconSize} cursor-help text-slate-300 hover:text-slate-500 transition-colors`}
      />
      {visible && (
        <span
          className={`
            pointer-events-none absolute z-50 w-56 rounded-lg border border-slate-100
            bg-white px-3 py-2 text-xs leading-[1.5] text-slate-600 shadow-lg
            ${position === 'top'
              ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
              : 'top-full mt-1.5 left-1/2 -translate-x-1/2'}
          `}
        >
          {text}
          <span
            className={`
              absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${position === 'top'
                ? 'top-full border-t-white -mt-px'
                : 'bottom-full border-b-white mb-[-1px]'}
            `}
          />
        </span>
      )}
    </span>
  )
}
