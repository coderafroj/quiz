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
export type QuizDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type QuizStatus = "pending" | "approved" | "rejected";

export interface Quiz {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  language: string;
  /** Topic, e.g. "Python", "C++", "Java", "General Knowledge" — used for Explore filtering and SEO. */
  category: string;
  difficulty: QuizDifficulty;
  questions: QuizQuestionItem[];
  visibility: QuizVisibility;
  /** Only "approved" quizzes appear in the public Explore page and the sitemap. Direct links always work regardless of status. */
  status: QuizStatus;
  createdAt: number;
  updatedAt: number;
  playCount: number;
}

export type QuizInput = Omit<Quiz, "id" | "createdAt" | "updatedAt" | "playCount" | "status">;

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
