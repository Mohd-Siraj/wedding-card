"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Details" },
  { href: "/events", label: "Events" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Payments & privacy" },
  { href: "/guests", label: "RSVPs" },
  { href: "/contributions", label: "Contributions" },
  { href: "/share", label: "Publish & share" },
];

export function EditorTabs({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${weddingId}`;
  return (
    <nav className="-mx-4 overflow-x-auto px-4" aria-label="Invite sections">
      <ul className="flex min-w-max gap-1 border-b border-zinc-200">
        {TABS.map((t) => {
          const href = base + t.href;
          const active = pathname === href;
          return (
            <li key={t.href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-2 px-3 py-2.5 text-sm font-medium ${
                  active ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
