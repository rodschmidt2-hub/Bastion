import { createClient } from '@/lib/supabase/server'

export async function Topbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const email = user?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div /> {/* espaço esquerdo */}

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">{email}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  )
}
