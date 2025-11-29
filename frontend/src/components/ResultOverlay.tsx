import React from "react";
import { motion } from "framer-motion";
import type { GameSummary } from "../types";

interface ResultOverlayProps {
  mysteryGame: GameSummary;
  guessInput: string;
  hasGuessedCorrectly: boolean;
  onPlayAgain: () => void;
}

const ResultOverlay: React.FC<ResultOverlayProps> = (props) => {
  const { mysteryGame, guessInput, hasGuessedCorrectly, onPlayAgain } = props;

  return (
    <motion.div
      className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-7 shadow-[0_0_70px_rgba(15,23,42,1)]"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">
        Result
      </p>
      <h2 className="text-lg font-semibold text-slate-50 mb-2">
        {hasGuessedCorrectly
          ? "You nailed it!"
          : "Nice try – here’s the mystery game"}
      </h2>
      <p className="text-sm text-slate-300 mb-4">The mystery game was:</p>
      <div className="flex items-center gap-4 mb-5">
        <div className="h-16 w-16 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center overflow-hidden">
          {mysteryGame.imageUrl !== undefined ? (
            <img
              src={mysteryGame.imageUrl}
              alt={mysteryGame.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl text-emerald-300">
              {mysteryGame.name.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {mysteryGame.name}
          </p>
          {hasGuessedCorrectly && (
            <p className="text-xs text-emerald-300 mt-1">
              Your guess matched exactly. GG.
            </p>
          )}
          {!hasGuessedCorrectly && (
            <p className="text-xs text-slate-400 mt-1">
              Your final guess was “{guessInput}”.
            </p>
          )}
        </div>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onPlayAgain}
        className="w-full rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold py-2.5 hover:border-emerald-400/70 hover:text-emerald-200 transition-colors"
      >
        Play again
      </motion.button>
    </motion.div>
  );
};

export default ResultOverlay;
