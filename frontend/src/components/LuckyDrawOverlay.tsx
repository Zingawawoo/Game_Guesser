import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { GameSummary } from "../types";

interface LuckyDrawOverlayProps {
  games: GameSummary[];
}

const LuckyDrawOverlay: React.FC<LuckyDrawOverlayProps> = (props) => {
  const { games } = props;
  const [currentName, setCurrentName] = useState<string>("???");

  useEffect(() => {
    if (games.length === 0) {
      return;
    }

    const intervalId: number = window.setInterval((): void => {
      const index: number = Math.floor(Math.random() * games.length);
      const chosen: GameSummary = games[index];
      setCurrentName(chosen.name);
    }, 80);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [games]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-7 shadow-[0_0_80px_rgba(16,185,129,0.7)]"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-emerald-300 mb-2">
        Picking a mystery game…
      </p>
      <p className="text-sm text-slate-300 mb-4">
        We are spinning through the catalogue and locking in a game for this
        round.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-900/90 border border-emerald-400/70 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.6)]">
          <span className="text-2xl text-emerald-300">?</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[11px] text-slate-400 mb-1">
            Candidate preview (spinning fast):
          </p>
          <motion.p
            key={currentName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.09 }}
            className="text-sm font-semibold text-slate-100"
          >
            {currentName}
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LuckyDrawOverlay;
