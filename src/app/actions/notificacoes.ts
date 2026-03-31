'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;')
}

export type NotificacaoEvento = 'fatura_vencendo' | 'fatura_vencida' | 'renovacao_proxima' | 'acordo_criado'

export interface NotificacaoConfigItem {
  evento: NotificacaoEvento
  ativo: boolean
  dias_antecedencia: number[] | null
}

const EVENTOS_PADRAO: NotificacaoConfigItem[] = [
  { evento: 'fatura_vencendo',   ativo: false, dias_antecedencia: [3, 7] },
  { evento: 'fatura_vencida',    ativo: false, dias_antecedencia: null },
  { evento: 'renovacao_proxima', ativo: false, dias_antecedencia: [30] },
  { evento: 'acordo_criado',     ativo: false, dias_antecedencia: null },
]

export async function getNotificacoesConfig(): Promise<NotificacaoConfigItem[]> {
  const profile = await getProfile()
  if (!profile?.agencia_id) return EVENTOS_PADRAO

  const admin = await createAdminClient()
  const { data } = await admin
    .from('notificacoes_config')
    .select('*')
    .eq('agencia_id', profile.agencia_id)
    .eq('canal', 'email')
    .is('cliente_id', null)

  if (!data || data.length === 0) return EVENTOS_PADRAO

  return EVENTOS_PADRAO.map((padrao) => {
    const found = data.find(d => d.evento === padrao.evento)
    if (!found) return padrao
    return {
      evento: found.evento as NotificacaoEvento,
      ativo: found.ativo,
      dias_antecedencia: found.dias_antecedencia,
    }
  })
}

export async function saveNotificacoesConfig(items: NotificacaoConfigItem[]) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }
  if (!profile.agencia_id) return { error: 'Perfil incompleto' }

  const admin = await createAdminClient()

  // Insert first — se falhar, config antiga permanece intacta
  const { data: inserted, error: insertErr } = await admin
    .from('notificacoes_config')
    .insert(
      items.map(item => ({
        agencia_id:        profile.agencia_id!,
        evento:            item.evento,
        canal:             'email',
        ativo:             item.ativo,
        dias_antecedencia: item.dias_antecedencia,
        cliente_id:        null,
      }))
    )
    .select('id')

  if (insertErr) return { error: insertErr.message }

  // Só deleta as antigas depois que o insert teve sucesso
  const newIds = (inserted ?? []).map(r => r.id)
  await admin
    .from('notificacoes_config')
    .delete()
    .eq('agencia_id', profile.agencia_id)
    .eq('canal', 'email')
    .is('cliente_id', null)
    .not('id', 'in', `(${newIds.join(',')})`)

  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── Envio de e-mails (chamado pelos crons) ────────────────────────────────────

async function _sendEmail(opts: {
  agenciaId:  string
  clienteId:  string
  faturaId:   string | null
  evento:     string
  toEmail:    string
  subject:    string
  bodyHtml:   string
}) {
  const admin = await createAdminClient()

  if (!process.env.RESEND_API_KEY) {
    await admin.from('notificacoes_log').insert({
      agencia_id: opts.agenciaId,
      cliente_id: opts.clienteId,
      fatura_id:  opts.faturaId,
      evento:     opts.evento,
      canal:      'email',
      status:     'nao_configurado',
    })
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL ?? 'Bastion <notificacoes@bastion.app>'

    const { error } = await resend.emails.send({
      from,
      to:      opts.toEmail,
      subject: opts.subject,
      html:    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">${opts.bodyHtml}<hr style="margin-top:32px;border:none;border-top:1px solid #e2e8f0"/><p style="color:#94a3b8;font-size:12px;margin-top:12px">Mensagem automática enviada pelo Bastion.</p></div>`,
    })

    await admin.from('notificacoes_log').insert({
      agencia_id: opts.agenciaId,
      cliente_id: opts.clienteId,
      fatura_id:  opts.faturaId,
      evento:     opts.evento,
      canal:      'email',
      status:     error ? 'erro' : 'enviado',
      enviado_em: new Date().toISOString(),
    })
  } catch {
    await admin.from('notificacoes_log').insert({
      agencia_id: opts.agenciaId,
      cliente_id: opts.clienteId,
      fatura_id:  opts.faturaId,
      evento:     opts.evento,
      canal:      'email',
      status:     'erro',
    })
  }
}

