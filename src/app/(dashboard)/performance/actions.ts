'use server'

import { createClient } from '@/lib/supabase/server'

const CLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export async function getPerformanceData() {
  const supabase = await createClient()

  const [
    { data: tx },
    { data: fixed },
    { data: goals },
    { data: credits }
  ] = await Promise.all([
    supabase.from('transactions').select('amount, type, created_at'),
    supabase.from('fixed_expenses').select('amount').eq('is_active', true),
    supabase.from('savings').select('current_amount, target_amount, name'),
    supabase.from('credits').select('remaining_amount, installment_value, name')
  ])

  // Calculos base (histórico total)
  const ingresos = tx?.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0) ?? 0
  const gastosEjecutados = Math.abs(tx?.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0) ?? 0)

  // Mes actual
  const now = new Date()
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const txMes = tx?.filter(t => new Date(t.created_at) >= new Date(firstDayMonth)) ?? []
  const ingresosMes = txMes.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
  const gastosMes = Math.abs(txMes.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0))

  const totalFijos = fixed?.reduce((a, b) => a + Number(b.amount), 0) ?? 0
  const cuotaCreditos = credits?.reduce((a, b) => a + Number(b.installment_value), 0) ?? 0
  const deudaTotal = credits?.reduce((a, b) => a + Number(b.remaining_amount), 0) ?? 0

  // Patrimonio = ahorros - deudas
  const totalAhorros = goals?.reduce((a, b) => a + Number(b.current_amount), 0) ?? 0
  const patrimonio = totalAhorros - deudaTotal

  const compromisoMensual = totalFijos + cuotaCreditos
  const flujoPotencial = ingresosMes - gastosMes - compromisoMensual

  // Metas de ahorro
  const metaObj = goals?.reduce((a, b) => a + Number(b.target_amount), 0) ?? 0
  const metaAct = goals?.reduce((a, b) => a + Number(b.current_amount), 0) ?? 0
  const faltanteMeta = metaObj - metaAct

  // Insights dinámicos
  const insights = []

  // Insight de Ahorro
  if (metaObj > 0) {
    const mesesParaMeta = flujoPotencial > 0 ? Math.ceil(faltanteMeta / flujoPotencial) : null
    insights.push({
      id: 'saving',
      title: 'Ruta a la Meta',
      desc: mesesParaMeta && mesesParaMeta > 0
        ? `A tu ritmo actual, completarás tus objetivos en ${mesesParaMeta} mes${mesesParaMeta !== 1 ? 'es' : ''}.`
        : faltanteMeta <= 0
        ? '¡Meta alcanzada! Estás por encima de tu objetivo.'
        : 'Tu flujo mensual no alcanza para las metas. Revisa tus gastos fijos.',
      action: mesesParaMeta && mesesParaMeta > 0
        ? `Para llegar en 3 meses, ahorra ${CLP(Math.ceil(faltanteMeta / 3))} al mes.`
        : faltanteMeta <= 0
        ? 'Considera aumentar tu meta o invertir el excedente.'
        : 'Reduce gastos variables o aumenta tus ingresos.'
    })
  }

  // Insight de Deuda
  const debtRatio = ingresosMes > 0 ? (cuotaCreditos / ingresosMes) * 100 : 0
  if (credits && credits.length > 0) {
    insights.push({
      id: 'debt',
      title: 'Carga de Deuda',
      desc: ingresosMes > 0
        ? `Tus cuotas consumen el ${debtRatio.toFixed(1)}% de tus ingresos este mes.`
        : `Tienes ${CLP(cuotaCreditos)} en cuotas mensuales a cubrir.`,
      action: debtRatio > 30
        ? 'Nivel alto: Evita nuevos créditos y prioriza liquidar el de mayor saldo.'
        : debtRatio > 0
        ? 'Nivel manejable. Mantén el pago puntual para mejorar tu historial.'
        : 'Sin cuotas activas este mes.'
    })
  }

  // Insight de Resiliencia
  const gastoMensualEstimado = gastosMes + compromisoMensual
  const runwayMeses = gastoMensualEstimado > 0 && totalAhorros > 0
    ? (totalAhorros / gastoMensualEstimado).toFixed(1)
    : '0'

  insights.push({
    id: 'runway',
    title: 'Resiliencia Financiera',
    desc: parseFloat(runwayMeses) > 0
      ? `Con tus ahorros actuales podrías vivir ${runwayMeses} mes${parseFloat(runwayMeses) !== 1 ? 'es' : ''} sin ingresos.`
      : 'Sin fondo de emergencia activo aún.',
    action: parseFloat(runwayMeses) < 3
      ? 'Prioritario: Construir fondo de emergencia de al menos 3 meses.'
      : parseFloat(runwayMeses) < 6
      ? 'Bien encaminado. Apunta a 6 meses de gastos como colchón ideal.'
      : 'Excelente resiliencia. Considera invertir el excedente.'
  })

  const score = calcularSalud(flujoPotencial, totalAhorros, deudaTotal, ingresosMes, gastosMes)

  return {
    metrics: {
      ingresos: ingresosMes,
      gastos: gastosMes,
      patrimonio,
      score,
      ingresosHistoricos: ingresos,
      gastosHistoricos: gastosEjecutados,
    },
    pendientes: {
      gastosFijos: totalFijos,
      cuotasCreditos: cuotaCreditos,
      totalMes: compromisoMensual
    },
    meta: {
      actual: metaAct,
      objetivo: metaObj,
      porcentaje: metaObj > 0 ? Math.min((metaAct / metaObj) * 100, 100) : 0
    },
    insights
  }
}

function calcularSalud(neto: number, ahorros: number, deuda: number, ingresos: number, gastos: number): number {
  let s = 50
  // Flujo positivo este mes
  if (neto > 0) s += 20
  if (neto < 0) s -= 20
  // Ahorros > deudas
  if (ahorros > deuda) s += 15
  if (deuda > 0 && ahorros === 0) s -= 10
  // Gasto vs Ingreso
  if (ingresos > 0) {
    const ratio = gastos / ingresos
    if (ratio < 0.5) s += 15
    else if (ratio < 0.7) s += 8
    else if (ratio > 0.9) s -= 15
  }
  return Math.max(0, Math.min(100, s))
}
