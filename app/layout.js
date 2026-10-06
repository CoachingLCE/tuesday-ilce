import './globals.css';
import { SessionProvider } from '../lib/useSession';
import { ThemeProvider } from '../lib/ThemeContext';
import VersionBadge from '../components/VersionBadge';
import Nav from '../components/Nav';
import EscCierraModales from '../components/EscCierraModales';
import TablasEnTarjetas from '../components/TablasEnTarjetas';
import { DialogosProvider } from '../components/Dialogos';

export const metadata = {
  metadataBase: new URL('https://tuesday-ilce.vercel.app'),
  title: 'Tuesday ILCE',
  description: 'Tablero de contenidos del equipo ILCE',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/icon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png?v=2'
  },
  openGraph: {
    title: 'Tuesday ILCE',
    description: 'Tablero de contenidos del equipo ILCE',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tuesday ILCE',
    description: 'Tablero de contenidos del equipo ILCE',
    images: ['/og-image.png']
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-text">
        <ThemeProvider>
          <SessionProvider>
            <DialogosProvider>
              <EscCierraModales />
              <TablasEnTarjetas />
              <Nav />
              {children}
              <VersionBadge />
            </DialogosProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
