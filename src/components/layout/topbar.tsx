import { Suspense } from 'react'
import { PageTitle } from './page-title'

interface TopbarProps {
  nome?: string
  email?: string
}

export function Topbar({ nome, email }: TopbarProps) {
  const displayName = nome ?? email?.split('@')[0] ?? 'Usuário'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-6">
      {/* Título da página atual (client component) */}
      <div className="flex-1">
        <Suspense fallback={null}>
          <PageTitle />
        </Suspense>
      </div>

      {/* Busca + Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 cursor-text select-none">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Buscar...</span>
          <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-400 sm:block">⌘K</kbd>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white ring-2 ring-blue-100">
          {initials}
        </div>
      </div>
    </header>
  )
}
