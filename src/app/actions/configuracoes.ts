'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export interface SistemaConfigMap {
  dias_geracao_fatura: number
  dias_suspensao_inadimplencia: number
  alerta_renovacao_dias: number[]
  multa_atraso_default: number
  juros_atraso_diario_default: number
}

const DEFAULTS: SistemaConfigMap = {
  dias_geracao_fatura:           7,
  dias_suspensao_inadimplencia:  30,
  alerta_renovacao_dias:         [30, 10],
  multa_atraso_default:          2.0,
  juros_atraso_diario_default:   0.033,
}

export async function getConfiguracoes(): Promise<SistemaConfigMap> {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return DEFAULTS

  const { data } = await supabase
    .from('sistema_config')
    .select('chave, valor')
    .eq('agencia_id', profile.agencia_id)

  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.chave] = row.valor

  return {
    dias_geracao_fatura:           map.dias_geracao_fatura           ? parseInt(map.dias_geracao_fatura) : DEFAULTS.dias_geracao_fatura,
    dias_suspensao_inadimplencia:  map.dias_suspensao_inadimplencia  ? parseInt(map.dias_suspensao_inadimplencia) : DEFAULTS.dias_suspensao_inadimplencia,
    alerta_renovacao_dias:         map.alerta_renovacao_dias         ? JSON.parse(map.alerta_renovacao_dias) : DEFAULTS.alerta_renovacao_dias,
    multa_atraso_default:          map.multa_atraso_default          ? parseFloat(map.multa_atraso_default) : DEFAULTS.multa_atraso_default,
    juros_atraso_diario_default:   map.juros_atraso_diario_default   ? parseFloat(map.juros_atraso_diario_default) : DEFAULTS.juros_atraso_diario_default,
  }
}

export async function saveConfiguracoes(formData: FormData) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Apenas admin pode alterar configurações' }
  if (!profile.agencia_id) return { error: 'Perfil incompleto' }

  const supabase = await createClient()

  const diasGeracao = parseInt(formData.get('dias_geracao_fatura') as string)
  const diasSuspensao = parseInt(formData.get('dias_suspensao_inadimplencia') as string)
  const alertaDias1 = parseInt(formData.get('alerta_renovacao_1') as string)
  const alertaDias2 = parseInt(formData.get('alerta_renovacao_2') as string)
  const multa = parseFloat(formData.get('multa_atraso_default') as string)
  const juros = parseFloat(formData.get('juros_atraso_diario_default') as string)

  if (isNaN(diasGeracao) || diasGeracao < 1 || diasGeracao > 30) return { error: 'Dias de geração deve ser entre 1 e 30' }
  if (isNaN(diasSuspensao) || diasSuspensao < 1) return { error: 'Dias de suspensão inválido' }
  if (isNaN(alertaDias1) || isNaN(alertaDias2)) return { error: 'Alertas de renovação inválidos' }
  if (isNaN(multa) || multa < 0) return { error: 'Multa inválida' }
  if (isNaN(juros) || juros < 0) return { error: 'Juros inválido' }

  const configs = [
    { chave: 'dias_geracao_fatura',          valor: String(diasGeracao) },
    { chave: 'dias_suspensao_inadimplencia', valor: String(diasSuspensao) },
    { chave: 'alerta_renovacao_dias',        valor: JSON.stringify([alertaDias1, alertaDias2].sort((a, b) => b - a)) },
    { chave: 'multa_atraso_default',         valor: String(multa) },
    { chave: 'juros_atraso_diario_default',  valor: String(juros) },
  ]

  for (const cfg of configs) {
    const { error } = await supabase
      .from('sistema_config')
      .upsert(
        { agencia_id: profile.agencia_id, chave: cfg.chave, valor: cfg.valor },
        { onConflict: 'agencia_id,chave' }
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/configuracoes')
  return {}
}
