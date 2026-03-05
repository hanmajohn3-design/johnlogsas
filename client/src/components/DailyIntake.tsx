import { Pill, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const DEFAULT_SUPPLEMENTS = [
  { id: 0, name: "Creatine", amount: "5g", color: "#7c5cff" },
  { id: 1, name: "Whey", amount: "132g (33g = 50g of protein)", color: "#38bdf8" },
  { id: 2, name: "Caffeine", amount: "700mg", color: "#f59e0b" },
  { id: 3, name: "L-Citrulline", amount: "8,000 mg", color: "#22c55e" },
  { id: 4, name: "Beta-Alanine", amount: "3,200 mg", color: "#ec4899" },
  { id: 5, name: "L-Theanine", amount: "400 mg", color: "#a78bfa" },
  { id: 6, name: "Dicaffeine Malate", amount: "300 mg", color: "#f97316" },
  { id: 7, name: "BioPerine (Piperine 50:1)", amount: "4.8 mg", color: "#14b8a6" },
  { id: 8, name: "Capsaicine", amount: "3 mg", color: "#ef4444" },
  { id: 9, name: "Neurocore Secret Blend", amount: "5,523 mg", color: "#8b5cf6" },
];

export function DailyIntake() {
  const { data: supplements, isLoading } = useQuery<any[]>({
    queryKey: ["/api/supplements"],
    staleTime: 30000,
  });

  const items = supplements && supplements.length > 0 ? supplements : DEFAULT_SUPPLEMENTS;

  return (
    <div className="glass-panel p-4 mb-5" data-testid="daily-intake">
      <h3 className="text-sm font-bold text-white/90 flex items-center gap-2 uppercase tracking-wider mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center"><Pill size={13} className="text-[#22c55e]" /></div>
        Daily Intake
        <span className="text-[10px] font-normal normal-case tracking-normal text-white/30 ml-auto">
          {items.length} supplements
        </span>
        {isLoading && <Loader2 size={12} className="animate-spin text-white/40" />}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((s: any, i: number) => (
          <motion.div
            key={s.id ?? s.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06] group hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
            data-testid={`supplement-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-125"
                style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}44` }}
              />
              <span className="text-[13px] text-white/85 font-medium">{s.name}</span>
            </div>
            <span className="text-[12px] text-white/50 font-mono whitespace-nowrap">{s.amount}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
