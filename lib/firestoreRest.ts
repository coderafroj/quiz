// Lightweight server-side Firestore access via the public REST API — no
// firebase-admin credentials needed, since our Firestore rules already
// allow public reads on the `quizzes` collection. This lets Server
// Components fetch quiz data for real <title>/<meta> tags and a sitemap,
// which client-only fetching could never give search engines.

import type { Quiz } from "./types";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function parseValue(value: FirestoreValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(parseValue);
  if (value.mapValue) return parseFields(value.mapValue.fields || {});
  return null;
}

function parseFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in fields) {
    out[key] = parseValue(fields[key]);
  }
  return out;
}

function docIdFromName(name: string): string {
  const parts = name.split("/");
  return parts[parts.length - 1];
}

/** Fetches a single quiz by ID for server-side rendering. Returns null if missing or unreachable. */
export async function getQuizServerSide(id: string): Promise<Quiz | null> {
  if (!PROJECT_ID) return null;
  try {
    const res = await fetch(`${BASE_URL}/quizzes/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    const fields = parseFields(data.fields);
    return { id: docIdFromName(data.name), ...fields } as Quiz;
  } catch {
    return null;
  }
}

/** Lists every approved + public quiz — used to build the sitemap. */
export async function listApprovedQuizzesServerSide(): Promise<
  Pick<Quiz, "id" | "updatedAt">[]
> {
  if (!PROJECT_ID) return [];
  try {
    const res = await fetch(`${BASE_URL}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "quizzes" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: "status" },
                    op: "EQUAL",
                    value: { stringValue: "approved" },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: "visibility" },
                    op: "EQUAL",
                    value: { stringValue: "public" },
                  },
                },
              ],
            },
          },
          limit: 500,
        },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows
      .filter((r: { document?: unknown }) => r.document)
      .map((r: { document: { name: string; fields: Record<string, FirestoreValue> } }) => {
        const fields = parseFields(r.document.fields);
        return {
          id: docIdFromName(r.document.name),
          updatedAt: (fields.updatedAt as number) || Date.now(),
        };
      });
  } catch {
    return [];
  }
}
