'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const tabs = [
  { id: 'catalogo',    label: 'Catálogo' },
  { id: 'categorias',  label: 'Categorias' },
]

export function ProdutosTabsNav() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'catalogo'

  return (
    <div className="flex gap-1 border-b border-slate-100 px-5">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/produtos?tab=${tab.id}`}
          className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
