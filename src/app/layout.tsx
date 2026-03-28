import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PulseRoute — Transit Demand Intelligence',
  description:
    'Real-time latent transit demand modeling for underserved corridors. Break the data trap that cuts service to communities that need it most.',
  keywords: ['transit', 'demand modeling', 'equity', 'urban planning', 'MARTA'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
