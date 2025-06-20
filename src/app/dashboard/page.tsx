/**
 * @file The primary dashboard page with Grammarly-style design featuring
 * rich document cards, search functionality, and improved UX.
 */
import {
  createDocument,
} from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/server';
import { Plus, FileText, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DocumentActions } from './document-actions';

/**
 * Helper function to format dates in a user-friendly way
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Helper function to group documents by date
 */
function groupDocumentsByDate(documents: any[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const groups = {
    today: [] as any[],
    yesterday: [] as any[],
    earlier: [] as any[]
  };

  documents.forEach(doc => {
    const docDate = new Date(doc.created_at);
    const docDateString = docDate.toDateString();
    
    if (docDateString === today.toDateString()) {
      groups.today.push(doc);
    } else if (docDateString === yesterday.toDateString()) {
      groups.yesterday.push(doc);
    } else {
      groups.earlier.push(doc);
    }
  });

  return groups;
}

/**
 * Document card component with rich preview
 */
function DocumentCard({ document }: { document: any }) {
  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/editor/${document.id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {document.title || 'Untitled Document'}
            </h3>
          </Link>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatDate(document.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DocumentActions documentId={document.id} />
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Document preview/content snippet */}
        <div className="text-sm text-gray-600 line-clamp-3">
          {document.preview_text || "Click to start writing your essay. Use our AI-powered suggestions to improve your academic voice, strengthen your arguments, and enhance your writing."}
        </div>
        
        {/* Document metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {document.word_count || 0} words
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Created {formatDate(document.created_at)}
            </span>
          </div>
          {document.status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              document.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {document.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Document group section
 */
function DocumentGroup({ title, documents }: { title: string; documents: any[] }) {
  if (documents.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the main dashboard page with Grammarly-style design.
 */
export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=You must be logged in to view this page');
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, created_at, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  // Process documents to add preview text and word count
  const processedDocuments = (documents || []).map(doc => {
    // Handle content which is stored as JSONB in the database
    let textContent = '';
    if (doc.content) {
      try {
        // If content is a JSON object (from TipTap editor), extract text
        if (typeof doc.content === 'object' && doc.content.content) {
          // Extract text from TipTap JSON structure
          const extractText = (nodes: any[]): string => {
            return nodes.map(node => {
              if (node.type === 'text') return node.text || '';
              if (node.content) return extractText(node.content);
              return '';
            }).join(' ');
          };
          textContent = extractText(doc.content.content || []);
        } else if (typeof doc.content === 'string') {
          textContent = doc.content;
        }
      } catch (error) {
        console.error('Error processing document content:', error);
        textContent = '';
      }
    }

    return {
      ...doc,
      preview_text: textContent ? textContent.substring(0, 150) + '...' : null,
      word_count: textContent ? textContent.split(/\s+/).filter(word => word.length > 0).length : 0,
    };
  });

  const groupedDocuments = groupDocumentsByDate(processedDocuments);

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <div className="flex items-center space-x-4">
              <form action={createDocument}>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New document
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-8 py-6">
        {processedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get started by creating your first document. Use our AI-powered tools to elevate your academic writing.
            </p>
            <form action={createDocument}>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create your first document
              </Button>
            </form>
          </div>
        ) : (
          <div>
            <DocumentGroup title="Today" documents={groupedDocuments.today} />
            <DocumentGroup title="Yesterday" documents={groupedDocuments.yesterday} />
            <DocumentGroup title="Earlier" documents={groupedDocuments.earlier} />
          </div>
        )}
      </div>
    </div>
  );
} 