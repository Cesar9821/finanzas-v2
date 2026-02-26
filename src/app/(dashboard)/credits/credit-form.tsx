'use client';

import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { addCredit } from './actions';

export default function CreditForm({ inputStyles }: { inputStyles: string }) {
  const [totalCTC, setTotalCTC] = useState('');
  const [valorCuota, setValorCuota] = useState('');

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits === "" ? "" : new Intl.NumberFormat('en-US').format(parseInt(digits));
  };

  return (
    // Reduje el padding en móvil (p-6) y el redondeado (rounded-3xl) para que no coma tanto espacio
    <div className="p-6 md:p-8 bg-slate-900/30 backdrop-blur-2xl border border-white/5 rounded-3xl md:rounded-[2.5rem] shadow-2xl">
      
      <div className="flex items-center gap-3 mb-6 md:mb-8 text-rose-500">
        <CreditCard size={20} />
        <h2 className="text-xs font-black uppercase tracking-[0.3em]">Nueva Obligación Financiera</h2>
      </div>

      <form 
        action={async (formData) => {
          await addCredit(formData);
          setTotalCTC('');
          setValorCuota('');
        }} 
        // El grid está perfecto, pero añadimos items-end para que los inputs se alineen bien en desktop
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6"
      >
        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic">Nombre Crédito</label>
          <input name="name" placeholder="Ej: Crédito Casa" className={inputStyles} required />
        </div>

        {/* Total CTC */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic text-rose-500">Total CTC</label>
          <div className="relative">
            <input 
              type="text"
              value={totalCTC}
              onChange={(e) => setTotalCTC(formatCurrency(e.target.value))}
              placeholder="300,000" 
              className={`${inputStyles} w-full font-mono font-bold text-slate-300`} 
              required 
            />
            <input type="hidden" name="total_amount" value={totalCTC.replace(/,/g, "")} />
          </div>
        </div>

        {/* Valor Cuota */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic">Valor Cuota</label>
          <div className="relative">
            <input 
              type="text"
              value={valorCuota}
              onChange={(e) => setValorCuota(formatCurrency(e.target.value))}
              placeholder="25,000" 
              className={`${inputStyles} w-full font-mono font-bold text-rose-400`} 
              required 
            />
            <input type="hidden" name="installment_value" value={valorCuota.replace(/,/g, "")} />
          </div>
        </div>

        {/* Cuotas (Pagadas / Totales) */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic">Cuotas (Pagadas / Total)</label>
          <div className="flex gap-2 items-center">
            <input name="paid_installments" type="number" placeholder="9" className={`${inputStyles} w-full`} required min="0" />
            <span className="text-slate-700 font-bold">/</span>
            <input name="total_installments" type="number" placeholder="12" className={`${inputStyles} w-full`} required min="1" />
          </div>
        </div>

        {/* Botón: Se ajusta al final del grid */}
        <div className="flex items-end mt-2 md:mt-0">
          <button type="submit" className="w-full bg-white text-black font-black py-4 md:py-3.5 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
            <Plus size={16} strokeWidth={3} className="mr-2" /> Registrar
          </button>
        </div>
      </form>
    </div>
  );
}