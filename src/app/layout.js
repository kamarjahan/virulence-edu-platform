import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// 1. SEO & SOCIAL SHARE SETTINGS
export const metadata = {
  title: 'Virulence Education Centre | Kerala\'s Premier Medical Institute',
  description: 'Join the best online coaching for NEET, KEAM, and Plus Two Science. Live interactive classes, expert faculty, and 100% results-oriented training.',
  keywords: ['NEET Coaching Kerala', 'Online Tuition', 'Medical Entrance', '12th Science', 'Virulence Education'],
  authors: [{ name: 'Virulence Team' }],
  metadataBase: new URL('https://virulence.jachu.xyz'), // Your actual domain
  
  // FAVICON (Browser Tab Icon)
  icons: {
    icon: 'https://i.ibb.co/LD1qy86k/VIRULENCE-removebg-preview.png', // Replace this with your Logo URL from ImgBB
    apple: 'https://i.ibb.co/LD1qy86k/VIRULENCE-removebg-preview.png',
  },

  // WHATSAPP / FACEBOOK SHARE CARD
  openGraph: {
    title: 'Virulence Digital Campus - Master Science & NEET',
    description: 'Admissions open for 2025 Batches. Learn from the best doctors and professors online.',
    url: 'https://virulence.jachu.xyz',
    siteName: 'Virulence Education',
    images: [
      {
        url: 'https://placehold.co/1200x630/0f766e/ffffff.png?text=Virulence+Education+Centre', // Replace with a Banner Image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'Virulence Education Campus',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // TWITTER SHARE CARD
  twitter: {
    card: 'summary_large_image',
    title: 'Virulence Education Centre',
    description: 'Kerala\'s No.1 Online Medical Entrance Institute.',
    images: ['https://placehold.co/1200x630/0f766e/ffffff.png?text=Virulence+Education+Centre'], // Replace with Banner
  },
};

// 2. MOBILE BROWSER THEME COLOR
export const viewport = {
  themeColor: '#0f766e', // Matches your Medical Teal brand
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased selection:bg-teal-200 selection:text-teal-900`}>
        {children}
      </body>
    </html>
  );
}