'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Signs up a new user using their email and password.
 * 
 * @param formData - The form data containing the email and password.
 * @returns A redirect to the dashboard if email confirmation is disabled, 
 * or to a confirmation page if email confirmation is enabled.
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const origin = (await headers()).get('origin');
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The user will be redirected to this URL after confirming their email
      // This is only used when email confirmation is enabled
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Signup error:', error);
    return redirect('/signup?message=Could not authenticate user');
  }

  // Check if the user has an active session after signup
  // If email confirmation is disabled, they'll be automatically signed in
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (sessionData.session) {
    // User is signed in automatically (email confirmation disabled)
    return redirect('/dashboard');
  } else {
    // No active session means email confirmation is required
    return redirect(
      '/confirm?message=Check your email to continue the sign up process',
    );
  }
} 