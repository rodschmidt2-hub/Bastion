import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <span className="text-sm font-bold text-white">Bastion</span>
        </div>

        <nav className="flex-1 px-2 py-4">
          {/* Itens de navegação serão adicionados nas próximas stories */}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
