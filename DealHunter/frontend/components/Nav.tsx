"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Bell, Building2, GitCompare, Home, Map, Search, Settings, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/morar", label: "Morar", icon: Building2 },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/perfis", label: "Perfis", icon: Search },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/comparar", label: "Comparar", icon: GitCompare },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/premissas", label: "Premissas", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const [naoLidos, setNaoLidos] = useState(0);

  useEffect(() => {
    api.contagemAlertas().then((r) => setNaoLidos(r.nao_lidos)).catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2.5">
        <Link href="/" className="mr-4 flex items-center gap-2 font-bold">
          <Activity className="h-5 w-5" /> DealHunter
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn("relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
                <Icon className="h-4 w-4" /> {label}
                {href === "/alertas" && naoLidos > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {naoLidos}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
