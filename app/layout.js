import './globals.css';
import { SessionProvider } from '../lib/useSession';
import { ThemeProvider } from '../lib/ThemeContext';
import VersionBadge from '../components/VersionBadge';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Tuesday ILCE',
  description: 'Tablero de contenidos del equipo ILCE'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-text">
        <ThemeProvider>
          <SessionProvider>
            <Nav />
            {children}
            <VersionBadge />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
