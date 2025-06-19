/**
 * @file The primary dashboard page, which is displayed after a user successfully
 * logs in. This page is protected by middleware and is responsible for
 * fetching and displaying the user's documents.
 */
import {
  logout,
  createDocument,
} from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { CircleUser } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DocumentActions } from './document-actions';

/**
 * Renders the main dashboard page.
 * It fetches the user's documents from Supabase and displays them in a table.
 * It also provides options to create new documents and log out.
 *
 * @returns The rendered dashboard page component.
 */
export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This should be handled by middleware, but it's a good practice
    // to have a safeguard here.
    return redirect('/login?message=You must be logged in to view this page');
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    // In a real application, you'd want to show a toast or a more
    // user-friendly error message here.
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <form action={createDocument} className="flex-1 md:flex-initial">
            <Button type="submit">+ New Document</Button>
          </form>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button type="submit" className="w-full text-left">
                  Logout
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              A list of all the documents you have created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created At
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents && documents.length > 0 ? (
                  documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <Link href={`/editor/${doc.id}`} className="hover:underline">
                          {doc.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DocumentActions documentId={doc.id} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center"
                    >
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 