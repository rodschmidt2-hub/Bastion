'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <span className="text-lg font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Bastion</h1>
          <p className="mt-1 text-sm text-slate-500">Sistema interno de gestão</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-blue-500"
              />
            </div>

            {state?.error && (
              <div className="rounded-lg bg-red-50 px-3 py-2">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-700"
            >
              {pending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
