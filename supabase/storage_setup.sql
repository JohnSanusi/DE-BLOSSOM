-- ============================================================================
-- DE-BLOSSOM: Supabase Storage Setup for Payment Receipts
-- Run this in your Supabase SQL Editor to configure the receipts bucket & policies
-- ============================================================================

-- 1. Create a private bucket for member payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated members to upload receipts into their own folder ({user_id}/*)
DROP POLICY IF EXISTS "Members can upload receipts to their folder" ON storage.objects;
CREATE POLICY "Members can upload receipts to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow members to view their own uploaded receipts
DROP POLICY IF EXISTS "Members can view their own receipts" ON storage.objects;
CREATE POLICY "Members can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow cooperative administrators to view all uploaded receipts for reconciliation
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
