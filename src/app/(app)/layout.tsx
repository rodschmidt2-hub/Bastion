import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { getProfile } from '@/lib/auth/get-profile'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar role={profile?.role as any} nome={profile?.nome} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar nome={profile?.nome} email={profile?.email} />

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
