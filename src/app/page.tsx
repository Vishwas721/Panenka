import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold font-display tracking-tight">{brand.wordmark}</h1>
      <p className="mt-2 text-muted-foreground text-sm">{brand.tagline}</p>
    </div>
  );
}
