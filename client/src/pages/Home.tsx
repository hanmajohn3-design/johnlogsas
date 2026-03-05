import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Home as HomeIcon, Dumbbell, Trophy, Flame, Calendar, TrendingUp, ChevronRight } from "lucide-react";
import { useDays } from "../hooks/use-days";
import { DayCard } from "../components/DayCard";
import { IntensityGraph } from "../components/IntensityGraph";
import { DailyIntake } from "../components/DailyIntake";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.25, 0, 1] } },
};

export default function HomePage() {
  const [category, setCategory] = useState<"home" | "gym">("home");
  const { data: days, isLoading, isError } = useDays(category);

  const sortedDays = days ? [...days].sort((a, b) => a.dayNumber - b.dayNumber) : [];

  const highestDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].dayNumber : 0;
  const totalExercises = sortedDays.reduce((sum, d) => sum + d.exercises.length, 0);
  const totalCalorieBurn = sortedDays.reduce((sum, d) => sum + (d.calorieBurn ?? 0), 0);
  const loggedDays = sortedDays.filter(d => d.status === "Logged").length;

  const streak = (() => { let s = 0; for (let i = sortedDays.length - 1; i >= 0; i--) { if (sortedDays[i].status === "Logged") s++; else break; } return s; })();

  const totalWeight = category === "gym" ? sortedDays.reduce((sum, d) => {
    return sum + d.exercises.reduce((s: number, ex: string) => {
      const match = ex.match(/(\d+)\s*kg/i);
      return s + (match ? parseInt(match[1]) : 0);
    }, 0);
  }, 0) : 0;

  const stats = [
    { label: "Days", value: highestDay, icon: Calendar, color: "#7c5cff", description: "Highest day number reached" },
    { label: "Logged", value: loggedDays, icon: Trophy, color: "#22c55e", description: "Workouts completed" },
    { label: "Exercises", value: totalExercises, icon: Dumbbell, color: "#38bdf8", description: "Total exercises logged" },
    { label: "Cal Burn", value: totalCalorieBurn, icon: Flame, color: "#f59e0b", description: "Total estimated calories burned" },
    ...(category === "gym" ? [{ label: "Weight", value: totalWeight, icon: TrendingUp, color: "#ec4899", description: "Total weight in exercises" }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.25, 0, 1] }}
        className="mb-6"
      >
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7c5cff]/10 via-transparent to-[#38bdf8]/10 pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="m-0 text-[clamp(18px,2.3vw,26px)] tracking-[0.2px] flex gap-3 items-center drop-shadow-md">
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                >
                  <Zap size={24} className="text-[#7c5cff]" />
                </motion.span>
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-extrabold">
                  John's Lock-In Logs
                </span>
              </h1>
              <p className="text-[11px] text-white/30 font-medium mt-1">{getGreeting()}, John</p>
            </div>
            <div className="flex items-center gap-2">
              {streak > 1 && <span className="text-[10px] px-2 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#fbbf24] font-medium flex items-center gap-1"><Flame size={10} />{streak} day streak</span>}
              <span className="text-[11px] px-3 py-1.5 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac] whitespace-nowrap font-medium tracking-wide flex items-center gap-1.5 animate-pulse-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                AI Connected
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex gap-2 mb-5"
        data-testid="category-toggle"
      >
        {(["home", "gym"] as const).map((cat) => {
          const isActive = category === cat;
          const color = cat === "home" ? "#7c5cff" : "#38bdf8";
          const Icon = cat === "home" ? HomeIcon : Dumbbell;
          return (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`button-${cat}-workout`}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 border relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-b from-[${color}]/30 to-[${color}]/10 border-[${color}]/40 text-white`
                  : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
              }`}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              style={isActive ? { boxShadow: `0 0 25px ${color}33`, borderColor: `${color}66` } : {}}
            >
              {isActive && (
                <motion.div
                  layoutId="categoryIndicator"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(180deg, ${color}20, ${color}08)`,
                    border: `1px solid ${color}40`,
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <Icon size={18} />
                {cat === "home" ? "Home Workout" : "Gym Workout"}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {!isLoading && !isError && sortedDays.length > 0 && (
          <motion.div
            key={`stats-${category}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`grid grid-cols-2 ${category === "gym" ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-2.5 mb-5`}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-panel p-3.5 flex items-center gap-3 group hover:-translate-y-0.5 transition-transform duration-300"
                title={stat.description}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-[18px] font-extrabold m-0 leading-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {typeof stat.value === "number" ? <AnimatedNumber value={stat.value} /> : stat.value}
                  </p>
                  <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider m-0">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isLoading && !isError && sortedDays.length > 0 && (
          <motion.div
            key={`graph-${category}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <IntensityGraph days={sortedDays} category={category} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {category === "home" && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DailyIntake />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 flex-wrap mb-5 items-center"
        aria-label="Legend"
      >
        <span className="rounded-full px-3 py-2 border border-white/10 bg-[#0f1624]/80 text-[#eaf0ff] text-xs inline-flex gap-2 items-center shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" />
          Logged
        </span>
        <span className="rounded-full px-3 py-2 border border-white/10 bg-[#0f1624]/80 text-[#eaf0ff] text-xs inline-flex gap-2 items-center shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_0_4px_rgba(245,158,11,0.14)]" />
          Planned
        </span>
        <span className="rounded-full px-3 py-2 border border-white/10 bg-[#0f1624]/80 text-[#eaf0ff] text-xs inline-flex gap-2 items-center shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm font-medium ml-auto">
          <TrendingUp size={12} className="text-[#7c5cff]" />
          {sortedDays.length} total entries
        </span>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#7c5cff]/20 to-transparent my-5" />

      <section aria-label="Workout timeline" data-testid="workout-timeline">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-[#a7b3d6]"
            >
              <div className="relative">
                <Activity className="animate-pulse mb-4 text-[#7c5cff]" size={40} />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ background: "radial-gradient(circle, rgba(124,92,255,0.3), transparent)" }}
                />
              </div>
              <p className="font-medium tracking-wide">Loading your logs...</p>
              <div className="grid grid-cols-12 gap-4 mt-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="col-span-12 md:col-span-6 glass-panel p-4 animate-shimmer h-[200px] rounded-2xl" />
                ))}
              </div>
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-8 text-center border-red-500/20 bg-red-500/5"
            >
              <p className="text-red-400" data-testid="text-error">Failed to load logs. Please try refreshing.</p>
            </motion.div>
          ) : sortedDays.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-16 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Dumbbell size={32} className="text-[#a7b3d6]/50" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">No logs yet</h3>
              <p className="text-[#a7b3d6] max-w-md mb-2">
                Use the chat AI or Telegram bot to start logging your {category} workouts.
              </p>
              <div className="flex items-center gap-1 text-[#7c5cff] text-sm mt-2">
                <span>Open chat to get started</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${category}`}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-12 gap-4"
            >
              {sortedDays.map((day) => (
                <motion.div
                  key={`${day.category}-${day.dayNumber}`}
                  className="col-span-12 md:col-span-6"
                  variants={item}
                >
                  <DayCard day={day} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-6" />
        <p className="text-[11px] font-medium tracking-wider uppercase"><span className="bg-gradient-to-r from-[#7c5cff] to-[#38bdf8] bg-clip-text text-transparent">John's Lock-In Logs</span> <span className="text-white/20">&mdash; Built with discipline &middot; v2.0</span></p>
      </motion.footer>
    </motion.div>
  );
}
