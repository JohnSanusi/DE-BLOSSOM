'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface StorageResult {
  success: boolean;
  filePath?: string;
  url?: string;
  error?: string;
}

/**
 * Uploads a payment receipt to the Supabase Storage 'receipts' bucket
 */
export async function uploadReceiptAction(formData: FormData): Promise<StorageResult> {
  const file = formData.get('file') as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: 'No file provided' };
  }

  // Size limit: 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds maximum limit of 5MB' };
  }

  // Type validation: images or PDF
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, WEBP, or PDF files are accepted' };
  }

  if (!isSupabaseConfigured()) {
    // In mock mode, return an object URL or placeholder
    return {
      success: true,
      filePath: `mock-receipts/${file.name}`,
      url: `/receipt-mock-${file.name}`,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Generate a signed URL valid for 1 hour for secure viewing
    const { data: signedData } = await supabase.storage
      .from('receipts')
      .createSignedUrl(data.path, 3600);

    return {
      success: true,
      filePath: data.path,
      url: signedData?.signedUrl || data.path,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Upload failed' };
  }
}

/**
 * Generate a fresh signed URL for an existing receipt path
 */
export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !path || path.startsWith('/')) {
    return path;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
