import Link from "next/link";
import type { ReactNode } from "react";
import { IconArtwork } from "@/lib/brand/icon-artwork";
import { Disclaimer } from "./disclaimer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <IconArtwork size={26} />
            Pocket Mechanic
          </Link>
          <Link href="/garage/add" className="text-sm font-semibold text-accent">
            Add car
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12 pt-5">{children}</main>
      <footer className="mx-auto w-full max-w-md px-4 pb-8">
        <Disclaimer compact />
      </footer>
    </>
  );
}
