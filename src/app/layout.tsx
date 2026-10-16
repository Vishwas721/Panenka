import type { Metadata } from "next";
import { Big_Shoulders_Display, Instrument_Serif, JetBrains_Mono, Hanken_Grotesk } from "next/font/google";
import { brand } from "@/config/brand";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getTicker } from "@/server/services/insights.service";

const display = Big_Shoulders_Display({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-display" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mono" });
const body = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.tagline,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ticker = await getTicker().catch(() => []);
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${serif.variable} ${mono.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AppShell ticker={ticker}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
