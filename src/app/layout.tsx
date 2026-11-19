import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Armenian } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const armenian = Noto_Sans_Armenian({ variable: "--font-armenian", subsets: ["armenian"] });

export const metadata: Metadata = {
  title: { default: "Armenkyo", template: "%s · Armenkyo" },
  description: "Apprendre l'alphabet arménien : lecture, écriture et révisions espacées.",
  applicationName: "Armenkyo",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#141110" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${armenian.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:pb-10 md:pt-8">{children}</main>
      </body>
    </html>
  );
}
