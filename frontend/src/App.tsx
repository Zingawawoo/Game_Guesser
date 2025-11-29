import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

import type {
  Answer,
  GameSummary,
  Phase,
  QuestionHistoryEntry,
  QuestionTypeDef,
} from "./types";

import QuestionBuilder from "./components/QuestionBuilder";
import HistoryPanel from "./components/HistoryPanel";
import MysteryPanel from "./components/MysteryPanel";

const QUESTION_TYPES: QuestionTypeDef[] = [
  {
    id: "platform",
    label: "Platform",
    hint: "Ask which platform the game released on.",
    options: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Multi-platform"],
  },
  {
    id: "genre",
    label: "Main Genre",
    hint: "Narrow it down by core genre.",
    options: ["Action", "RPG", "Shooter", "Platformer", "Sports", "Strategy"],
  },
  {
    id: "perspective",
    label: "Perspective",
    hint: "First-person vs third-person etc.",
    options: ["First-person", "Third-person", "Top-down", "Side-view"],
  },
  {
    id: "world",
    label: "World Type",
    hint: "Open world vs more linear.",
    options: ["Open world", "Linear", "Level-based", "Hub-based"],
  },
  {
    id: "multiplayer",
    label: "Multiplayer",
    hint: "Check if it has online or local multiplayer.",
    options: ["Single-player", "Online multiplayer", "Local co-op"],
  },
  {
    id: "rating",
    label: "Age Rating",
    hint: "Roughly how mature the game is.",
    options: ["Everyone", "Teen", "Mature"],
  },
  {
    id: "style",
    label: "Visual Style",
    hint: "Realistic vs stylised, pixel art, etc.",
    options: ["Realistic", "Stylised", "Pixel art", "Cartoon"],
  },
  {
    id: "theme",
    label: "Theme",
    hint: "Fantasy, sci-fi, sports, horror…",
    options: ["Fantasy", "Sci-fi", "Horror", "Sports", "Historical"],
  },
];


