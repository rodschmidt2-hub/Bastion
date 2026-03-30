import { createClient } from '@/lib/supabase/server'

export async function Topbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const email = user?.email ?? ''
  const name = email.split('@')[0]
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-white px-6">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 cursor-text select-none">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Buscar...</span>
        <kbd className="ml-2 hidden rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-400 sm:block">⌘K</kbd>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-400">{email}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white ring-2 ring-blue-100">
          {initials}
        </div>
      </div>
    </header>
  )
}
