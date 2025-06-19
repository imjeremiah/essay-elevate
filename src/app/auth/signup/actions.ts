'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Signs up a new user using their email and password.
 * 
 * @param formData - The form data containing the email and password.
 * @returns A redirect to a confirmation page or an error page.
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup error:', error);
    return redirect('/auth/signup?message=Could not authenticate user');
  }

  return redirect(
    '/auth/confirm?message=Check your email to continue the sign up process',
  );
} 