const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");

  const [allGames, setAllGames] = useState<GameSummary[]>([]);
  const [mysteryGame, setMysteryGame] = useState<GameSummary | null>(null);
  const [candidatesCount, setCandidatesCount] = useState<number>(0);

  const [questionTypeId, setQuestionTypeId] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("");

  const [history, setHistory] = useState<QuestionHistoryEntry[]>([]);
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [showAnswerFlash, setShowAnswerFlash] = useState<boolean>(false);

  const [guessInput, setGuessInput] = useState<string>("");
  const [guessSuggestions, setGuessSuggestions] = useState<GameSummary[]>([]);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState<boolean>(false);
  const [maxQuestions, setMaxQuestions] = useState<number | null>(null);
  const questionsAsked: number = history.length;

  // ---------- Load dataset (front-end only for now) ----------
  useEffect(() => {
    async function loadGames(): Promise<void> {
      try {
        const response: Response = await fetch("/games.json");
        const data: { id: number; name: string }[] =
          await response.json();

        const mapped: GameSummary[] = data.map(
          (raw: { id: number; name: string }, index: number): GameSummary => {
            return {
              id: raw.id ?? index,
              name: raw.name,
            };
          }
        );

        setAllGames(mapped);
        setCandidatesCount(mapped.length);
      } catch (error) {
        setAllGames([]);
        setCandidatesCount(0);
        // eslint-disable-next-line no-console
        console.error("Failed to load games.json", error);
      }
    }

    loadGames();
  }, []);

  // ---------- Guess suggestions ----------
  useEffect(() => {
    if (guessInput.trim().length === 0) {
      setGuessSuggestions([]);
      return;
    }

    const query: string = guessInput.toLowerCase();

    const filtered: GameSummary[] = allGames
      .filter((game: GameSummary): boolean => {
        const nameLower: string = game.name.toLowerCase();
        return nameLower.includes(query);
      })
      .slice(0, 8);

    setGuessSuggestions(filtered);
  }, [guessInput, allGames]);

  const currentQuestionType: QuestionTypeDef | undefined = useMemo(() => {
    const found: QuestionTypeDef | undefined = QUESTION_TYPES.find(
      (q: QuestionTypeDef): boolean => {
        return q.id === questionTypeId;
      }
    );
    return found;
  }, [questionTypeId]);

  // ---------- Load or restore the mystery image once a session exists ----------
  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/session/${encodeURIComponent(sessionId)}/mystery`, {
      method: "POST",
    })
      .then(res => res.json())
      .then(data => {
        setMysteryGame(data);
      })
      .catch(err => console.error("Failed to load mystery info", err));
  }, [sessionId]);

  // ---------- Start flow ----------
  const handleStartGame = async (): Promise<void> => {
    if (phase === "selectingMystery") return;

    setPhase("selectingMystery");

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to start session");

      const data = await response.json();

      setSessionId(data.sessionId);
      setCandidatesCount(data.candidatesCount);
      setMaxQuestions(data.maxQuestions);
      setMysteryGame(data.mysteryGame);

      // Allow lottery animation to play
      setTimeout(() => {
        setPhase("playing");
      }, 1800);

    } catch (err) {
      console.error(err);
      setPhase("intro");
    }
  };

  const handlePlayAgain = (): void => {
    setHistory([]);
    setQuestionTypeId("");
    setSelectedOption("");
    setGuessInput("");
    setGuessSuggestions([]);
    setHasGuessedCorrectly(false);
    setLastAnswer(null);
    setShowAnswerFlash(false);

    if (allGames.length > 0) {
      setCandidatesCount(allGames.length);
    }

    setPhase("intro");
  };

  // ---------- Ask a question (simulated yes/no for now) ----------
  const handleAskQuestion = async (): Promise<void> => {
    if (currentQuestionType === undefined) {
      return;
    }
    if (selectedOption.trim().length === 0) {
      return;
    }
    if (phase !== "playing") {
      return;
    }
    if (sessionId === null) {
      return;
    }

    const questionText: string =
      "Is the " +
      currentQuestionType.label.toLowerCase() +
      " " +
      selectedOption +
      "?";

    try {
      const response: Response = await fetch(
        "/api/session/" + encodeURIComponent(sessionId) + "/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionTypeId: currentQuestionType.id,
            option: selectedOption,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ask question failed");
      }

      const data: { answer: Answer; candidatesCount: number } =
        await response.json();

      const entry: QuestionHistoryEntry = {
        id: history.length + 1,
        text: questionText,
        answer: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        questionTypeId: currentQuestionType.id,   // ADD THIS
      };


      const newHistory: QuestionHistoryEntry[] = [...history, entry];
      setHistory(newHistory);
      setCandidatesCount(data.candidatesCount);

      setLastAnswer(data.answer);
      setShowAnswerFlash(true);
      window.setTimeout((): void => {
        setShowAnswerFlash(false);
      }, 800);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  // ---------- Guessing ----------
  const handleUseSuggestion = (game: GameSummary): void => {
    setGuessInput(game.name);
    setGuessSuggestions([]);
  };

  const handleGuessSubmit = async (): Promise<void> => {
    if (sessionId === null) {
      return;
    }
    if (guessInput.trim().length === 0) {
      return;
    }

    try {
      const response: Response = await fetch(
        "/api/session/" + encodeURIComponent(sessionId) + "/guess",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ guess: guessInput }),
        }
      );

      if (!response.ok) {
        throw new Error("Guess submit failed");
      }

      const data: {
        correct: boolean;
        game: GameSummary;
      } = await response.json();

      setMysteryGame(data.game);
      setHasGuessedCorrectly(data.correct);
      setPhase("finished");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <div className="h-4 w-4 rounded-xl border border-white/60" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-100">
              GDD GUESSER
            </h1>
            <p className="text-xs text-slate-400">
              Video Game Question Game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="hidden md:flex items-baseline gap-2">
            <span className="uppercase tracking-wide text-slate-500">
              Dataset size
            </span>
            <span className="font-semibold text-emerald-300">
              {allGames.length}
            </span>
            <span className="text-slate-600">games</span>
          </div>
          <button
            type="button"
            onClick={handlePlayAgain}
            className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase text-slate-300 hover:border-emerald-400 hover:text-emerald-200 transition-colors"
          >
            New Game
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,1.25fr)] gap-4 lg:gap-6 px-3 lg:px-6 py-4 lg:py-6">
        <QuestionBuilder
          phase={phase}
          questionTypes={QUESTION_TYPES}
          currentQuestionTypeId={questionTypeId}
          selectedOption={selectedOption}
          history={history}
          onQuestionTypeChange={(id: string): void => {
            setQuestionTypeId(id);
            setSelectedOption("");
          }}
          onOptionChange={(opt: string): void => {
            setSelectedOption(opt);
          }}
          onAskQuestion={handleAskQuestion}
        />

        <MysteryPanel
          phase={phase}
          allGames={allGames}
          candidatesCount={candidatesCount}
          mysteryGame={mysteryGame}
          lastAnswer={lastAnswer}
          showAnswerFlash={showAnswerFlash}
          hasGuessedCorrectly={hasGuessedCorrectly}
          guessInput={guessInput}
          maxQuestions={maxQuestions}
          questionsAsked={questionsAsked}
          onStartGame={handleStartGame}
          onPlayAgain={handlePlayAgain}
        />

        <HistoryPanel
          history={history}
          guessInput={guessInput}
          suggestions={guessSuggestions}
          phase={phase}
          onGuessInputChange={setGuessInput}
          onUseSuggestion={handleUseSuggestion}
          onGuessSubmit={handleGuessSubmit}
        />
      </main>
    </div>
  );
};

export default App;
