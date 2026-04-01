'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

const TIPO_MAPA: Record<string, string> = {
  contrato:    'contrato',
  proposta:    'outro',
  autorizacao: 'autorizacao',
  termo:       'contrato',
  outro:       'outro',
}

export async function gerarDocumento(clienteId: string, modeloId: string) {
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Não autenticado' }

  const supabase = await createClient()
  const admin    = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Busca modelo
  const { data: modelo } = await admin
    .from('modelos_documento')
    .select('*')
    .eq('id', modeloId)
    .eq('agencia_id', profile.agencia_id)
    .single()
  if (!modelo) return { error: 'Modelo não encontrado' }

  // Busca dados do cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()
  if (!cliente) return { error: 'Cliente não encontrado' }

  // Busca responsável da agência
  const { data: responsavelPerfil } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', cliente.responsavel_id ?? '')
    .maybeSingle()

  // Busca contato principal
  const { data: contatos } = await supabase
    .from('contatos_cliente')
    .select('email, telefone')
    .eq('cliente_id', clienteId)
    .eq('is_principal', true)
    .limit(1)
  const contato = contatos?.[0]

  // Busca produtos ativos
  const { data: produtos } = await supabase
    .from('produtos_contratados')
    .select('produto_nome, valor_efetivo')
    .eq('cliente_id', clienteId)
    .eq('item_status', 'ativo')

  const mrr           = (produtos ?? []).reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)
  const primeiroProd  = produtos?.[0]
  const hoje          = new Date()

  const variaveis: Record<string, string> = {
    nome_cliente:           cliente.razao_social ?? '',
    nome_fantasia:          cliente.nome_fantasia ?? cliente.razao_social ?? '',
    cnpj:                   cliente.cnpj ?? '',
    codigo_cliente:         cliente.codigo_cliente ?? '',
    cidade:                 cliente.cidade ?? '',
    uf:                     cliente.uf ?? '',
    cep:                    cliente.cep ?? '',
    logradouro:             cliente.logradouro ?? '',
    numero:                 cliente.numero ?? '',
    bairro:                 cliente.bairro ?? '',
    responsavel_nome:       responsavelPerfil?.nome ?? '',
    decisor_nome:           cliente.decisor_nome ?? '',
    decisor_email:          cliente.decisor_email ?? '',
    resp_financeiro_nome:   cliente.resp_financeiro_nome ?? '',
    resp_financeiro_email:  cliente.resp_financeiro_email ?? '',
    contato_email:          contato?.email ?? cliente.decisor_email ?? '',
    contato_telefone:       contato?.telefone ?? cliente.decisor_telefone ?? '',
    produto_nome:           primeiroProd?.produto_nome ?? '',
    valor_mensal:           mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    data_hoje:              hoje.toLocaleDateString('pt-BR'),
    mes_atual:              hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    ano_atual:              String(hoje.getFullYear()),
  }

  const ext = modelo.arquivo_url.split('.').pop()?.toLowerCase()

  if (ext !== 'docx') {
    // Para não-DOCX: gera signed URL do original
    const { data: signedData } = await admin.storage
      .from('documentos')
      .createSignedUrl(modelo.arquivo_url, 3600)
    return { signedUrl: signedData?.signedUrl ?? null }
  }

  // Baixa o template DOCX
  const { data: fileData, error: downloadErr } = await admin.storage
    .from('documentos')
    .download(modelo.arquivo_url)
  if (downloadErr || !fileData) return { error: 'Erro ao baixar template' }

  try {
    const PizZip = (await import('pizzip')).default
    const Docxtemplater = (await import('docxtemplater')).default

    const arrayBuffer = await fileData.arrayBuffer()
    const zip = new PizZip(Buffer.from(arrayBuffer))
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      nullGetter:    () => '',
    })

    doc.render(variaveis)

    const output = doc.getZip().generate({
      type:        'nodebuffer',
      compression: 'DEFLATE',
    })

    // Salva arquivo gerado
    const nomeArquivo = `${modelo.nome} — ${cliente.razao_social} (${hoje.toISOString().split('T')[0]}).docx`
    const storagePath = `${clienteId}/${Date.now()}_gerado.docx`

    const { error: uploadErr } = await admin.storage
      .from('documentos')
      .upload(storagePath, output, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert:      false,
      })

    if (uploadErr) return { error: uploadErr.message }

    const tipoDoc = TIPO_MAPA[modelo.tipo] ?? 'outro'
    const { error: dbErr } = await supabase.from('documentos_cliente').insert({
      agencia_id:  profile.agencia_id,
      cliente_id:  clienteId,
      nome:        nomeArquivo,
      tipo:        tipoDoc as any,
      arquivo_url: storagePath,
      enviado_por: user.id,
    })

    if (dbErr) {
      await admin.storage.from('documentos').remove([storagePath])
      return { error: dbErr.message }
    }

    revalidatePath(`/clientes/${clienteId}`)
    return { success: true }
  } catch (err: any) {
    // Template sem variáveis ou erro de parse: devolve o original como download
    const { data: signedData } = await admin.storage
      .from('documentos')
      .createSignedUrl(modelo.arquivo_url, 3600)
    return { signedUrl: signedData?.signedUrl ?? null, warning: 'Template sem variáveis — baixando original.' }
  }
}
