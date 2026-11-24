import type { Quiz, QuizInput, QuizQuestionItem, QuestionDifficulty } from "../types";
import type { PaperDef, QT, UnitDef } from "./types";
import { M1 } from "./m1";
import { M2 } from "./m2";
import { M3 } from "./m3";
import { M4 } from "./m4";

export type { PaperDef, UnitDef } from "./types";

export const O_LEVEL_PAPERS: PaperDef[] = [M1, M2, M3, M4];
export const O_LEVEL_CATEGORY = "O Level";

export type SeedQuiz = Omit<QuizInput, "ownerId" | "ownerName"> & {
  /** Stable Firestore document id — importing the same seed twice can never create a second copy. */
  seedId: string;
  /** Section label used to group seeds in the admin import screen. */
  group: string;
};

const LEVEL: Record<QT[3], QuestionDifficulty> = { e: "easy", m: "medium", h: "hard" };
const TIME_BY_LEVEL: Record<QT[3], number> = { e: 20, m: 30, h: 40 };

// --- tiny deterministic PRNG so option order is fixed per question (no bias
// towards "A", and the same question always gets the same layout) ---
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toQuestion(seedId: string, index: number, [text, optString, correct, level]: QT): QuizQuestionItem {
  const options = optString.split("|");
  const rand = mulberry32(hash(`${seedId}:${text}`));
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id: `${seedId}-q${index + 1}`,
    text,
    options: order.map((i) => options[i]),
    correctIndex: order.indexOf(correct),
    timeLimit: TIME_BY_LEVEL[level],
    points: 1000,
    difficulty: LEVEL[level],
  };
}

export const unitQuizId = (paper: string, unit: string) => `olevel-${paper}-${unit}`;
export const mockQuizId = (paper: string) => `olevel-${paper}-mock`;

const MOCK_SIZE = 30;

function mockQuestions(paper: PaperDef): QT[] {
  const picked: QT[] = [];
  for (let round = 0; picked.length < MOCK_SIZE; round++) {
    let tookAny = false;
    for (const unit of paper.units) {
      const item = unit.qs[round];
      if (item && picked.length < MOCK_SIZE) {
        picked.push(item);
        tookAny = true;
      }
    }
    if (!tookAny) break;
  }
  return picked;
}

function unitSeed(paper: PaperDef, unit: UnitDef): SeedQuiz {
  const seedId = unitQuizId(paper.slug, unit.slug);
  return {
    seedId,
    group: `O Level · ${paper.code} ${paper.short}`,
    title: `O Level ${paper.code} · ${unit.title}`,
    description: `${unit.summary} Practice MCQs for the NIELIT O Level ${paper.title} (${paper.code}) paper.`,
    language: "English",
    category: O_LEVEL_CATEGORY,
    difficulty: "Intermediate",
    visibility: "public",
    shuffleOptions: true,
    questions: unit.qs.map((q, i) => toQuestion(seedId, i, q)),
  };
}

function mockSeed(paper: PaperDef): SeedQuiz {
  const seedId = mockQuizId(paper.slug);
  const qs = mockQuestions(paper);
  return {
    seedId,
    group: `O Level · ${paper.code} ${paper.short}`,
    title: `O Level ${paper.code} · Full Mock Test`,
    description: `A ${qs.length}-question mixed mock test covering every unit of NIELIT O Level ${paper.title} (${paper.code}).`,
    language: "English",
    category: O_LEVEL_CATEGORY,
    difficulty: "Intermediate",
    visibility: "public",
    shuffleOptions: true,
    featured: true,
    questions: qs.map((q, i) => toQuestion(seedId, i, q)),
  };
}

export function buildOLevelSeeds(): SeedQuiz[] {
  return O_LEVEL_PAPERS.flatMap((paper) => [...paper.units.map((u) => unitSeed(paper, u)), mockSeed(paper)]);
}

const SEED_CACHE = new Map<string, SeedQuiz>();
function seedMap() {
  if (SEED_CACHE.size === 0) buildOLevelSeeds().forEach((s) => SEED_CACHE.set(s.seedId, s));
  return SEED_CACHE;
}

export function isOLevelQuizId(id: string) {
  return id.startsWith("olevel-");
}

/**
 * Static fallback: O Level quizzes always work, even before an admin has
 * imported them into Firestore. If the Firestore copy exists it wins (so an
 * admin can still edit it); otherwise this built-in copy is served.
 */
export function getStaticOLevelQuiz(id: string): Quiz | null {
  const seed = seedMap().get(id);
  if (!seed) return null;
  const { seedId, group, ...rest } = seed;
  void group;
  return {
    ...rest,
    id: seedId,
    ownerId: "system",
    ownerName: "Codarafroj Play",
    status: "approved",
    createdAt: 1767225600000,
    updatedAt: 1767225600000,
    playCount: 0,
  };
}

export function paperTotals(paper: PaperDef) {
  const questions = paper.units.reduce((n, u) => n + u.qs.length, 0);
  return { units: paper.units.length, questions };
}

export function allOLevelQuizIds(): string[] {
  return buildOLevelSeeds().map((s) => s.seedId);
}

export function getPaper(slug: string): PaperDef | undefined {
  return O_LEVEL_PAPERS.find((p) => p.slug === slug);
}

export function totalOLevelQuestions() {
  return O_LEVEL_PAPERS.reduce((n, p) => n + paperTotals(p).questions, 0);
}

/** Where a quiz sits in the O Level path — used for "Next unit" buttons and breadcrumbs. */
export function locateOLevelQuiz(id: string): { paper: PaperDef; nextId: string | null; nextTitle: string | null } | null {
  for (const paper of O_LEVEL_PAPERS) {
    const ids = [...paper.units.map((u) => unitQuizId(paper.slug, u.slug)), mockQuizId(paper.slug)];
    const i = ids.indexOf(id);
    if (i === -1) continue;
    const nextId = ids[i + 1] ?? null;
    let nextTitle: string | null = null;
    if (nextId) {
      nextTitle = nextId === mockQuizId(paper.slug) ? "Full Mock Test" : (paper.units[i + 1]?.title ?? null);
    }
    return { paper, nextId, nextTitle };
  }
  return null;
}
