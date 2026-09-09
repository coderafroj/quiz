export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export interface QuizQuestionItem {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // seconds — used to drive the live-mode timer
  points: number; // base points awarded for a correct answer
}

export type QuizVisibility = "public" | "unlisted";

export interface Quiz {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  language: string;
  category: string;
  questions: QuizQuestionItem[];
  visibility: QuizVisibility;
  createdAt: number;
  updatedAt: number;
  playCount: number;
}

export type QuizInput = Omit<Quiz, "id" | "createdAt" | "updatedAt" | "playCount">;

export type SessionStatus = "lobby" | "question" | "reveal" | "ended";

export interface LiveSession {
  code: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  createdAt: number;
}

export interface LivePlayer {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
}

export interface LiveAnswer {
  id: string; // `${playerId}_${questionIndex}`
  playerId: string;
  playerName: string;
  questionIndex: number;
  selectedIndex: number;
  correct: boolean;
  pointsEarned: number;
  answeredAt: number;
}

export interface SoloAttempt {
  id: string;
  playerName: string;
  score: number;
  total: number;
  completedAt: number;
}
