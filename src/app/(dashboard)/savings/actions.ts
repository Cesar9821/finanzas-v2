'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addSaving(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const target_amount = parseFloat(formData.get('target_amount') as string);

  if (!name || isNaN(target_amount) || target_amount <= 0) return;

  const { error } = await supabase.from('savings').insert([
    {
      name,
      target_amount,
      current_amount: 0,
    }
  ]);

  if (error) {
    console.error('Error saving goal:', error.message);
    return;
  }

  revalidatePath('/savings');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function deleteSaving(id: string) {
  const supabase = await createClient();
  await supabase.from('savings').delete().eq('id', id);
  revalidatePath('/savings');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}
