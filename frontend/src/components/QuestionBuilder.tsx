import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phase, QuestionTypeDef, QuestionHistoryEntry } from "../types";

interface QuestionBuilderProps {
  phase: Phase;
  questionTypes: QuestionTypeDef[];
  currentQuestionTypeId: string;
  selectedOption: string;
  history: QuestionHistoryEntry[];
  onQuestionTypeChange: (id: string) => void;
  onOptionChange: (option: string) => void;
  onAskQuestion: () => void;
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = (props) => {
  const {
    phase,
    questionTypes,
    currentQuestionTypeId,
    selectedOption,
    history,
    onQuestionTypeChange,
    onOptionChange,
    onAskQuestion,
  } = props;

  const scrollRef = useRef<HTMLButtonElement | null>(null);

  // Track used types by *questionTypeId* (reliable)
  const usedTypes = new Set(history.map((h) => h.questionTypeId));

  const currentType = questionTypes.find((q) => q.id === currentQuestionTypeId);

  const isAskDisabled =
    !currentType ||
    selectedOption.trim().length === 0 ||
    phase !== "playing";

  // Smoothly scroll to selected type
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentQuestionTypeId]);

  return (
    <section className="relative rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-[0_0_80px_rgba(15,23,42,1)] overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/80">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Question Builder
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ask structured yes/no questions to shrink the candidate pool.
          </p>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">

          {/* ================= QUESTION TYPES (BUTTON GRID) ================= */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Question Types
            </label>

            <div className="flex flex-wrap gap-2">
              {questionTypes
                .filter((q) => !usedTypes.has(q.id)) // Hide used types
                .map((q) => {
                  const selected = q.id === currentQuestionTypeId;

                  let classes =
                    "px-3 py-1.5 rounded-2xl text-[11px] font-medium border transition-all cursor-pointer select-none ";

                  if (selected) {
                    classes +=
                      "border-emerald-400/80 bg-emerald-500/15 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.45)]";
                  } else {
                    classes +=
                      "border-slate-700/90 bg-slate-900/80 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100";
                  }

                  return (
                    <motion.button
                      key={q.id}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        onQuestionTypeChange(selected ? "" : q.id)
                      }
                      className={classes}
                      ref={selected ? scrollRef : null}
                    >
                      {q.label}
                    </motion.button>
                  );
                })}
            </div>

            {currentType && (
              <p className="text-[11px] text-slate-500">{currentType.hint}</p>
            )}
          </div>

          {/* ================= OPTIONS FOR SELECTED TYPE ================= */}
          <AnimatePresence initial={false}>
            {currentType && (
              <motion.div
                key={currentType.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22 }}
                className="space-y-2"
              >
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Options
                </label>

                <div className="flex flex-wrap gap-2">
                  {currentType.options.map((option) => {
                    const selected = selectedOption === option;

                    let classes =
                      "px-3 py-1.5 rounded-2xl text-[11px] font-medium border transition-all cursor-pointer select-none ";

                    if (selected) {
                      classes +=
                        "border-emerald-400/80 bg-emerald-500/15 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.45)]";
                    } else {
                      classes +=
                        "border-slate-700/90 bg-slate-900/80 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100";
                    }

                    return (
                      <motion.button
                        key={option}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          onOptionChange(selected ? "" : option)
                        }
                        className={classes}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= ASK QUESTION BUTTON ================= */}
          <div className="mt-auto pt-2">
            <motion.button
              type="button"
              onClick={() => {
                onAskQuestion();
                // Auto-collapse type after using it
                onQuestionTypeChange("");
                onOptionChange("");
              }}
              disabled={isAskDisabled}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-xs font-semibold py-2.5 shadow-[0_18px_35px_rgba(16,185,129,0.45)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ask this question
            </motion.button>

            <p className="mt-2 text-[11px] text-slate-500">
              Ask questions to narrow down the mystery game.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuestionBuilder;
