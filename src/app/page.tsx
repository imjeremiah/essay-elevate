/**
 * @file The landing page for the application.
 * It serves as the main entry point and marketing page.
 */
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: messages } = await supabase.from('messages').select()

  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold font-serif'>EssayElevate</h1>
      <p className='mt-4 text-lg text-foreground-muted'>
        {messages?.[0]?.text || 'Could not connect to the database.'}
      </p>
    </div>
  )
}
