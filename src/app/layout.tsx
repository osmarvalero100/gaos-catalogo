import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Generador de Catálogos de Velas Artesanales | GAOS CANDLES',
  description: 'Crea, personaliza y exporta catálogos profesionales para tus velas y productos artesanales por temporadas (Navidad, San Valentín, Día de la Madre). Con soporte PDF y URL compartible.',
  icons: {
    icon: '/gaos-candles.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-stone-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
