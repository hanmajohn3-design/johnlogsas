import { useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Flame, Home as HomeIcon, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Day } from "@shared/schema";

function calcIntensity(exercises: string[]): number {
  let score = 0;
  for (const ex of exercises) {
    if (ex.toLowerCase().includes("rest")) continue;
    const setsReps = ex.match(/(\d+)\s*[x\u00D7]\s*(\d+)/i);
    if (setsReps) score += parseInt(setsReps[1]) * parseInt(setsReps[2]);
    else score += 10;
    const weight = ex.match(/(\d+)\s*kg/i);
    if (weight) score += parseInt(weight[1]) * 0.5;
  }
  return Math.round(score);
}

interface DayCardProps {
  day: Day;
}

export function DayCard({ day }: DayCardProps) {
  const isPlanned = day.status === "Planned";
  const intensity = day.calorieBurn ?? calcIntensity(day.exercises);
  const [expanded, setExpanded] = useState(day.exercises.length <= 5);
  const isRestDay = day.exercises.every(ex => ex.toLowerCase().includes("rest"));

  const visibleExercises = expanded ? day.exercises : day.exercises.slice(0, 4);
  const hasMore = day.exercises.length > 5;

  return (
    <article
      className={`glass-panel glass-card col-span-12 md:col-span-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(124,92,255,0.15)] relative${isRestDay ? " opacity-60" : ""}`}
      data-testid={`card-day-${day.dayNumber}`}
    >
      <span className="absolute top-2 right-3 text-[48px] font-black text-white/[0.03] pointer-events-none select-none leading-none">{day.dayNumber}</span>
      <div className="p-[14px] pb-[12px] border-b border-white/10 flex items-start justify-between gap-2.5">
        <div className="flex gap-2.5 items-center flex-wrap">
          <h3 className="m-0 text-[15px] tracking-[0.2px] font-bold text-white drop-shadow-sm flex items-center gap-1.5">
            {day.category === "home" ? <HomeIcon size={12} className="text-[#7c5cff]/50" /> : <Dumbbell size={12} className="text-[#38bdf8]/50" />}
            Day {day.dayNumber}
          </h3>
          <span
            data-testid={`badge-status-${day.dayNumber}`}
            className={`text-[11px] px-2.5 py-1.5 rounded-full border whitespace-nowrap font-medium tracking-wide shadow-sm transition-colors duration-300 flex items-center ${
              isPlanned
                ? "bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#fff2d3]"
                : "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#d8ffe4]"
            }`}
          >
            {!isPlanned && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse mr-1" />}
            {day.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/30 font-medium flex items-center gap-1" data-testid={`intensity-${day.dayNumber}`}>
            {isRestDay ? <Moon size={11} className="text-[#a78bfa]" /> : <Flame size={11} className="text-[#f59e0b]" />}
            {intensity} cal
          </span>
          <span className="text-[11px] text-white/20 font-mono">
            {day.exercises.length}ex
          </span>
        </div>
      </div>

      <div className="p-[12px] pt-[14px] grid gap-2.5">
        <div className="bg-[#121b2c]/70 border border-white/10 rounded-[14px] p-3 shadow-inner">
          <h4 className="m-0 mb-2 text-[12px] text-[#dbe4ff] tracking-[0.25px] flex gap-2 items-center font-bold uppercase">
            <Dumbbell size={13} className="text-[#38bdf8]" /> Training
          </h4>
          {day.exercises.length > 0 ? (
            <>
              <ul className="m-0 pl-[18px] text-[#eaf0ff]/90 leading-[1.6] text-[13px] list-disc marker:text-[#38bdf8]/50">
                <AnimatePresence initial={false}>
                  {visibleExercises.map((ex, i) => (
                    <motion.li
                      key={`${day.id}-${i}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="my-1.5 pl-1"
                    >
                      {ex}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {hasMore && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-[11px] text-[#7c5cff] hover:text-[#9b7fff] font-medium flex items-center gap-1 transition-colors"
                  data-testid={`button-expand-${day.dayNumber}`}
                >
                  {expanded ? (
                    <>Show less <ChevronUp size={12} /></>
                  ) : (
                    <>+{day.exercises.length - 4} more <ChevronDown size={12} /></>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-[#a7b3d6] italic mt-2">No exercises logged yet.</p>
          )}
        </div>
      </div>
    </article>
  );
}
