import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./index.css";
import type { Game } from "./types";

const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadGames(): Promise<void> {
      try {
        const res = await fetch("/games.json");
        if (!res.ok) {
          setError("Failed to load games.json");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as Game[];
        setGames(data);
        setLoading(false);
      } catch {
        setError("Error while loading games.json");
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl bg-slate-900 px-6 py-4 text-sm shadow-xl shadow-emerald-500/20">
          Loading game dataset…
        </div>
      </div>
    );
  }

  if (error !== "") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl bg-rose-900/40 px-6 py-4 text-sm shadow-xl shadow-rose-500/30">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 ring-2 ring-emerald-400/80" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              GDD GUESSER
            </span>
            <span className="text-sm text-slate-100">
              Video Game Question Game
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Dataset size:{" "}
          <span className="font-semibold text-emerald-300">
            {games.length} games
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 gap-4 px-4 py-4">
        {/* Left: future Question Builder */}
        <section className="flex w-1/3 flex-col rounded-2xl bg-slate-900/80 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Question Builder
          </h2>
          <p className="text-xs text-slate-400">
            This panel will let you pick categories and yes/no questions to ask.
            We will wire this up to the backend question templates next.
          </p>
        </section>

        {/* Center: Mystery game card */}
        <section className="flex w-1/3 items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0.0 }}
            animate={{ scale: 1.0, opacity: 1.0 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-col items-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-2xl shadow-emerald-500/20"
          >
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              Mystery Game
            </div>
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 shadow-inner shadow-black/60">
              <span className="text-4xl font-black text-emerald-400">?</span>
            </div>
            <div className="text-center text-sm text-slate-300">
              Ask yes/no questions to narrow down{" "}
              <span className="font-semibold text-emerald-300">
                {games.length}
              </span>{" "}
              modern games until you can guess the right one.
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Next step: connect to the Go backend and wire up live sessions.
            </div>
          </motion.div>
        </section>

        {/* Right: future History + Guess */}
        <section className="flex w-1/3 flex-col rounded-2xl bg-slate-900/80 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Questions &amp; Guesses
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            This panel will show question history and let you submit your final guess.
          </p>
          <div className="mt-auto">
            <input
              className="mb-2 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="I think the game is…"
              disabled
            />
            <button
              className="w-full cursor-not-allowed rounded-lg bg-slate-700 py-2 text-xs font-semibold text-slate-400"
              disabled
            >
              Guess (backend not wired yet)
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
