/**
 * @file This file defines the server component for the editor page.
 * It is responsible for fetching the document data from the server,
 * ensuring the user has access, and then passing the data to the
 * client-side editor component.
 */
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EditorClient } from './editor-client';

interface EditorPageProps {
  params: { documentId: string };
}

/**
 * Renders the editor page for a specific document.
 * This server component fetches the document and handles authorization.
 *
 * @param {EditorPageProps} props - The component props, including the document ID.
 * @returns The rendered editor page or a redirect/404 page.
 */
export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = createClient();
  const { documentId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?message=You must be logged in to edit a document`);
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single();

  if (error || !document) {
    // If the query returns an error or no document, the user either
    // does not own this document or it does not exist.
    // In either case, we show a 404 page.
    return notFound();
  }

  return <EditorClient initialDocument={document} />;
}