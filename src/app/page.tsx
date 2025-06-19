/**
 * @file This is the main landing page for the application. It is visible
 * to everyone, including unauthenticated users. It serves as the entry
 * point and should provide a brief overview of the application and encourage
 * users to sign up or log in.
 */
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

/**
 * Renders the home page of the application.
 *
 * This server component fetches a test message from the Supabase database to
 * verify the connection and displays it. It also includes calls to action
for users to either log in or sign up.
 *
 * @returns The main landing page component.
 */
export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.from('messages').select('text').single();
  const message = data?.text || 'Could not connect to the database.';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
        <h1 className="text-6xl font-bold">EssayElevate</h1>
        <p className="mt-3 text-2xl">
          Your AI-powered writing assistant.
        </p>

        <div className="mt-8 p-4 bg-muted rounded-lg border">
          <p className="text-lg">
            <strong>Connection Test:</strong> {message}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/login" passHref>
            <Button variant="default" size="lg">
              Login
            </Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="outline" size="lg" className="mt-4 sm:mt-0 sm:ml-4">
              Sign Up
            </Button>
          </Link>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p>
          &copy; {new Date().getFullYear()} EssayElevate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}