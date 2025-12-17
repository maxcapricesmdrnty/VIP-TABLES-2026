import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'VIP Table Management',
  description: 'Application de gestion de tables VIP pour événements',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
