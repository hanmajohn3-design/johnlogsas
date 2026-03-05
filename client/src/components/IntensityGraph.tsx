import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Day } from "@shared/schema";

function calcIntensity(exercises: string[]): number {
  let score = 0;
  for (const ex of exercises) {
    const lower = ex.toLowerCase();
    if (lower.includes("rest")) continue;
    const setsReps = ex.match(/(\d+)\s*[x\u00D7]\s*(\d+)/i);
    if (setsReps) {
      score += parseInt(setsReps[1]) * parseInt(setsReps[2]);
    } else {
      score += 10;
    }
    const weight = ex.match(/(\d+)\s*kg/i);
    if (weight) {
      score += parseInt(weight[1]) * 0.5;
    }
  }
  return Math.round(score);
}

interface IntensityGraphProps {
  days: Day[];
  category: string;
}

export function IntensityGraph({ days, category }: IntensityGraphProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  const intensities = sorted.map(d => ({
    day: d.dayNumber,
    intensity: d.calorieBurn != null ? d.calorieBurn : calcIntensity(d.exercises),
    status: d.status,
    exercises: d.exercises.length,
  }));
  const maxIntensity = Math.max(...intensities.map(d => d.intensity), 1);
  const avgIntensity = Math.round(intensities.reduce((sum, d) => sum + d.intensity, 0) / intensities.length);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => { if (el) el.removeEventListener("scroll", checkScroll); };
  }, [days]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const accentColor = category === "home" ? "#7c5cff" : "#38bdf8";
  const accentGlow = category === "home" ? "rgba(124,92,255,0.3)" : "rgba(56,189,248,0.3)";

  return (
    <div className="glass-panel p-4 mb-5" data-testid="intensity-graph">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-bold text-white/90 flex items-center gap-2 uppercase tracking-wider">
          <TrendingUp size={16} style={{ color: accentColor }} />
          Calorie Burn
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-medium">
            avg: {avgIntensity}
          </span>
          <div className="flex gap-1">
            {canScrollLeft && (
              <button onClick={() => scroll("left")} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors" data-testid="button-scroll-left">
                <ChevronLeft size={16} className="text-white/70" />
              </button>
            )}
            {canScrollRight && (
              <button onClick={() => scroll("right")} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors" data-testid="button-scroll-right">
                <ChevronRight size={16} className="text-white/70" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {intensities.map(({ day, intensity, status, exercises }, i) => {
          const height = Math.max(8, (intensity / maxIntensity) * 120);
          const isPlanned = status === "Planned";
          const isHovered = hoveredDay === day;
          return (
            <div
              key={day}
              className="flex flex-col items-center gap-1.5 min-w-[44px] relative"
              data-testid={`bar-day-${day}`}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap z-10"
                  style={{
                    background: "rgba(15, 22, 36, 0.95)",
                    border: `1px solid ${accentColor}40`,
                    boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
                    color: "white",
                  }}
                >
                  <span style={{ color: accentColor }}>{intensity}</span> cal &middot; {exercises} ex
                </motion.div>
              )}
              <div className="w-8 rounded-t-md relative" style={{ height: 120 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease: [0.25, 0.25, 0, 1] }}
                  className="absolute bottom-0 w-full rounded-t-md"
                  style={{
                    background: isPlanned
                      ? `linear-gradient(to top, rgba(245,158,11,0.4), rgba(245,158,11,0.15))`
                      : `linear-gradient(to top, ${accentColor}, ${accentColor}44)`,
                    boxShadow: isPlanned ? "none" : `0 0 12px ${accentGlow}`,
                    border: isPlanned ? "1px dashed rgba(245,158,11,0.4)" : "none",
                    transform: isHovered ? "scaleX(1.15)" : "scaleX(1)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              <span className={`text-[11px] font-semibold transition-colors duration-200 ${isHovered ? "text-white" : "text-white/70"}`}>
                D{day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
