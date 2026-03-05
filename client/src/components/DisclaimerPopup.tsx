import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function DisclaimerPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("lockin_disclaimer_seen")) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("lockin_disclaimer_seen", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="disclaimer-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl border border-[#7c5cff]/30 p-6"
            style={{
              background: "rgba(15, 22, 36, 0.85)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 0 40px rgba(124, 92, 255, 0.1), 0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-[#f59e0b]" />
              <h2 className="text-base font-bold tracking-wide text-white uppercase">Disclaimer</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/70 mb-6">
              I do not recommend my daily supplement intake for a regular individual. My stack is
              specifically tailored to my body, goals, and tolerance levels built over time. Always
              consult a healthcare professional before starting any supplement regimen.
            </p>
            <button
              data-testid="button-dismiss-disclaimer"
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7c5cff, #6344df)",
                border: "1px solid rgba(124, 92, 255, 0.4)",
              }}
            >
              I Understand
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
