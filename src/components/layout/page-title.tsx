'use client'

import { usePathname } from 'next/navigation'

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/analitico': 'Análise de Receita',
  '/clientes': 'Clientes',
  '/contratos': 'Contratos',
  '/financeiro': 'Financeiro',
  '/documentos': 'Documentos',
  '/produtos': 'Catálogo de Produtos',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
}

export function PageTitle() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const base = '/' + (segments[0] ?? '')

  if (base === '/clientes' && segments.length > 1) {
    return <span className="text-sm font-semibold text-slate-900">Perfil do Cliente</span>
  }

  const title = titleMap[pathname] ?? titleMap[base]
  if (!title) return null

  return <span className="text-sm font-semibold text-slate-900">{title}</span>
}
