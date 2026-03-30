'use client'

import { useState } from 'react'

type HealthScoreData = {
  score: number
  pontualidade: number
  nps: number
  longevidade: number
  suspenso: boolean
}

function getColor(score: number) {
  if (score >= 70) return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  if (score >= 40) return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' }
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' }
}

export function HealthScoreBadge({ data }: { data: HealthScoreData }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const { score, pontualidade, nps, longevidade, suspenso } = data
  const { bg, text, ring } = getColor(score)

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${bg} ${text} ${ring}`}
      >
        {suspenso ? 0 : score}
        <span className="font-normal opacity-60">/ 100</span>
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-52 rounded-lg border border-slate-200 bg-white shadow-lg p-3 text-xs">
          <p className="font-semibold text-slate-700 mb-2">Health Score</p>
          {suspenso ? (
            <p className="text-red-600">Cliente suspenso — score zerado</p>
          ) : (
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-slate-500">Pontualidade (50%)</dt>
                <dd className="font-medium text-slate-700">{pontualidade.toFixed(0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">NPS (30%)</dt>
                <dd className="font-medium text-slate-700">{nps.toFixed(0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Longevidade (20%)</dt>
                <dd className="font-medium text-slate-700">{longevidade.toFixed(0)}</dd>
              </div>
              <div className="border-t border-slate-100 pt-1.5 flex justify-between font-semibold">
                <dt className="text-slate-700">Total</dt>
                <dd className={text}>{score}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
