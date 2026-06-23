import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast-provider'
import { SiteHeader } from '@/components/ui/site-header'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nihongo Pro - Japanese Exam Platform',
  description: 'A premium full-stack platform for Japanese language learning, dynamic vocabulary image scanning, and secure examinations.',
  keywords: ['Japanese', 'exam', 'vocabulary', 'learning', 'Nihongo', 'Bangla'],
  authors: [{ name: 'Nihongo Pro' }],
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nihongo Pro',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <ToastProvider />
      </body>
    </html>
  )
}