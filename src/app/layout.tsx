import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simulateur de défibrillateur",
  description: "Simulateur de défibrillateur médical online pour la formation aux techniques de défibrillation",
  keywords: ["défibrillateur", "simulation", "formation médicale", "urgences", "DAE", "cardioversion"],
  authors: [{ name: "Marius GAL" }, { name: "Dr. Sami Ellouze" }, { name: "Marc Dinh" }],
  
  // Open Graph (Facebook, LinkedIn, Discord, WhatsApp, etc.)
  openGraph: {
    title: "Simulateur de défibrillateur - Formation Médicale",
    description: "Plateforme de formation aux techniques de défibrillation développée pour l'Hôpital Saint-Louis. Scénarios réalistes et apprentissage sécurisé.",
      url: "https://defib-simulation.vercel.app", 
    siteName: "Simulateur de défibrillateur",
    images: [
      {
        url: "/images/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Interface du simulateur de défibrillateur - Formation médicale"
      }
    ],
    locale: "fr_FR",
    type: "website"
  },
  
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Simulateur de défibrillateur",
    description: "Formation aux techniques de défibrillation - Hôpital Saint-Louis",
    images: ["/images/og-image.png"],
  },
  
  // Métadonnées supplémentaires
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Métadonnées pour les appareils mobiles
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  
  // Données structurées pour le SEO
  other: {
    "application-name": "Simulateur de défibrillateur",
    "msapplication-TileColor": "#1f2937",
    "theme-color": "#1f2937"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        {/* Preconnect pour optimiser les performances */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}