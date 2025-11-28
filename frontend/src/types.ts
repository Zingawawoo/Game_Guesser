// frontend/src/types.ts

export type Game = {
  id: number;
  name: string;
  year: number;
  platforms: string[];
  genres: string[];
  main_genre: string;
  perspective: string;
  world_type: string;
  camera: string;
  theme: string;
  tone: string[];
  difficulty: string;
  replayability: string;
  developer_bucket: string;
  developer_region: string;
  franchise: string;
  franchise_entry: string;
  esrb: string;
  age_rating: string;
  violence_level: string;
  visual_style: string[];
  combat_style: string[];
  structure_features: string[];
  mood: string[];
  setting: string[];
  monetization: string[];
  multiplayer: boolean;
  co_op: boolean;
  online_only: boolean;
  multiplayer_mode: string;
  score_bucket: string;
};
