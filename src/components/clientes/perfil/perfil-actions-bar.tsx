'use client'

import { useState, useTransition } from 'react'
import { Pencil, Ban, RotateCcw, PlayCircle } from 'lucide-react'
import { ClienteDrawer } from '../cliente-drawer'
import { DesativarModal } from './desativar-modal'
import { ativarCliente } from '@/app/actions/clientes'
import type { Cliente, Profile, Contrato } from '@/types/database'

interface PerfilActionsBarProps {
  cliente: Cliente
  responsaveis: Pick<Profile, 'id' | 'nome' | 'email'>[]
  contratos?: Contrato[]
}

export function PerfilActionsBar({ cliente, responsaveis, contratos = [] }: PerfilActionsBarProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [desativarOpen, setDesativarOpen] = useState(false)
  const [ativarPending, startAtivarTransition] = useTransition()

  const isPendente = (cliente.status as string) === 'contrato_pendente'
  const isInativo = cliente.status === 'inativo' || cliente.status === 'cancelado'
  const temContratoAssinado = contratos.some(c => (c as any).is_assinado === true)

  function handleAtivar() {
    startAtivarTransition(async () => {
      await ativarCliente(cliente.id)
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>

        {isPendente ? (
          <button
            onClick={handleAtivar}
            disabled={!temContratoAssinado || ativarPending}
            title={!temContratoAssinado ? 'Aguardando contrato assinado' : 'Ativar cliente'}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {ativarPending ? 'Ativando...' : 'Ativar cliente'}
          </button>
        ) : (
          <button
            onClick={() => setDesativarOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              isInativo
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            {isInativo ? (
              <><RotateCcw className="h-3.5 w-3.5" /> Reativar</>
            ) : (
              <><Ban className="h-3.5 w-3.5" /> Desativar</>
            )}
          </button>
        )}

        <button className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition">
          ⋯
        </button>
      </div>

      <ClienteDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cliente={cliente}
        responsaveis={responsaveis}
      />
      {desativarOpen && (
        <DesativarModal
          clienteId={cliente.id}
          modo={isInativo ? 'reativar' : 'desativar'}
          onClose={() => setDesativarOpen(false)}
        />
      )}
    </>
  )
}
