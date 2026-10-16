import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold font-display">{brand.wordmark}</h1>
      <p className="mt-2 text-muted-foreground">{brand.tagline}</p>
    </main>
  );
}
