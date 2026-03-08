'use server'

import { createClient } from '@/lib/supabase/server'; 
import { revalidatePath } from 'next/cache';

export async function addCredit(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  
  // CORRECCIÓN: Cambiado 'original_amount' por 'total_amount'
  const total_val = parseFloat(formData.get('total_amount') as string) || 0;
  
  const inst_val = parseFloat(formData.get('installment_value') as string) || 0;
  const paid_inst = parseInt(formData.get('paid_installments') as string) || 0;
  const total_inst = parseInt(formData.get('total_installments') as string) || 1;

  const calculated_remaining = total_val - (paid_inst * inst_val);

  const { error } = await supabase.from('credits').insert([
    {
      name: name,
      total_amount: total_val,       
      remaining_amount: calculated_remaining, 
      installment_value: inst_val,      
      paid_installments: paid_inst,     
      total_installments: total_inst    
    }
  ]);

  if (error) {
    console.error("Error al registrar crédito:", error.message);
    return; 
  }

  revalidatePath('/credits');
  revalidatePath('/transactions');
}
export async function deleteCredit(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('credits').delete().eq('id', id);
  revalidatePath('/credits');
  revalidatePath('/dashboard');
  revalidatePath('/performance');
}
