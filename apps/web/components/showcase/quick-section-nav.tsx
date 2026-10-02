"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export function QuickSectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    const list = ids.split(",").filter(Boolean);
    if (list.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = 140;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        current = list[list.length - 1];
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  const isActive = (id: string) => active === id;
  const handle = (id: string) => () => setActive(id);

  return (
    <>
      <nav
        aria-label="Навигация по странице"
        className="-mt-5 overflow-x-auto pb-2 [scrollbar-width:thin] sm:-mt-7 xl:hidden"
      >
        <div className="flex min-w-max gap-2 rounded-2xl border border-[var(--border)] bg-white/[.025] p-1.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive(item.id) ? "location" : undefined}
              onClick={handle(item.id)}
              className={`interactive rounded-xl px-3.5 py-2 text-sm font-medium transition ${isActive(item.id) ? "bg-emerald-300/10 text-emerald-100" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-200"}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
      <nav
        aria-label="Навигация по странице"
        className="pointer-events-none fixed top-1/2 z-20 hidden -translate-y-1/2 xl:block"
        style={{ right: "max(1.5rem, calc((100vw - 1784px) / 2 + 1.5rem))" }}
      >
        <ul className="pointer-events-auto flex w-[172px] flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--canvas)]/85 p-1.5 shadow-[0_28px_64px_-40px_rgba(0,0,0,.95)] backdrop-blur-xl">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive(item.id) ? "location" : undefined}
                onClick={handle(item.id)}
                className={`interactive flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition ${isActive(item.id) ? "bg-emerald-300/10 text-emerald-100" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-200"}`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full transition ${isActive(item.id) ? "bg-emerald-300" : "bg-slate-600"}`}
                />
                <span className="min-w-0 truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
