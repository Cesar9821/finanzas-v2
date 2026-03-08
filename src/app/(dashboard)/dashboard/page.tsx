import { createClient } from '@/lib/supabase/server';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Zap,
  ShieldCheck,
  Activity,
  PiggyBank,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const now = new Date();
  const year = parseInt(params?.anio || String(now.getFullYear()));
  const month = parseInt(params?.mes || String(now.getMonth() + 1));

  const firstDay = new Date(year, month - 1, 1).toISOString();
  const lastDay = new Date(year, month, 0, 23, 59, 59).toISOString();

  // Mes anterior y siguiente para navegación
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const [
    { data: allTx },
    { data: monthTx },
    { data: savingsData },
    { data: creditsData }
  ] = await Promise.all([
    supabase.from('transactions').select('amount, type'),
    supabase.from('transactions').select('amount, type').gte('created_at', firstDay).lte('created_at', lastDay),
    supabase.from('savings').select('current_amount'),
    supabase.from('credits').select('remaining_amount')
  ]);

  const histIncome = allTx?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const histExpenses = allTx?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 0;
  const histBalance = histIncome - histExpenses;

  const monthIncome = monthTx?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const monthExpenses = monthTx?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 0;
  const monthBalance = monthIncome - monthExpenses;

  const totalSaved = savingsData?.reduce((acc, s) => acc + Number(s.current_amount), 0) || 0;
  const totalDebt = creditsData?.reduce((acc, c) => acc + Number(c.remaining_amount), 0) || 0;

  const healthScore = monthIncome > 0
    ? Math.min(Math.round(((monthIncome - monthExpenses) / monthIncome) * 100), 100)
    : 0;

  const spendPct = monthIncome > 0 ? Math.min((monthExpenses / monthIncome) * 100, 100) : 0;

  return (
    <div className="relative space-y-8 md:space-y-10 pb-20">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Analítica en Tiempo Real</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none">
              Estatus<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mt-3">Control de Flujos y Pasivos</p>
          </div>
        </div>

        {/* Cards de Ahorro y Deuda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:w-auto">
          <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-5 rounded-[2rem] flex items-center gap-4 transition-all hover:bg-amber-500/15">
            <PiggyBank className="text-amber-500 shrink-0" size={28} />
            <div>
              <p className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Ahorro Total</p>
              <p className="text-xl md:text-2xl font-black text-white font-mono leading-none">{CLP(totalSaved)}</p>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-5 rounded-[2rem] flex items-center gap-4 transition-all hover:bg-rose-500/15">
            <CreditCard className="text-rose-500 shrink-0" size={28} />
            <div>
              <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest mb-1">Deuda Pendiente</p>
              <p className="text-xl md:text-2xl font-black text-white font-mono leading-none">{CLP(totalDebt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTOR DE MES */}
      <div className="flex items-center gap-4 bg-slate-900/30 border border-white/5 rounded-2xl p-3 w-fit">
        <a
          href={`/dashboard?mes=${prevDate.getMonth() + 1}&anio=${prevDate.getFullYear()}`}
          className="p-2 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </a>
        <div className="flex items-center gap-2 px-2">
          <Calendar size={14} className="text-indigo-400" />
          <span className="text-sm font-black text-white uppercase tracking-widest">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          {isCurrentMonth && (
            <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase">Actual</span>
          )}
        </div>
        <a
          href={`/dashboard?mes=${nextDate.getMonth() + 1}&anio=${nextDate.getFullYear()}`}
          className="p-2 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </a>
      </div>

      {/* COMPARATIVA MES VS HISTÓRICO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

        {/* PANEL MES ACTUAL */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 space-y-8 relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 italic">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
            </div>
            <div className="sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-none">
              <p className="text-[8px] font-black text-slate-500 uppercase">Flujo Neto</p>
              <p className={`text-xl font-black font-mono ${monthBalance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {CLP(monthBalance)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle size={14} className="text-emerald-400" />
                <p className="text-[9px] font-black text-emerald-500/70 uppercase italic tracking-wider">Ingresos</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white font-mono">{CLP(monthIncome)}</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 group-hover:bg-rose-500/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle size={14} className="text-rose-400" />
                <p className="text-[9px] font-black text-rose-500/70 uppercase italic tracking-wider">Gastos</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white font-mono">{CLP(monthExpenses)}</p>
            </div>
          </div>

          {/* Barra de Consumo */}
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              <span>Consumo del Ingreso</span>
              <span className="text-white">{spendPct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  spendPct > 90 ? 'bg-rose-500' : spendPct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                } shadow-[0_0_15px_rgba(79,70,229,0.4)]`}
                style={{ width: `${spendPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* PANEL HISTÓRICO */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 text-black relative overflow-hidden shadow-2xl group flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest opacity-40 italic">Balance General Acumulado</p>
            <h2 className={`text-5xl md:text-7xl font-black tracking-tighter italic break-words ${histBalance < 0 ? 'text-rose-600' : 'text-black'}`}>
              {CLP(histBalance)}
            </h2>
          </div>

          <div className="mt-12 relative z-10">
            <div className="grid grid-cols-2 gap-8 border-t border-black/10 pt-8">
              <div>
                <p className="text-[8px] md:text-[10px] font-bold opacity-40 uppercase mb-1">Entradas Totales</p>
                <p className="text-lg font-black italic tracking-tight">{CLP(histIncome)}</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-bold opacity-40 uppercase mb-1">Salidas Totales</p>
                <p className="text-lg font-black italic tracking-tight">{CLP(histExpenses)}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black text-[10px] tracking-[0.2em] uppercase italic bg-indigo-50 w-fit px-4 py-2 rounded-full">
              <Zap size={14} fill="currentColor" />
              <span>Acumulado Histórico</span>
            </div>
          </div>
          <Wallet className="absolute -right-12 -bottom-12 opacity-[0.04] text-black w-64 h-64 group-hover:scale-110 transition-transform duration-1000" />
        </div>
      </div>

      {/* HEALTH SCORE */}
      <div className="bg-slate-900/30 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-14 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative h-44 w-44 md:h-52 md:w-52 flex items-center justify-center shrink-0">
          <svg className="h-full w-full rotate-[-90deg] drop-shadow-[0_0_20px_rgba(79,70,229,0.3)]" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800/50" />
            <circle
              cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
              strokeDasharray={439.8}
              strokeDashoffset={439.8 - (439.8 * healthScore) / 100}
              className={healthScore > 50 ? 'text-indigo-500' : healthScore > 25 ? 'text-amber-500' : 'text-rose-500'}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{healthScore}%</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">Retención</span>
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center lg:text-left relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
              <ShieldCheck size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-white italic tracking-tight uppercase">Salud Financiera</h3>
          </div>
          <p className="text-slate-400 text-base md:text-xl font-medium leading-relaxed">
            Tu sistema opera con una eficiencia del <span className="text-white font-black italic underline decoration-indigo-500 underline-offset-4">{healthScore}%</span>.{' '}
            {healthScore > 60
              ? 'Estás en zona de expansión patrimonial. Excelente capacidad de ahorro.'
              : healthScore > 30
              ? 'Zona de precaución. Hay margen para optimizar tus gastos.'
              : monthIncome === 0
              ? 'Sin ingresos registrados este mes.'
              : 'Flujo ajustado. Revisa tus gastos fijos y variables.'}
          </p>
        </div>
      </div>
    </div>
  );
}
