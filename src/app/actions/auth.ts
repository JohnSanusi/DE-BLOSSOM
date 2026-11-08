'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface AuthResponse {
  success: boolean;
  error?: string;
  role?: 'member' | 'admin';
}

/**
 * Sign in action with email and password
 */
export async function signInAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch user profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = (profile?.role as 'member' | 'admin') || 'member';

    revalidatePath('/', 'layout');
    return { success: true, role };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication failed' };
  }
}

/**
 * Register a new cooperative member
 */
export async function signUpAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  if (!email || !password || !fullName || !phone) {
    return { success: false, error: 'All fields are required' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    // Auto-login the user directly after registration so no email confirmation step is needed
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      // User created, return success so frontend can redirect them to sign-in
      return { success: true, role: 'member' };
    }

    revalidatePath('/', 'layout');
    return { success: true, role: 'member' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
  redirect('/auth');
}

/**
 * Fetch current authenticated user's profile
 */
export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch {
    return null;
  }
}
