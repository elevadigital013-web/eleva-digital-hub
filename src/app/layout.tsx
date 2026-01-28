import type { Metadata, Viewport } from "next"; // Adicionei Viewport aqui
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A cor do tema (barra de status do celular) fica aqui agora
export const viewport: Viewport = {
  themeColor: "#0f172a", // O azul escuro da Eleva
};

// O Manifesto e o ícone do iPhone ficam aqui dentro
export const metadata: Metadata = {
  title: "Eleva Digital | Sales Hub",
  description: "Painel de gestão de leads e comissões",
  manifest: "/manifest.json", 
  icons: {
    apple: "/icons/icon-192x192.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f172a]`}
        suppressHydrationWarning
      >
        {children}

        {/* Script do Service Worker para o PWA funcionar */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </body>
    </html>
  );
}