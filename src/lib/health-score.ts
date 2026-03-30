type HealthInput = {
  status: string
  data_inicio_relac: string | null
  created_at: string
  faturas: { data_vencimento: string; status: string; pagamentos: { data_pagamento: string }[] }[]
  ultimaNps: number | null
}

export function calcularHealthScore(input: HealthInput) {
  const { status, data_inicio_relac, created_at, faturas, ultimaNps } = input

  const suspenso = ['suspenso', 'inativo', 'cancelado'].includes(status)
  if (suspenso) {
    return { score: 0, pontualidade: 0, nps: 0, longevidade: 0, suspenso: true }
  }

  // Pontualidade: % faturas pagas no prazo nos últimos 6 meses
  const seisM = new Date()
  seisM.setMonth(seisM.getMonth() - 6)
  const faturasRecentes = faturas.filter((f) => new Date(f.data_vencimento) >= seisM)

  let pontualidadeScore = 50 // neutro se sem faturas
  if (faturasRecentes.length > 0) {
    const pagas = faturasRecentes.filter((f) => {
      if (f.status !== 'pago') return false
      const pagamento = f.pagamentos[0]
      if (!pagamento) return false
      return new Date(pagamento.data_pagamento) <= new Date(f.data_vencimento)
    })
    pontualidadeScore = (pagas.length / faturasRecentes.length) * 100
  }

  // NPS: última nota normalizada (nota × 10), zero se sem registro
  const npsScore = ultimaNps !== null ? ultimaNps * 10 : 0

  // Longevidade: tenure em meses, capado em 24
  const inicio = new Date(data_inicio_relac ?? created_at)
  const tenureMeses = Math.max(0, (Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const longevidadeScore = Math.min(tenureMeses / 24, 1) * 100

  const score = Math.round(pontualidadeScore * 0.5 + npsScore * 0.3 + longevidadeScore * 0.2)

  return {
    score,
    pontualidade: pontualidadeScore,
    nps: npsScore,
    longevidade: longevidadeScore,
    suspenso: false,
  }
}
