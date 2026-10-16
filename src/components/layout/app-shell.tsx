"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route navigation
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Handle escape key and lock body scroll when mobile drawer is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    if (mobileNavOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================= Desktop Persistent Sidebar ================= */}
      <aside
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col border-r border-border bg-card shadow-xs"
        aria-label="Desktop Sidebar Navigation"
      >
        <Sidebar />
      </aside>

      {/* ================= Mobile Navigation Drawer ================= */}
      {mobileNavOpen && (
        <div className="relative z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer top close action */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="font-display text-base font-black tracking-widest text-foreground">
                {brand.wordmark}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Sidebar content within drawer */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ================= Main Application Layout Area ================= */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Sticky Content Header */}
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
