/**
 * Bastion — Seed de demonstração
 * Cria todos os dados demo via Supabase Admin API + client
 *
 * Uso: npx dotenv -e .env.local -- npx tsx supabase/seed-demo.ts
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.error('❌ Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── IDs fixos ────────────────────────────────────────────────
const AG = 'a0a0a0a0-0000-0000-0000-000000000001'

const PRODUTOS = {
  seo:    'pppppppp-0000-0000-0000-000000000001',
  ads:    'pppppppp-0000-0000-0000-000000000002',
  social: 'pppppppp-0000-0000-0000-000000000003',
  site:   'pppppppp-0000-0000-0000-000000000004',
}

const OFERTAS = {
  seo:    'oooooooo-0000-0000-0000-000000000001',
  ads:    'oooooooo-0000-0000-0000-000000000002',
  social: 'oooooooo-0000-0000-0000-000000000003',
  site:   'oooooooo-0000-0000-0000-000000000004',
}

// ─── Helpers ──────────────────────────────────────────────────
function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().split('T')[0]
}

function competencia(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 7)
}

function vencimento(monthsBack: number, dia: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack)
  d.setDate(dia)
  return d.toISOString().split('T')[0]
}

async function must<T>(op: Promise<{ data: T | null; error: any }>, label: string): Promise<T> {
  const { data, error } = await op
  if (error) throw new Error(`${label}: ${error.message}`)
  return data as T
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Bastion Demo Seed\n')

  // 1. Agência (deve existir antes dos usuários — trigger profiles referencia agencia_id)
  console.log('1. Agência...')
  await sb.from('agencias').upsert({
    id: AG, nome: 'Dental Growth Agency', slug: 'dental-growth', plano: 'profissional',
  }, { onConflict: 'id' })
  console.log('  ✓ Dental Growth Agency')

  // 2. Auth users (via SQL — Admin API JS não suporta IDs fixos com triggers customizados)
  console.log('\n2. Usuários auth já criados via SQL seed.')
  const adminId = 'aaaaaaaa-0000-0000-0000-000000000001'
  const anaId   = 'aaaaaaaa-0000-0000-0000-000000000002'
  const pedroId = 'aaaaaaaa-0000-0000-0000-000000000003'
  console.log('  ✓ carlos, ana, pedro')

  // 3. Profiles (atualiza nivel_desconto — profile já foi criado pelo trigger)
  console.log('\n3. Profiles...')
  await sb.from('profiles').upsert([
    { id: adminId, agencia_id: AG, nome: 'Carlos Mendes', email: 'carlos@dentalgrowth.com.br', role: 'admin',  nivel_desconto: 30 },
    { id: anaId,   agencia_id: AG, nome: 'Ana Lima',      email: 'ana@dentalgrowth.com.br',    role: 'gestor', nivel_desconto: 15 },
    { id: pedroId, agencia_id: AG, nome: 'Pedro Costa',   email: 'pedro@dentalgrowth.com.br',  role: 'gestor', nivel_desconto: 10 },
  ], { onConflict: 'id' })
  console.log('  ✓ 3 profiles')

  // 4. Produtos
  console.log('\n4. Produtos...')
  await sb.from('produtos_agencia').upsert([
    { id: PRODUTOS.seo,    agencia_id: AG, codigo_produto: 'SEO-001',  nome: 'SEO Local',          categoria: 'SEO',           tipo: 'recorrente', periodicidade: 'mensal', valor_padrao: 800,  custo_base: 200 },
    { id: PRODUTOS.ads,    agencia_id: AG, codigo_produto: 'ADS-001',  nome: 'Google Ads',         categoria: 'Tráfego Pago',  tipo: 'recorrente', periodicidade: 'mensal', valor_padrao: 1200, custo_base: 300 },
    { id: PRODUTOS.social, agencia_id: AG, codigo_produto: 'SOC-001',  nome: 'Social Media',       categoria: 'Redes Sociais', tipo: 'recorrente', periodicidade: 'mensal', valor_padrao: 900,  custo_base: 220 },
    { id: PRODUTOS.site,   agencia_id: AG, codigo_produto: 'SITE-001', nome: 'Site Institucional', categoria: 'Website',       tipo: 'pontual',    periodicidade: null,     valor_padrao: 3500, custo_base: 800 },
  ], { onConflict: 'agencia_id,codigo_produto' })
  console.log('  ✓ 4 produtos')

  // 5. Ofertas
  console.log('\n5. Ofertas...')
  await sb.from('produto_ofertas').upsert([
    { id: OFERTAS.seo,    agencia_id: AG, produto_id: PRODUTOS.seo,    nome: 'SEO Local Mensal',    valor: 800,  periodicidade: 'mensal', renovacao_automatica: true,  dias_geracao_fatura: 7, multa_atraso_perc: 2.00, juros_atraso_diario: 0.0330 },
    { id: OFERTAS.ads,    agencia_id: AG, produto_id: PRODUTOS.ads,    nome: 'Google Ads Mensal',   valor: 1200, periodicidade: 'mensal', renovacao_automatica: true,  dias_geracao_fatura: 7, multa_atraso_perc: 2.00, juros_atraso_diario: 0.0330 },
    { id: OFERTAS.social, agencia_id: AG, produto_id: PRODUTOS.social, nome: 'Social Media Mensal', valor: 900,  periodicidade: 'mensal', renovacao_automatica: true,  dias_geracao_fatura: 7, multa_atraso_perc: 2.00, juros_atraso_diario: 0.0330 },
    { id: OFERTAS.site,   agencia_id: AG, produto_id: PRODUTOS.site,   nome: 'Site Único',          valor: 3500, periodicidade: null,     renovacao_automatica: false, dias_geracao_fatura: 0, multa_atraso_perc: 2.00, juros_atraso_diario: 0.0330 },
  ], { onConflict: 'id' })
  console.log('  ✓ 4 ofertas')

  // 6. Clientes
  console.log('\n6. Clientes...')
  type ClienteInput = {
    id: string; cod: string; razao: string; fantasia: string; cnpj: string
    cidade: string; uf: string; status: string; segmento: string
    resp: string; cac: number; inicio: string; dia: number
  }
  const clientes: ClienteInput[] = [
    { id: 'cccccccc-0000-0000-0000-000000000001', cod: 'CLI-001', razao: 'Clínica Sorriso Pleno Ltda',    fantasia: 'Sorriso Pleno',    cnpj: '12.345.678/0001-90', cidade: 'São Paulo',    uf: 'SP', status: 'ativo',        segmento: 'solo',          resp: anaId,   cac: 1500, inicio: monthsAgo(18), dia: 10 },
    { id: 'cccccccc-0000-0000-0000-000000000002', cod: 'CLI-002', razao: 'Dental Premium SP S/A',         fantasia: 'Dental Premium',   cnpj: '23.456.789/0001-01', cidade: 'São Paulo',    uf: 'SP', status: 'ativo',        segmento: 'rede',          resp: anaId,   cac: 3200, inicio: monthsAgo(30), dia: 15 },
    { id: 'cccccccc-0000-0000-0000-000000000003', cod: 'CLI-003', razao: 'Odonto Express Clínica Dental', fantasia: 'Odonto Express',   cnpj: '34.567.890/0001-12', cidade: 'Campinas',     uf: 'SP', status: 'ativo',        segmento: 'especialidade', resp: pedroId, cac: 800,  inicio: monthsAgo(8),  dia: 5  },
    { id: 'cccccccc-0000-0000-0000-000000000004', cod: 'CLI-004', razao: 'Instituto Oral de SP Ltda',     fantasia: 'Instituto Oral',   cnpj: '45.678.901/0001-23', cidade: 'São Paulo',    uf: 'SP', status: 'ativo',        segmento: 'solo',          resp: pedroId, cac: 1200, inicio: monthsAgo(14), dia: 20 },
    { id: 'cccccccc-0000-0000-0000-000000000005', cod: 'CLI-005', razao: 'Smile Center Odontologia S/A',  fantasia: 'Smile Center',     cnpj: '56.789.012/0001-34', cidade: 'Guarulhos',    uf: 'SP', status: 'inadimplente', segmento: 'rede',          resp: anaId,   cac: 2500, inicio: monthsAgo(22), dia: 5  },
    { id: 'cccccccc-0000-0000-0000-000000000006', cod: 'CLI-006', razao: 'Clínica Bela Smile Ltda',       fantasia: 'Bela Smile',       cnpj: '67.890.123/0001-45', cidade: 'Santo André',  uf: 'SP', status: 'ativo',        segmento: 'solo',          resp: pedroId, cac: 700,  inicio: monthsAgo(6),  dia: 10 },
    { id: 'cccccccc-0000-0000-0000-000000000007', cod: 'CLI-007', razao: 'Ortodontia Santos Clínica',     fantasia: 'Ortodontia Santos',cnpj: '78.901.234/0001-56', cidade: 'Santos',       uf: 'SP', status: 'inativo',      segmento: 'especialidade', resp: anaId,   cac: 1000, inicio: monthsAgo(12), dia: 15 },
    { id: 'cccccccc-0000-0000-0000-000000000008', cod: 'CLI-008', razao: 'Dental Arts Odontologia Ltda',  fantasia: 'Dental Arts',      cnpj: '89.012.345/0001-67', cidade: 'São Bernardo', uf: 'SP', status: 'ativo',        segmento: 'solo',          resp: anaId,   cac: 900,  inicio: monthsAgo(36), dia: 10 },
  ]

  await sb.from('clientes').upsert(clientes.map(c => ({
    id: c.id, agencia_id: AG, codigo_cliente: c.cod,
    razao_social: c.razao, nome_fantasia: c.fantasia, cnpj: c.cnpj,
    cidade: c.cidade, uf: c.uf, status: c.status, segmento: c.segmento,
    responsavel_id: c.resp, custo_aquisicao: c.cac,
    data_inicio_relac: c.inicio, dia_vencimento: c.dia,
  })), { onConflict: 'agencia_id,codigo_cliente' })
  console.log('  ✓ 8 clientes')

  // 7. Contatos principais
  console.log('\n7. Contatos...')
  await sb.from('contatos_cliente').upsert([
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000001', nome: 'Dra. Fernanda Silva',  cargo: 'Diretora',     email: 'fernanda@sorrisopleno.com.br',  whatsapp: '11987650001', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000002', nome: 'Dr. Ricardo Alves',   cargo: 'CEO',          email: 'ricardo@dentalpremium.com.br',  whatsapp: '11987650002', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000003', nome: 'Dra. Camila Torres',  cargo: 'Proprietária', email: 'camila@odoexpress.com.br',       whatsapp: '19987650003', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000004', nome: 'Dr. Marcos Pereira',  cargo: 'Sócio',        email: 'marcos@institutooral.com.br',    whatsapp: '11987650004', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000005', nome: 'Dra. Juliana Ramos',  cargo: 'Financeiro',   email: 'juliana@smilecenter.com.br',     whatsapp: '11987650005', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000006', nome: 'Dr. André Souza',     cargo: 'Proprietário', email: 'andre@belasmile.com.br',         whatsapp: '11987650006', is_principal: true },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000008', nome: 'Dra. Patricia Nunes', cargo: 'Diretora',     email: 'patricia@dentalarts.com.br',     whatsapp: '13987650008', is_principal: true },
  ], { onConflict: 'id' })
  console.log('  ✓ 7 contatos')

  // 8. Contratos
  console.log('\n8. Contratos...')
  type ContratoRow = { id: string; num: string; clienteId: string; inicio: string; forma: string }
  const contratos: ContratoRow[] = [
    { id: 'kkkkkkkk-0000-0000-0000-000000000001', num: 'CTR-2024-001', clienteId: 'cccccccc-0000-0000-0000-000000000001', inicio: monthsAgo(18), forma: 'pix' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000002', num: 'CTR-2023-002', clienteId: 'cccccccc-0000-0000-0000-000000000002', inicio: monthsAgo(30), forma: 'boleto' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000003', num: 'CTR-2025-003', clienteId: 'cccccccc-0000-0000-0000-000000000003', inicio: monthsAgo(8),  forma: 'pix' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000004', num: 'CTR-2025-004', clienteId: 'cccccccc-0000-0000-0000-000000000004', inicio: monthsAgo(14), forma: 'transferencia' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000005', num: 'CTR-2024-005', clienteId: 'cccccccc-0000-0000-0000-000000000005', inicio: monthsAgo(22), forma: 'boleto' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000006', num: 'CTR-2025-006', clienteId: 'cccccccc-0000-0000-0000-000000000006', inicio: monthsAgo(6),  forma: 'pix' },
    { id: 'kkkkkkkk-0000-0000-0000-000000000007', num: 'CTR-2023-008', clienteId: 'cccccccc-0000-0000-0000-000000000008', inicio: monthsAgo(36), forma: 'pix' },
  ]

  await sb.from('contratos').upsert(contratos.map(c => ({
    id: c.id, agencia_id: AG, numero_contrato: c.num,
    cliente_id: c.clienteId, tipo: 'servico', status: 'ativo',
    data_assinatura: c.inicio, data_ativacao: c.inicio,
    forma_pagamento: c.forma, prazo_pagamento: 5,
  })), { onConflict: 'agencia_id,numero_contrato' })
  console.log('  ✓ 7 contratos')

  // 9. Contrato itens
  console.log('\n9. Itens contratados...')
  await sb.from('contrato_itens').upsert([
    // C1: SEO + Ads
    { id: 'iiiiiiii-0000-0000-0000-000000000001', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000001', produto_id: PRODUTOS.seo,    oferta_id: OFERTAS.seo,    valor_negociado: 800,  data_inicio_item: monthsAgo(18), status: 'ativo' },
    { id: 'iiiiiiii-0000-0000-0000-000000000002', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000001', produto_id: PRODUTOS.ads,    oferta_id: OFERTAS.ads,    valor_negociado: 900,  data_inicio_item: monthsAgo(18), status: 'ativo' },
    // C2: Ads + Social + SEO
    { id: 'iiiiiiii-0000-0000-0000-000000000003', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000002', produto_id: PRODUTOS.ads,    oferta_id: OFERTAS.ads,    valor_negociado: 1200, data_inicio_item: monthsAgo(30), status: 'ativo' },
    { id: 'iiiiiiii-0000-0000-0000-000000000004', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000002', produto_id: PRODUTOS.social, oferta_id: OFERTAS.social, valor_negociado: 900,  data_inicio_item: monthsAgo(30), status: 'ativo' },
    { id: 'iiiiiiii-0000-0000-0000-000000000005', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000002', produto_id: PRODUTOS.seo,    oferta_id: OFERTAS.seo,    valor_negociado: 1500, data_inicio_item: monthsAgo(30), status: 'ativo' },
    // C3: Social
    { id: 'iiiiiiii-0000-0000-0000-000000000006', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000003', produto_id: PRODUTOS.social, oferta_id: OFERTAS.social, valor_negociado: 900,  data_inicio_item: monthsAgo(8),  status: 'ativo' },
    // C4: SEO + Social
    { id: 'iiiiiiii-0000-0000-0000-000000000007', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000004', produto_id: PRODUTOS.seo,    oferta_id: OFERTAS.seo,    valor_negociado: 800,  data_inicio_item: monthsAgo(14), status: 'ativo' },
    { id: 'iiiiiiii-0000-0000-0000-000000000008', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000004', produto_id: PRODUTOS.social, oferta_id: OFERTAS.social, valor_negociado: 1200, data_inicio_item: monthsAgo(14), status: 'ativo' },
    // C5: Ads + Social (inadimplente)
    { id: 'iiiiiiii-0000-0000-0000-000000000009', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000005', produto_id: PRODUTOS.ads,    oferta_id: OFERTAS.ads,    valor_negociado: 1200, data_inicio_item: monthsAgo(22), status: 'ativo' },
    { id: 'iiiiiiii-0000-0000-0000-000000000010', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000005', produto_id: PRODUTOS.social, oferta_id: OFERTAS.social, valor_negociado: 900,  data_inicio_item: monthsAgo(22), status: 'ativo' },
    // C6: SEO
    { id: 'iiiiiiii-0000-0000-0000-000000000011', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000006', produto_id: PRODUTOS.seo,    oferta_id: OFERTAS.seo,    valor_negociado: 800,  data_inicio_item: monthsAgo(6),  status: 'ativo' },
    // C8: SEO
    { id: 'iiiiiiii-0000-0000-0000-000000000012', agencia_id: AG, contrato_id: 'kkkkkkkk-0000-0000-0000-000000000007', produto_id: PRODUTOS.seo,    oferta_id: OFERTAS.seo,    valor_negociado: 800,  data_inicio_item: monthsAgo(36), status: 'ativo' },
  ], { onConflict: 'id' })
  console.log('  ✓ 12 itens')

  // 10. Faturas + itens + pagamentos
  console.log('\n10. Faturas e pagamentos...')

  type ClienteFatura = { clienteId: string; valor: number; dia: number; pontual: boolean; cod: string }
  const cfaturas: ClienteFatura[] = [
    { clienteId: 'cccccccc-0000-0000-0000-000000000001', valor: 1700, dia: 10, pontual: true,  cod: 'CLI001' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000002', valor: 3600, dia: 15, pontual: true,  cod: 'CLI002' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000003', valor: 900,  dia: 5,  pontual: true,  cod: 'CLI003' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000004', valor: 2000, dia: 20, pontual: true,  cod: 'CLI004' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000005', valor: 2100, dia: 5,  pontual: false, cod: 'CLI005' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000006', valor: 800,  dia: 10, pontual: true,  cod: 'CLI006' },
    { clienteId: 'cccccccc-0000-0000-0000-000000000008', valor: 800,  dia: 10, pontual: true,  cod: 'CLI008' },
  ]

  let totalFaturas = 0
  for (const cf of cfaturas) {
    for (let m = 1; m <= 6; m++) {
      const comp = competencia(m)
      const venc = vencimento(m, cf.dia)
      const num  = `FAT-${comp}-${cf.cod}-${String(m).padStart(2, '0')}`
      const isPago = cf.pontual || m <= 4

      const { data: fatura, error: fe } = await sb.from('faturas').upsert({
        agencia_id: AG,
        numero_fatura: num,
        cliente_id: cf.clienteId,
        competencia: comp,
        data_emissao: vencimento(m, cf.dia - 7 < 1 ? 1 : cf.dia - 7),
        data_vencimento: venc,
        valor_total: cf.valor,
        valor_pago: isPago ? cf.valor : 0,
        status: isPago ? 'pago' : 'atrasado',
      }, { onConflict: 'agencia_id,numero_fatura' }).select('id').single()

      if (fe || !fatura) continue
      const faturaId = fatura.id
      totalFaturas++

      // item da fatura
      await sb.from('fatura_itens').insert({
        agencia_id: AG, fatura_id: faturaId,
        descricao: `Serviços de marketing digital — ${comp}`,
        valor: cf.valor,
      }).select()

      // pagamento (se pago)
      if (isPago) {
        const diasAtraso = (!cf.pontual && m <= 4) ? (m === 1 ? 15 : m === 2 ? 22 : 0) : (m === 2 ? 3 : 0)
        const dateParts = venc.split('-').map(Number)
        const datePag = new Date(dateParts[0], dateParts[1] - 1, dateParts[2] + diasAtraso)
        const dataPag = datePag.toISOString().split('T')[0]

        await sb.from('pagamentos').insert({
          agencia_id: AG, fatura_id: faturaId,
          data_pagamento: dataPag, valor_pago: cf.valor,
          forma_pagamento: 'pix', status: 'confirmado',
          registrado_por: adminId,
        }).select()
      }
    }
  }
  console.log(`  ✓ ${totalFaturas} faturas`)

  // 11. NPS
  console.log('\n11. NPS...')
  await sb.from('nps_registros').upsert([
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000001', score: 9,  comentario: 'Excelente trabalho! Aumentamos 40% nas consultas online.',  data_registro: monthsAgo(3),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000001', score: 10, comentario: 'Melhor investimento que fizemos. Super recomendo!',           data_registro: monthsAgo(9),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000002', score: 10, comentario: 'Resultados excepcionais. ROI acima das expectativas.',        data_registro: monthsAgo(2),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000002', score: 9,  comentario: 'Equipe muito dedicada e resultados constantes.',              data_registro: monthsAgo(8),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000003', score: 7,  comentario: 'Ainda no começo, mas já vendo engajamento crescer.',          data_registro: monthsAgo(2),  responsavel_id: pedroId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000004', score: 9,  comentario: 'Ótima comunicação e relatórios claros.',                      data_registro: monthsAgo(1),  responsavel_id: pedroId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000005', score: 4,  comentario: 'Resultados abaixo do esperado nos últimos meses.',            data_registro: monthsAgo(4),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000006', score: 8,  comentario: 'Boa organização e equipe atenciosa. Aguardando resultados.',  data_registro: monthsAgo(2),  responsavel_id: pedroId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000008', score: 10, comentario: 'Parceiros há 3 anos. Triplicamos a captação de pacientes!',  data_registro: monthsAgo(1),  responsavel_id: anaId },
    { agencia_id: AG, cliente_id: 'cccccccc-0000-0000-0000-000000000008', score: 9,  comentario: 'Consistency perfeita ao longo dos anos.',                    data_registro: monthsAgo(13), responsavel_id: anaId },
  ], { onConflict: 'id' })
  console.log('  ✓ 10 registros NPS')

  // 12. MRR Histórico
  console.log('\n12. MRR histórico...')
  const mrrData = [
    [11, 7200,  86400,  5],
    [10, 7200,  86400,  5],
    [9,  8900,  106800, 6],
    [8,  8900,  106800, 6],
    [7,  9700,  116400, 6],
    [6,  9700,  116400, 6],
    [5,  10500, 126000, 7],
    [4,  11300, 135600, 7],
    [3,  11300, 135600, 7],
    [2,  12100, 145200, 8],
    [1,  12100, 145200, 8],
    [0,  12100, 145200, 8],
  ]

  await sb.from('mrr_historico').upsert(
    mrrData.map(([m, mrr, arr, cli]) => ({
      agencia_id: AG,
      competencia: competencia(m),
      mrr, arr, clientes_ativos: cli,
    })),
    { onConflict: 'agencia_id,competencia' }
  )
  console.log('  ✓ 12 meses de histórico MRR')

  console.log('\n✅ Seed concluído!')
  console.log('\n📋 Credenciais:')
  console.log('  admin:  carlos@dentalgrowth.com.br  /  Demo@1234')
  console.log('  gestor: ana@dentalgrowth.com.br     /  Demo@1234')
  console.log('  gestor: pedro@dentalgrowth.com.br   /  Demo@1234')
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