/** Verifica se o evento está ativo para a agência e retorna a config */
async function _getConfig(agenciaId: string, evento: NotificacaoEvento) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('notificacoes_config')
    .select('*')
    .eq('agencia_id', agenciaId)
    .eq('evento', evento)
    .eq('canal', 'email')
    .eq('ativo', true)
    .is('cliente_id', null)
    .maybeSingle()
  return data
}

export async function notificarFaturaVencendo(opts: {
  agenciaId:       string
  clienteId:       string
  faturaId:        string
  toEmail:         string
  clienteNome:     string
  valorFatura:     number
  dataVencimento:  string
  diasRestantes:   number
}) {
  const config = await _getConfig(opts.agenciaId, 'fatura_vencendo')
  if (!config) return

  const diasConfig = (config.dias_antecedencia ?? [3, 7]) as number[]
  if (!diasConfig.includes(opts.diasRestantes)) return

  const valor = opts.valorFatura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dataFmt = new Date(opts.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')

  await _sendEmail({
    agenciaId: opts.agenciaId,
    clienteId: opts.clienteId,
    faturaId:  opts.faturaId,
    evento:    'fatura_vencendo',
    toEmail:   opts.toEmail,
    subject:   `Fatura vencendo em ${opts.diasRestantes} dia${opts.diasRestantes === 1 ? '' : 's'}`,
    bodyHtml:  `<p>Olá, <strong>${escapeHtml(opts.clienteNome)}</strong>,</p><p>Sua fatura de <strong>${escapeHtml(valor)}</strong> vence em <strong>${escapeHtml(dataFmt)}</strong> (${opts.diasRestantes} dia${opts.diasRestantes === 1 ? '' : 's'}).</p><p>Por favor, providencie o pagamento para evitar multas e juros.</p>`,
  })
}

export async function notificarFaturaVencida(opts: {
  agenciaId:   string
  clienteId:   string
  faturaId:    string
  toEmail:     string
  clienteNome: string
  valorFatura: number
}) {
  const config = await _getConfig(opts.agenciaId, 'fatura_vencida')
  if (!config) return

  const valor = opts.valorFatura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  await _sendEmail({
    agenciaId: opts.agenciaId,
    clienteId: opts.clienteId,
    faturaId:  opts.faturaId,
    evento:    'fatura_vencida',
    toEmail:   opts.toEmail,
    subject:   'Fatura em atraso — regularize sua situação',
    bodyHtml:  `<p>Olá, <strong>${escapeHtml(opts.clienteNome)}</strong>,</p><p>Sua fatura de <strong>${escapeHtml(valor)}</strong> encontra-se em atraso.</p><p>Entre em contato com nossa equipe para regularizar sua situação e evitar a suspensão dos serviços.</p>`,
  })
}

export async function notificarRenovacaoProxima(opts: {
  agenciaId:    string
  clienteId:    string
  toEmail:      string
  clienteNome:  string
  produtoNome:  string
  dataRenovacao: string
  diasRestantes: number
}) {
  const config = await _getConfig(opts.agenciaId, 'renovacao_proxima')
  if (!config) return

  const diasConfig = (config.dias_antecedencia ?? [30]) as number[]
  if (!diasConfig.includes(opts.diasRestantes)) return

  const dataFmt = new Date(opts.dataRenovacao + 'T12:00:00').toLocaleDateString('pt-BR')

  await _sendEmail({
    agenciaId: opts.agenciaId,
    clienteId: opts.clienteId,
    faturaId:  null,
    evento:    'renovacao_proxima',
    toEmail:   opts.toEmail,
    subject:   `Renovação de ${escapeHtml(opts.produtoNome)} em ${opts.diasRestantes} dias`,
    bodyHtml:  `<p>Olá, <strong>${escapeHtml(opts.clienteNome)}</strong>,</p><p>O produto <strong>${escapeHtml(opts.produtoNome)}</strong> será renovado em <strong>${escapeHtml(dataFmt)}</strong>.</p><p>Em caso de dúvidas, entre em contato com nossa equipe.</p>`,
  })
}
