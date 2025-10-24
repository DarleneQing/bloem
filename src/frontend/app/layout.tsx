import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "bloem - Circular Fashion Marketplace",
  description: "Digital solution of flea markets for second-hand clothing",
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
      </body>
    </html>
  );
}

