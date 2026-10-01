"use client";

import { useState } from "react";

type Item = { id: string; label: string };

export function QuickSectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);

  return (
    <nav
      aria-label="Навигация по странице"
      className="-mt-5 overflow-x-auto pb-2 [scrollbar-width:thin] sm:-mt-7"
    >
      <div className="flex min-w-max gap-2 rounded-2xl border border-[var(--border)] bg-white/[.025] p-1.5">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            onClick={() => setActive(item.id)}
            className={`interactive rounded-xl px-3.5 py-2 text-sm font-medium transition ${active === item.id ? "bg-emerald-300/10 text-emerald-100" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-200"}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
