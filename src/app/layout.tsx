import { Inter, Lora } from 'next/font/google';
import { cn } from '@/lib/utils';
import '../styles/globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'EssayElevate - AI-Powered Writing Assistant',
  description: 'Transform your writing with AI-powered assistance for academic essays, thesis development, and argument sophistication.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable,
        fontSerif.variable
      )}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <main className="flex flex-col items-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
