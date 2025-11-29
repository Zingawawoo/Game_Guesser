// src/types.ts

// Game state phases
export type Phase = "intro" | "selectingMystery" | "playing" | "finished";

// Yes / No answers
export type Answer = "yes" | "no";

// Basic game info (we can extend this when we hook RAWG / backend)
export interface GameSummary {
  id: number;
  name: string;
  imageUrl?: string; // optional for now
}

// Single question history entry
export interface QuestionHistoryEntry {
  id: number;
  text: string;
  answer: Answer;
  timestamp: string;
  questionTypeId: string; 
}

// Configuration for a question type
export interface QuestionTypeDef {
  id: string;
  label: string;
  hint: string;
  options: string[];
}

export interface MysteryGame {
    id: number;
    name: string;
    imageUrl: string;
}

export interface StartResponse {
    sessionId: string;
    datasetSize: number;
    candidatesCount: number;
    maxQuestions: number;
    mysteryGame: MysteryGame; 
}
