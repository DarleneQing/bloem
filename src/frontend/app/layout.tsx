import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";

const gordita = localFont({
  src: [
    {
      path: "../../assets/fonts/Gordita-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Gordita-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Gordita-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Gordita-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-gordita",
});

const lexend = localFont({
  src: "../../assets/fonts/Lexend Deca-Medium.ttf",
  weight: "500",
  style: "normal",
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "bloem - Circular Fashion Marketplace",
  description: "Digital solution of flea markets for second-hand clothing",
  openGraph: {
    title: "bloem - Circular Fashion Marketplace",
    description: "Digital solution of flea markets for second-hand clothing",
    siteName: "bloem",
    type: "website",
    images: [
      {
        url: "/assets/images/opengraph.png",
        width: 1731,
        height: 909,
        alt: "bloem - Circular Fashion Marketplace",
      },
    ],
  },
  icons: {
    icon: "/assets/images/logo-transparent.png",
    shortcut: "/assets/images/logo-transparent.png",
    apple: "/assets/images/logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gordita.variable} ${lexend.variable} font-gordita antialiased`}>
        {children}
        <Toaster />
        <SpeedInsights/>
      </body>
    </html>
  );
}

