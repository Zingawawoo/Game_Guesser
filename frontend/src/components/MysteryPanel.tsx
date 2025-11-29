import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Answer, GameSummary, Phase } from "../types";
import LuckyDrawOverlay from "./LuckyDrawOverlay";
import ResultOverlay from "./ResultOverlay";

interface MysteryPanelProps {
  phase: Phase;
  allGames: GameSummary[];
  candidatesCount: number;
  mysteryGame: GameSummary | null;
  lastAnswer: Answer | null;
  showAnswerFlash: boolean;
  hasGuessedCorrectly: boolean;
  guessInput: string;
  maxQuestions: number | null;
  questionsAsked: number;
  onStartGame: () => void;
  onPlayAgain: () => void;
}

function getAnswerFlashClass(answer: Answer | null): string {
  if (answer === "yes") {
    return "bg-emerald-500/20 ring-2 ring-emerald-400/60";
  }
  if (answer === "no") {
    return "bg-rose-500/20 ring-2 ring-rose-400/60";
  }
  return "bg-slate-800/40";
}

const MysteryPanel: React.FC<MysteryPanelProps> = (props) => {
  const {
    phase,
    allGames,
    candidatesCount,
    mysteryGame,
    lastAnswer,
    showAnswerFlash,
    hasGuessedCorrectly,
    guessInput,
    maxQuestions,
    questionsAsked,
    onStartGame,
    onPlayAgain,
  } = props;

  const showIntro: boolean = phase === "intro";
  const showLucky: boolean = phase === "selectingMystery";
  const showFinished: boolean = phase === "finished" && mysteryGame !== null;

  return (
    <section className="relative flex items-center justify-center">
        {/* FULL-COLUMN BLURRED BACKGROUND */}
        {mysteryGame?.imageUrl && (
            <div
            className="
                absolute inset-0
                bg-cover bg-center
                blur-2xl
                opacity-20
                scale-110
                pointer-events-none
                z-0
            "
            style={{
                backgroundImage: `url(${mysteryGame.imageUrl})`,
                
            }}
            />
        )}
        <motion.div
            className="relative z-[1] w-full max-w-xl rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_0_70px_rgba(15,23,42,0.9)] overflow-hidden"
            layout
        >
            {/* Blurred mystery game art behind the card */}
            {mysteryGame !== null && mysteryGame.imageUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-0">
                <img
                src={mysteryGame.imageUrl}
                alt={mysteryGame.name}
                className="h-full w-full object-cover blur-2xl scale-110"
                />
                <div className="absolute inset-0 bg-slate-950/70" />
            </div>
            )}

            {/* Existing soft glows */}
            <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute -top-10 left-1/4 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
            </div>

            {/* Foreground content */}
            <div className="relative px-6 pt-6 pb-5 flex flex-col gap-3 z-20">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Mystery Game
                </p>
                <p className="text-xs text-slate-300 mt-1">
                    Ask yes/no questions to narrow down{" "}
                    <span className="text-emerald-300 font-semibold">
                    {allGames.length}
                    </span>{" "}
                    modern games until you can guess the right one.
                </p>
                </div>

                <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
                <span className="uppercase tracking-[0.18em]">Candidates</span>
                <motion.span
                    key={candidatesCount}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-1 text-base font-semibold text-emerald-300"
                >
                    {candidatesCount}
                </motion.span>

                {/* Questions used / remaining */}
                {maxQuestions !== null && (
                    <div className="mt-2 flex flex-col items-end text-[10px] text-slate-300">
                    <span>
                        Questions used:{" "}
                        <span className="font-semibold text-slate-50">
                        {questionsAsked}
                        </span>{" "}
                        / {maxQuestions}
                    </span>
                    <span className="text-slate-400">
                        Remaining:{" "}
                        <span className="font-semibold text-emerald-300">
                        {Math.max(0, maxQuestions - questionsAsked)}
                        </span>
                    </span>
                    </div>
                )}
                </div>
            </div>

            {/* Mystery card */}
           <div className="mt-3">
            <p className="text-xs text-slate-300">Current candidate pool:</p>
            <p className="text-sm font-medium text-slate-50">
                {candidatesCount} {candidatesCount === 1 ? "game" : "games"}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
                Ask questions on the left to shrink the pool, then make your final guess on the right.
            </p>
            </div>
            </div>

            {/* Answer flash overlay (unchanged) */}
            <AnimatePresence>
            {showAnswerFlash && lastAnswer !== null && (
                <motion.div
                key={lastAnswer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.22 }}
                className={
                    "absolute inset-0 flex items-center justify-center " +
                    getAnswerFlashClass(lastAnswer)
                }
                >
                <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    className="px-6 py-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-[0_0_40px_rgba(15,23,42,1)] flex items-center gap-3"
                >
                    <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                    {lastAnswer === "yes" && (
                        <span className="text-emerald-300 text-lg">✔</span>
                    )}
                    {lastAnswer === "no" && (
                        <span className="text-rose-300 text-lg">✖</span>
                    )}
                    </div>
                    <p className="text-sm font-medium text-slate-100">
                    {lastAnswer === "yes" && "Answer: Yes"}
                    {lastAnswer === "no" && "Answer: No"}
                    </p>
                </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>


      {/* Overlays */}
      <AnimatePresence>
        {(showIntro || showLucky) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {showIntro && (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-7 shadow-[0_0_70px_rgba(15,23,42,1)]"
              >
                <h2 className="text-lg font-semibold text-slate-50 mb-2">
                  How it works
                </h2>
                <ul className="space-y-2 text-sm text-slate-300 mb-5">
                  <li>• We secretly pick one modern video game.</li>
                  <li>
                    • You build structured yes/no questions from the panel on
                    the left.
                  </li>
                  <li>
                    • Watch the candidate pool shrink in the centre card.
                  </li>
                  <li>
                    • When you are confident, type your final guess on the
                    right.
                  </li>
                </ul>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onStartGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-sm font-semibold py-2.5 shadow-[0_18px_35px_rgba(16,185,129,0.45)]"
                >
                  Start a new mystery game
                </motion.button>
              </motion.div>
            )}

            {showLucky && <LuckyDrawOverlay games={allGames} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinished && mysteryGame !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultOverlay
              mysteryGame={mysteryGame}
              guessInput={guessInput}
              hasGuessedCorrectly={hasGuessedCorrectly}
              onPlayAgain={onPlayAgain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MysteryPanel;
