import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import DianaOverlay from '@/components/DianaOverlay';
import { ThemeProvider } from '@/hooks/useTheme';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  title: 'Integra | Gestão Inteligente de Panificação',
  description:
    'Sistema inteligente de gestão para panificadoras, com foco na redução de desperdício alimentar através de IA preditiva e monitoramento em tempo real.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} data-theme="dark">
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
            <DianaOverlay />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
