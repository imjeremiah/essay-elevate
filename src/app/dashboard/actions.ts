'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Signs the user out and redirects to the login page.
 */
export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    return redirect('/dashboard?message=Could not log out');
  }

  return redirect('/login');
}

/**
 * Creates a new document for the current user and redirects to the editor page.
 */
export async function createDocument() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This should not be possible if the page is protected by middleware
    return redirect('/login');
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title: 'Untitled Document',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating document:', error);
    return redirect('/dashboard?message=Could not create document');
  }

  return redirect(`/editor/${data.id}`);
}

/**
 * Deletes a document by its ID.
 * After deletion, it revalidates the dashboard path to refresh the list of documents.
 * @param documentId The ID of the document to delete.
 */
export async function deleteDocument(documentId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Verify the user owns the document before deleting
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting document:', deleteError);
    return redirect('/dashboard?message=Could not delete document');
  }

  revalidatePath('/dashboard');
}

/**
 * Renames a document by its ID.
 * After renaming, it revalidates the dashboard path to refresh the list of documents.
 * @param documentId The ID of the document to rename.
 * @param newTitle The new title for the document.
 */
export async function renameDocument(
  documentId: string,
  newTitle: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This isn't strictly necessary due to RLS, but it's a good practice
    // to have this check here as a quick exit path.
    return { error: 'You must be logged in to rename a document.' };
  }

  if (!newTitle.trim()) {
    return { error: 'Title cannot be empty.' };
  }

  // Verify the user owns the document before renaming
  const { error } = await supabase
    .from('documents')
    .update({ title: newTitle.trim() })
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error renaming document:', error);
    // In a real app, you would want to handle this error more gracefully
    return { error: 'Could not rename document. Please try again.' };
  }

  revalidatePath('/dashboard');
  return { error: null };
}