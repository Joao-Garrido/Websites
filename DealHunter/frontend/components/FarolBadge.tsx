import { cn } from "@/lib/cn";
import { FAROL_EMOJI, FAROL_LABEL } from "@/lib/format";
import type { Farol } from "@/lib/types";

const STYLES: Record<string, string> = {
  verde: "bg-green-100 text-green-800 border-green-200",
  amarelo: "bg-amber-100 text-amber-800 border-amber-200",
  vermelho: "bg-red-100 text-red-800 border-red-200",
};

export function FarolBadge({ farol, className }: { farol?: Farol | null; className?: string }) {
  if (!farol) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
      STYLES[farol], className)}>
      {FAROL_EMOJI[farol]} {FAROL_LABEL[farol]}
    </span>
  );
}

export function FarolDot({ farol }: { farol?: Farol | null }) {
  const c = farol === "verde" ? "bg-green-500" : farol === "amarelo" ? "bg-amber-500" : "bg-red-500";
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", c)} />;
}
