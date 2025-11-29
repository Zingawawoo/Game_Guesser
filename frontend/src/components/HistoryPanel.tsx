import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Answer,
  GameSummary,
  QuestionHistoryEntry,
} from "../types";

interface HistoryPanelProps {
  history: QuestionHistoryEntry[];
  guessInput: string;
  suggestions: GameSummary[];
  phase: "intro" | "selectingMystery" | "playing" | "finished";
  onGuessInputChange: (value: string) => void;
  onUseSuggestion: (game: GameSummary) => void;
  onGuessSubmit: () => void;
}

function getAnswerPillClass(answer: Answer): string {
  if (answer === "yes") {
    return "text-emerald-300 border-emerald-400/50 bg-emerald-500/10";
  }

  return "text-rose-300 border-rose-400/50 bg-rose-500/10";
}

const HistoryPanel: React.FC<HistoryPanelProps> = (props) => {
  const {
    history,
    guessInput,
    suggestions,
    phase,
    onGuessInputChange,
    onUseSuggestion,
    onGuessSubmit,
  } = props;

  const isGuessDisabled: boolean =
    phase !== "playing" || guessInput.trim().length === 0;

  return (
    <section className="relative rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-[0_0_80px_rgba(15,23,42,1)] overflow-hidden flex flex-col">
      <div className="relative flex-1 flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/80">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Questions &amp; guesses
          </p>
          <p className="text-xs text-slate-400 mt-1">
            This panel will show question history and let you submit your final
            guess.
          </p>
        </div>

        {/* History list */}
        <div className="flex-1 px-5 py-3 overflow-y-auto space-y-2 text-xs">
          {history.length === 0 && (
            <p className="text-slate-500 mt-2">
              No questions asked yet. Build a question on the left and hit
              <span className="text-slate-300"> “Ask this question”</span>.
            </p>
          )}

          {history.map((entry: QuestionHistoryEntry) => {
            const answerClass: string = getAnswerPillClass(entry.answer);

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-3 rounded-2xl bg-slate-900/70 border border-slate-800 px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-[11px] text-slate-300">{entry.text}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {entry.timestamp}
                  </p>
                </div>
                <span
                  className={
                    "px-2 py-1 rounded-xl text-[10px] font-semibold border " +
                    answerClass
                  }
                >
                  {entry.answer === "yes" ? "YES" : "NO"}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Final guess input + suggestions */}
        <div className="px-5 pt-2 pb-4 border-t border-slate-800/80">
          <label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Final guess (exact game name)
          </label>
          <div className="mt-2 relative">
            <input
              value={guessInput}
              onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                onGuessInputChange(event.target.value);
              }}
              placeholder="I think the game is…"
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-700/90 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-all"
            />

            {/* Suggestion box */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 mt-1 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-xl max-h-48 overflow-y-auto text-xs z-10"
                >
                  {suggestions.map((game: GameSummary) => {
                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={(): void => {
                          onUseSuggestion(game);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800/80 text-slate-200"
                      >
                        {game.name}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onGuessSubmit}
            disabled={isGuessDisabled}
            className="mt-3 w-full rounded-2xl bg-slate-900 border border-slate-700 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 py-2 hover:border-emerald-400/70 hover:text-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guess the game
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default HistoryPanel;
