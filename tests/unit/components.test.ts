import { describe, it, expect } from "vitest";
import { buttonVariants } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";
import { THEMES, ThemeSwitcher } from "@/components/theme/theme-switcher";
import { ThemeProvider, THEMES as PROVIDER_THEMES } from "@/components/theme/theme-provider";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

describe("Theme Management", () => {
  it("provides floodlight and programme themes", () => {
    expect(PROVIDER_THEMES).toEqual(["floodlight", "programme"]);
    expect(ThemeProvider).toBeDefined();
  });

  it("theme switcher metadata matches provider themes", () => {
    expect(THEMES.map((t) => t.id)).toEqual(["floodlight", "programme"]);
    for (const t of THEMES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.accentColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("ThemeSwitcher component is defined", () => {
    expect(ThemeSwitcher).toBeDefined();
  });
});

describe("Button UI Component", () => {
  it("generates correct classes for all variants", () => {
    expect(buttonVariants({ variant: "default" })).toContain("bg-primary");
    expect(buttonVariants({ variant: "destructive" })).toContain("bg-destructive");
    expect(buttonVariants({ variant: "outline" })).toContain("border");
    expect(buttonVariants({ variant: "secondary" })).toContain("bg-secondary");
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-secondary");
    expect(buttonVariants({ variant: "link" })).toContain("underline-offset-4");
  });

  it("generates correct classes for all sizes", () => {
    expect(buttonVariants({ size: "default" })).toContain("h-9");
    expect(buttonVariants({ size: "sm" })).toContain("h-8");
    expect(buttonVariants({ size: "lg" })).toContain("h-10");
    expect(buttonVariants({ size: "icon" })).toContain("h-9 w-9");
  });
});

describe("Input UI Component", () => {
  it("exports Input component", () => {
    expect(Input).toBeDefined();
  });
});

describe("Badge UI Component", () => {
  it("generates classes for default, secondary, destructive, outline", () => {
    expect(badgeVariants({ variant: "default" })).toContain("bg-primary");
    expect(badgeVariants({ variant: "secondary" })).toContain("bg-secondary");
    expect(badgeVariants({ variant: "destructive" })).toContain("bg-destructive");
    expect(badgeVariants({ variant: "outline" })).toContain("text-foreground");
  });

  it("generates classes for statistical variants: goals, assists, contributions", () => {
    const goalsClass = badgeVariants({ variant: "goals" });
    expect(goalsClass).toContain("bg-goals/20");
    expect(goalsClass).toContain("text-goals");

    const assistsClass = badgeVariants({ variant: "assists" });
    expect(assistsClass).toContain("bg-assists/20");
    expect(assistsClass).toContain("text-assists");

    const contribClass = badgeVariants({ variant: "contributions" });
    expect(contribClass).toContain("bg-contributions/20");
    expect(contribClass).toContain("text-contributions");
  });
});

describe("Dialog UI Components", () => {
  it("exports all Radix Dialog wrapper components", () => {
    expect(Dialog).toBeDefined();
    expect(DialogTrigger).toBeDefined();
    expect(DialogContent).toBeDefined();
    expect(DialogHeader).toBeDefined();
    expect(DialogTitle).toBeDefined();
    expect(DialogDescription).toBeDefined();
    expect(DialogFooter).toBeDefined();
    expect(DialogClose).toBeDefined();
  });
});

describe("Select UI Components", () => {
  it("exports all Radix Select wrapper components", () => {
    expect(Select).toBeDefined();
    expect(SelectTrigger).toBeDefined();
    expect(SelectValue).toBeDefined();
    expect(SelectContent).toBeDefined();
    expect(SelectItem).toBeDefined();
  });
});

describe("Table UI Components", () => {
  it("exports all Table wrapper components", () => {
    expect(Table).toBeDefined();
    expect(TableHeader).toBeDefined();
    expect(TableBody).toBeDefined();
    expect(TableFooter).toBeDefined();
    expect(TableHead).toBeDefined();
    expect(TableRow).toBeDefined();
    expect(TableCell).toBeDefined();
    expect(TableCaption).toBeDefined();
  });
});
